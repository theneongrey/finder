using System.Collections.Concurrent;
using System.Net;
using System.Net.Sockets;
using System.Text;

namespace Finder.Business.Preview.Services.PreviewHelper;

/// <summary>
/// Minimal loopback HTTP forward proxy that the headless browser is forced through, so the SSRF
/// guard is applied at connect time to every hop the browser makes — including redirects, which
/// Playwright's route handler never sees, sub-resources, WebSockets, and DNS rebinding.
/// Supports CONNECT tunnels (https, wss) and absolute-form plain http requests.
/// </summary>
public sealed class GuardedForwardProxy : IAsyncDisposable
{
    private const int MaxHeaderBytes = 16 * 1024;

    private readonly TcpListener _listener = new(IPAddress.Loopback, 0);
    private readonly CancellationTokenSource _cts = new();
    private readonly Func<string, int, CancellationToken, Task<IPAddress[]?>> _resolveAllowed;
    private readonly Task _acceptLoop;
    private readonly ConcurrentDictionary<string, byte> _blockedTargets = new();

    /// <param name="resolveAllowed">Returns the addresses to connect to, or null when the host is not allowed.</param>
    public GuardedForwardProxy(Func<string, int, CancellationToken, Task<IPAddress[]?>> resolveAllowed)
    {
        _resolveAllowed = resolveAllowed;
        _listener.Start();
        _acceptLoop = AcceptLoopAsync();
    }

    public string Address => $"http://127.0.0.1:{((IPEndPoint)_listener.LocalEndpoint).Port}";

    /// <summary>True when the proxy refused to connect to this URL's host and port.</summary>
    public bool WasBlocked(string url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri) && _blockedTargets.ContainsKey(TargetKey(uri.IdnHost, uri.Port));

    private static string TargetKey(string host, int port) => $"{host.Trim('[', ']').ToLowerInvariant()}:{port}";

    /// <summary>Default policy: resolve the host and allow it only when every address is public.</summary>
    public static async Task<IPAddress[]?> ResolvePublicOnly(string host, int port, CancellationToken cancellationToken)
    {
        try
        {
            var addresses = IPAddress.TryParse(host.Trim('[', ']'), out var literal)
                ? [literal]
                : await Dns.GetHostAddressesAsync(host, cancellationToken);
            return addresses.Length > 0 && addresses.All(OutboundUrlGuard.IsPublicAddress) ? addresses : null;
        }
        catch (SocketException)
        {
            return null;
        }
    }

    private async Task AcceptLoopAsync()
    {
        try
        {
            while (!_cts.IsCancellationRequested)
            {
                var client = await _listener.AcceptTcpClientAsync(_cts.Token);
                _ = HandleClientAsync(client);
            }
        }
        catch (OperationCanceledException)
        {
        }
        catch (ObjectDisposedException)
        {
        }
    }

    private async Task HandleClientAsync(TcpClient client)
    {
        using (client)
        {
            try
            {
                var clientStream = client.GetStream();
                var header = await ReadHeaderAsync(clientStream, _cts.Token);
                if (header is null)
                {
                    return;
                }

                var requestLine = header.Text[..header.Text.IndexOf("\r\n", StringComparison.Ordinal)];
                var parts = requestLine.Split(' ');
                if (parts.Length != 3)
                {
                    await RespondAsync(clientStream, "400 Bad Request");
                    return;
                }

                var isConnect = parts[0].Equals("CONNECT", StringComparison.OrdinalIgnoreCase);
                if (!TryGetTarget(parts[1], isConnect, out var host, out var port))
                {
                    await RespondAsync(clientStream, "400 Bad Request");
                    return;
                }

                var addresses = await _resolveAllowed(host, port, _cts.Token);
                if (addresses is null)
                {
                    _blockedTargets.TryAdd(TargetKey(host, port), 0);
                    await RespondAsync(clientStream, "403 Forbidden");
                    return;
                }

                using var upstream = new TcpClient();
                await upstream.ConnectAsync(addresses, port, _cts.Token);
                var upstreamStream = upstream.GetStream();

                if (isConnect)
                {
                    await RespondAsync(clientStream, "200 Connection Established", closeAfter: false);
                }
                else
                {
                    // Origin servers must accept absolute-form request targets (RFC 9112 §3.2.2), so the
                    // request is forwarded as-is — except that the connection is closed afterwards, so the
                    // browser can't reuse this tunnel (already bound to one checked host) for another host.
                    await upstreamStream.WriteAsync(ForceConnectionClose(header), _cts.Token);
                }

                await Task.WhenAny(
                    clientStream.CopyToAsync(upstreamStream, _cts.Token),
                    upstreamStream.CopyToAsync(clientStream, _cts.Token));
            }
            catch (Exception ex) when (ex is IOException or SocketException or OperationCanceledException or ObjectDisposedException)
            {
                // Connection dropped or proxy shutting down.
            }
        }
    }

    private static bool TryGetTarget(string target, bool isConnect, out string host, out int port)
    {
        host = "";
        port = 0;

        if (isConnect)
        {
            // authority-form: host:port or [v6]:port
            var separator = target.LastIndexOf(':');
            if (separator <= 0 || !int.TryParse(target[(separator + 1)..], out port))
            {
                return false;
            }

            host = target[..separator].Trim('[', ']');
            return true;
        }

        if (!Uri.TryCreate(target, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttp)
        {
            return false;
        }

        host = uri.IdnHost;
        port = uri.Port;
        return true;
    }

    private sealed record Header(string Text, byte[] Bytes);

    private const string CrLf = "\r\n";

    private static byte[] ForceConnectionClose(Header header)
    {
        var headerEnd = header.Text.IndexOf(CrLf + CrLf, StringComparison.Ordinal);
        var lines = header.Text[..headerEnd]
            .Split(CrLf)
            .Where(line => !line.StartsWith("Connection:", StringComparison.OrdinalIgnoreCase) &&
                           !line.StartsWith("Proxy-Connection:", StringComparison.OrdinalIgnoreCase))
            .Append("Connection: close");
        var rewritten = Encoding.ASCII.GetBytes(string.Join(CrLf, lines) + CrLf + CrLf);
        // Bytes read past the header terminator are the start of the request body.
        return [.. rewritten, .. header.Bytes[(headerEnd + 4)..]];
    }

    /// <summary>Reads up to the end of the request headers; any bytes past that belong to the body and are kept.</summary>
    private static async Task<Header?> ReadHeaderAsync(NetworkStream stream, CancellationToken cancellationToken)
    {
        var buffer = new byte[MaxHeaderBytes];
        var length = 0;
        while (length < buffer.Length)
        {
            var read = await stream.ReadAsync(buffer.AsMemory(length), cancellationToken);
            if (read == 0)
            {
                return null;
            }

            length += read;
            var text = Encoding.ASCII.GetString(buffer, 0, length);
            if (text.Contains("\r\n\r\n", StringComparison.Ordinal))
            {
                return new Header(text, buffer[..length]);
            }
        }

        return null;
    }

    private static async Task RespondAsync(NetworkStream stream, string status, bool closeAfter = true)
    {
        var connection = closeAfter ? "Connection: close\r\nContent-Length: 0\r\n" : "";
        await stream.WriteAsync(Encoding.ASCII.GetBytes($"HTTP/1.1 {status}\r\n{connection}\r\n"));
    }

    public async ValueTask DisposeAsync()
    {
        await _cts.CancelAsync();
        _listener.Stop();
        try
        {
            await _acceptLoop;
        }
        catch (OperationCanceledException)
        {
        }

        _cts.Dispose();
    }
}

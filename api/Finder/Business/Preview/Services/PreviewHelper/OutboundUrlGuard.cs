using System.Net;
using System.Net.Sockets;

namespace Finder.Business.Preview.Services.PreviewHelper;

/// <summary>
/// SSRF guard for the preview fetchers. The preview endpoint fetches arbitrary user-supplied URLs
/// from inside our network, so every outbound request must be http(s) and resolve to a public
/// address — never loopback, the Docker network, link-local (cloud metadata), or other reserved ranges.
/// </summary>
public static class OutboundUrlGuard
{
    private static readonly (IPAddress Network, int PrefixLength)[] BlockedV4 =
    [
        (IPAddress.Parse("0.0.0.0"), 8),        // "this" network
        (IPAddress.Parse("10.0.0.0"), 8),       // private
        (IPAddress.Parse("100.64.0.0"), 10),    // carrier-grade NAT
        (IPAddress.Parse("127.0.0.0"), 8),      // loopback
        (IPAddress.Parse("169.254.0.0"), 16),   // link-local, cloud metadata
        (IPAddress.Parse("172.16.0.0"), 12),    // private (Docker default)
        (IPAddress.Parse("192.0.0.0"), 24),     // IETF protocol assignments
        (IPAddress.Parse("192.0.2.0"), 24),     // documentation
        (IPAddress.Parse("192.168.0.0"), 16),   // private
        (IPAddress.Parse("198.18.0.0"), 15),    // benchmarking
        (IPAddress.Parse("198.51.100.0"), 24),  // documentation
        (IPAddress.Parse("203.0.113.0"), 24),   // documentation
        (IPAddress.Parse("224.0.0.0"), 4),      // multicast
        (IPAddress.Parse("240.0.0.0"), 4),      // reserved + broadcast
    ];

    private static readonly (IPAddress Network, int PrefixLength)[] BlockedV6 =
    [
        (IPAddress.Parse("::"), 128),           // unspecified
        (IPAddress.Parse("::1"), 128),          // loopback
        (IPAddress.Parse("64:ff9b::"), 96),     // NAT64 — could embed a private IPv4
        (IPAddress.Parse("2001:db8::"), 32),    // documentation
        (IPAddress.Parse("fc00::"), 7),         // unique local
        (IPAddress.Parse("fe80::"), 10),        // link-local
        (IPAddress.Parse("ff00::"), 8),         // multicast
    ];

    public static bool IsAllowedScheme(Uri uri) =>
        uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps;

    public static bool IsPublicAddress(IPAddress address)
    {
        if (address.IsIPv4MappedToIPv6)
        {
            address = address.MapToIPv4();
        }

        var blocked = address.AddressFamily switch
        {
            AddressFamily.InterNetwork => BlockedV4,
            AddressFamily.InterNetworkV6 => BlockedV6,
            _ => null
        };

        return blocked is not null && !blocked.Any(range => IsInRange(address, range.Network, range.PrefixLength));
    }

    /// <summary>True when the URL is http(s) and every address its host resolves to is public.</summary>
    public static async Task<bool> IsSafeAsync(Uri uri, CancellationToken cancellationToken = default)
    {
        if (!IsAllowedScheme(uri))
        {
            return false;
        }

        try
        {
            var addresses = await ResolveAsync(uri.IdnHost, cancellationToken);
            return addresses.Length > 0 && addresses.All(IsPublicAddress);
        }
        catch (SocketException)
        {
            return false;
        }
    }

    /// <summary>
    /// <see cref="SocketsHttpHandler.ConnectCallback"/> that re-checks the address actually being
    /// connected to. Validating at connect time (rather than only up-front) also covers redirects
    /// and DNS rebinding.
    /// </summary>
    public static async ValueTask<Stream> ConnectToPublicAddressAsync(
        SocketsHttpConnectionContext context, CancellationToken cancellationToken)
    {
        var addresses = await ResolveAsync(context.DnsEndPoint.Host, cancellationToken);
        if (addresses.Length == 0 || !addresses.All(IsPublicAddress))
        {
            throw new HttpRequestException($"Outbound request to '{context.DnsEndPoint.Host}' is not allowed.");
        }

        var socket = new Socket(SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };
        try
        {
            await socket.ConnectAsync(addresses, context.DnsEndPoint.Port, cancellationToken);
            return new NetworkStream(socket, ownsSocket: true);
        }
        catch
        {
            socket.Dispose();
            throw;
        }
    }

    private static async Task<IPAddress[]> ResolveAsync(string host, CancellationToken cancellationToken)
    {
        if (IPAddress.TryParse(host.Trim('[', ']'), out var literal))
        {
            return [literal];
        }

        return await Dns.GetHostAddressesAsync(host, cancellationToken);
    }

    private static bool IsInRange(IPAddress address, IPAddress network, int prefixLength)
    {
        if (address.AddressFamily != network.AddressFamily)
        {
            return false;
        }

        var addressBytes = address.GetAddressBytes();
        var networkBytes = network.GetAddressBytes();
        var fullBytes = prefixLength / 8;
        var remainingBits = prefixLength % 8;

        for (var i = 0; i < fullBytes; i++)
        {
            if (addressBytes[i] != networkBytes[i])
            {
                return false;
            }
        }

        if (remainingBits == 0)
        {
            return true;
        }

        var mask = (byte)(0xFF << (8 - remainingBits));
        return (addressBytes[fullBytes] & mask) == (networkBytes[fullBytes] & mask);
    }
}

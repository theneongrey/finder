using System.Net;
using System.Net.Sockets;
using System.Text;
using Finder.Business.Preview.Services.PreviewHelper;
using Finder.Business.Preview.Setup;
using Microsoft.Extensions.Options;
using Xunit;

namespace Finder.Tests.Preview;

public class OutboundUrlGuardTests : IAsyncLifetime
{
    private readonly PlaywrightBrowserProvider _browserProvider = new();

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _browserProvider.DisposeAsync();

    [Theory]
    [InlineData("127.0.0.1")]
    [InlineData("10.1.2.3")]
    [InlineData("172.17.0.2")]
    [InlineData("192.168.1.10")]
    [InlineData("169.254.169.254")]
    [InlineData("100.64.0.1")]
    [InlineData("0.0.0.0")]
    [InlineData("::1")]
    [InlineData("fd00::1")]
    [InlineData("fe80::1")]
    [InlineData("::ffff:127.0.0.1")]
    [InlineData("::ffff:10.0.0.1")]
    public void IsPublicAddress_RejectsNonPublicRanges(string address)
    {
        Assert.False(OutboundUrlGuard.IsPublicAddress(IPAddress.Parse(address)));
    }

    [Theory]
    [InlineData("8.8.8.8")]
    [InlineData("172.32.0.1")]
    [InlineData("2a00:1450:4001:80b::200e")]
    public void IsPublicAddress_AcceptsPublicAddresses(string address)
    {
        Assert.True(OutboundUrlGuard.IsPublicAddress(IPAddress.Parse(address)));
    }

    [Theory]
    [InlineData("file:///etc/passwd")]
    [InlineData("ftp://example.com/")]
    [InlineData("http://127.0.0.1/")]
    [InlineData("http://localhost:5192/api/auth/who")]
    [InlineData("http://169.254.169.254/latest/meta-data/")]
    [InlineData("http://[::1]/")]
    public async Task IsSafeAsync_RejectsUnsafeUrls(string url)
    {
        Assert.False(await OutboundUrlGuard.IsSafeAsync(new Uri(url)));
    }

    [Fact]
    public async Task GuardedHttpClient_RefusesToConnectToLoopback()
    {
        using var listener = StartListener(out var port);
        using var client = new HttpClient(new SocketsHttpHandler
        {
            ConnectCallback = OutboundUrlGuard.ConnectToPublicAddressAsync
        });

        await Assert.ThrowsAsync<HttpRequestException>(() => client.GetStringAsync($"http://127.0.0.1:{port}/"));
        Assert.False(listener.Pending());
    }

    [Fact]
    public async Task PlaywrightGrabber_RefusesLoopbackUrl()
    {
        using var listener = StartListener(out var port);

        var result = await new HtmlGrabberPlaywrightService(CreateOptions(), _browserProvider).GetHtmlContent($"http://127.0.0.1:{port}/", PreviewLanguage.Default);

        Assert.False(result.IsSuccess);
        Assert.False(listener.Pending());
    }

    [Fact]
    public async Task PlaywrightGrabber_RefusesFileUrl()
    {
        var file = Path.GetTempFileName();
        await File.WriteAllTextAsync(file, "<html><head><title>secret</title></head></html>");
        try
        {
            var result = await new HtmlGrabberPlaywrightService(CreateOptions(), _browserProvider).GetHtmlContent(new Uri(file).AbsoluteUri, PreviewLanguage.Default);

            Assert.False(result.IsSuccess);
        }
        finally
        {
            File.Delete(file);
        }
    }

    [Fact]
    public async Task PlaywrightGrabber_ChecksRedirectTargetsToo()
    {
        using var blocked = StartListener(out var blockedPort);
        using var redirector = StartListener(out var redirectorPort);
        using var cts = new CancellationTokenSource();
        var serverTask = ServeRedirectAsync(redirector, $"http://127.0.0.1:{blockedPort}/", cts.Token);

        // Treat the redirector as "public" and everything else as internal, so the only way the
        // blocked listener gets hit is if the redirect target escapes the check.
        var grabber = new HtmlGrabberPlaywrightService(CreateOptions(), _browserProvider,
            (_, port, _) => Task.FromResult(port == redirectorPort ? new[] { IPAddress.Loopback } : null));

        var result = await grabber.GetHtmlContent($"http://127.0.0.1:{redirectorPort}/", PreviewLanguage.Default);
        await cts.CancelAsync();
        await serverTask;

        Assert.False(result.IsSuccess);
        Assert.False(blocked.Pending());
    }

    // Minimal HTTP server answering every connection (Chromium opens speculative sockets) with a 302.
    private static async Task ServeRedirectAsync(TcpListener listener, string location, CancellationToken cancellationToken)
    {
        const string crlf = "\r\n";
        var response = Encoding.ASCII.GetBytes(
            "HTTP/1.1 302 Found" + crlf + $"Location: {location}" + crlf + "Content-Length: 0" + crlf +
            "Connection: close" + crlf + crlf);
        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                var client = await listener.AcceptTcpClientAsync(cancellationToken);
                _ = Task.Run(async () =>
                {
                    using (client)
                    {
                        var stream = client.GetStream();
                        var buffer = new byte[4096];
                        if (await stream.ReadAsync(buffer, cancellationToken) > 0)
                        {
                            await stream.WriteAsync(response, cancellationToken);
                        }
                    }
                }, cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
        }
    }

    private static IOptions<PreviewOptions> CreateOptions() =>
        Options.Create(new PreviewOptions { PlaywrightTimeoutSeconds = 10 });

    // A raw TCP listener: Pending() tells us whether anything even attempted to connect.
    private static TcpListener StartListener(out int port)
    {
        var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        port = ((IPEndPoint)listener.LocalEndpoint).Port;
        return listener;
    }
}

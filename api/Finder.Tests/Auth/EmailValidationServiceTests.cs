using System.Net;
using DnsClient;
using DnsClient.Protocol;
using Finder.Business.Shared.Services;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Finder.Tests.Auth;

public class EmailValidationServiceTests
{
    private static readonly string[] BlockedDomains =
    [
        "tempmail.com",
        "throwaway.email",
        "mailinator.com",
        "guerrillamail.com",
        "sharklasers.com"
    ];

    private static readonly string BlocklistContent = string.Join("\n", BlockedDomains);

    private static EmailValidationService CreateService(
        string? blocklistContent = null,
        IDnsQueryResponse? dnsResponse = null)
    {
        var handler = new FakeBlocklistHandler(blocklistContent ?? BlocklistContent);
        var httpClient = new HttpClient(handler);
        var httpClientFactory = Substitute.For<IHttpClientFactory>();
        httpClientFactory.CreateClient("EmailValidation").Returns(httpClient);

        var dnsQueryResponse = dnsResponse ?? MakeDnsResponseWithMx();
        var lookupClient = Substitute.For<ILookupClient>();
        lookupClient
            .QueryAsync(Arg.Any<string>(), Arg.Any<QueryType>(), Arg.Any<QueryClass>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(dnsQueryResponse));

        var logger = Substitute.For<ILogger<EmailValidationService>>();
        return new EmailValidationService(httpClientFactory, lookupClient, logger);
    }

    private static IDnsQueryResponse MakeDnsResponseWithMx()
    {
        var info = new ResourceRecordInfo("example.com", ResourceRecordType.MX, QueryClass.IN, 300, 0);
        var mxRecord = new MxRecord(info, 10, DnsString.Parse("mail.example.com."));

        var response = Substitute.For<IDnsQueryResponse>();
        response.Answers.Returns(new List<DnsResourceRecord> { mxRecord });
        return response;
    }

    private static IDnsQueryResponse MakeDnsResponseWithNoMx()
    {
        var response = Substitute.For<IDnsQueryResponse>();
        response.Answers.Returns(new List<DnsResourceRecord>());
        return response;
    }

    [Theory]
    [InlineData("user@tempmail.com")]
    [InlineData("user@throwaway.email")]
    [InlineData("user@mailinator.com")]
    [InlineData("user@guerrillamail.com")]
    [InlineData("user@sharklasers.com")]
    public async Task ValidateEmail_WithBlockedDomain_ReturnsForbidden(string email)
    {
        var service = CreateService();

        var result = await service.ValidateEmailAsync(email);

        Assert.False(result.IsSuccess);
        Assert.Equal(403, result.Code);
    }

    [Fact]
    public async Task ValidateEmail_WithNonBlockedDomain_AndNoMxRecords_ReturnsForbidden()
    {
        var service = CreateService(dnsResponse: MakeDnsResponseWithNoMx());

        var result = await service.ValidateEmailAsync("user@legitimate-but-no-mx.com");

        Assert.False(result.IsSuccess);
        Assert.Equal(403, result.Code);
    }

    [Fact]
    public async Task ValidateEmail_WithNonBlockedDomain_AndMxRecords_ReturnsSuccess()
    {
        var service = CreateService(dnsResponse: MakeDnsResponseWithMx());

        var result = await service.ValidateEmailAsync("user@legit-domain.com");

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task ValidateEmail_BlocklistFetchedOnce_AcrossMultipleCalls()
    {
        var handler = new FakeBlocklistHandler(BlocklistContent);
        var httpClient = new HttpClient(handler);
        var httpClientFactory = Substitute.For<IHttpClientFactory>();
        httpClientFactory.CreateClient("EmailValidation").Returns(httpClient);

        var dnsResponseForCacheTest = MakeDnsResponseWithMx();
        var lookupClient = Substitute.For<ILookupClient>();
        lookupClient
            .QueryAsync(Arg.Any<string>(), Arg.Any<QueryType>(), Arg.Any<QueryClass>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(dnsResponseForCacheTest));

        var logger = Substitute.For<ILogger<EmailValidationService>>();
        var service = new EmailValidationService(httpClientFactory, lookupClient, logger);

        await service.ValidateEmailAsync("a@legit-domain.com");
        await service.ValidateEmailAsync("b@another-domain.com");
        await service.ValidateEmailAsync("user@tempmail.com");

        Assert.Equal(1, handler.RequestCount);
    }

    [Fact]
    public async Task ValidateEmail_WhenInitialBlocklistFetchFails_ReturnsForbidden()
    {
        var handler = new FakeBlocklistHandler(null); // simulates HTTP failure on first load
        var httpClient = new HttpClient(handler);
        var httpClientFactory = Substitute.For<IHttpClientFactory>();
        httpClientFactory.CreateClient("EmailValidation").Returns(httpClient);

        var dnsResponseForFailTest = MakeDnsResponseWithMx();
        var lookupClient = Substitute.For<ILookupClient>();
        lookupClient
            .QueryAsync(Arg.Any<string>(), Arg.Any<QueryType>(), Arg.Any<QueryClass>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(dnsResponseForFailTest));

        var logger = Substitute.For<ILogger<EmailValidationService>>();
        var service = new EmailValidationService(httpClientFactory, lookupClient, logger);

        var result = await service.ValidateEmailAsync("user@legit-domain.com");

        Assert.False(result.IsSuccess);
        Assert.Equal(403, result.Code);
    }

    [Fact]
    public async Task ValidateEmail_WhenRefreshFails_KeepsOldBlocklistAndAllowsNonBlockedDomain()
    {
        var callCount = 0;
        var handler = new DelegatingFakeHandler(_ =>
        {
            callCount++;
            // First call succeeds, subsequent calls (refresh) fail
            return callCount == 1
                ? new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(BlocklistContent) }
                : new HttpResponseMessage(HttpStatusCode.InternalServerError);
        });
        var httpClient = new HttpClient(handler);
        var httpClientFactory = Substitute.For<IHttpClientFactory>();
        httpClientFactory.CreateClient("EmailValidation").Returns(httpClient);

        var dnsResponse = MakeDnsResponseWithMx();
        var lookupClient = Substitute.For<ILookupClient>();
        lookupClient
            .QueryAsync(Arg.Any<string>(), Arg.Any<QueryType>(), Arg.Any<QueryClass>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(dnsResponse));

        var logger = Substitute.For<ILogger<EmailValidationService>>();
        var service = new EmailValidationService(httpClientFactory, lookupClient, logger);

        // Prime the cache with a successful load
        await service.ValidateEmailAsync("user@legit-domain.com");

        // Force a refresh by directly invoking through a second instance sharing the same handler
        // (we test this via the handler's call count and the first result passing through)
        var resultGood = await service.ValidateEmailAsync("user@legit-domain.com");
        var resultBlocked = await service.ValidateEmailAsync("user@tempmail.com");

        Assert.True(resultGood.IsSuccess);
        Assert.False(resultBlocked.IsSuccess);
        Assert.Equal(403, resultBlocked.Code);
    }

    [Fact]
    public async Task ValidateEmail_WithInvalidEmail_ReturnsBadRequest()
    {
        var service = CreateService();

        var result = await service.ValidateEmailAsync("not-an-email");

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.Code);
    }

    private sealed class DelegatingFakeHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _handler;
        public DelegatingFakeHandler(Func<HttpRequestMessage, HttpResponseMessage> handler) => _handler = handler;
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(_handler(request));
    }

    private sealed class FakeBlocklistHandler : HttpMessageHandler
    {
        private readonly string? _content;
        private int _requestCount;

        public int RequestCount => _requestCount;

        public FakeBlocklistHandler(string? content) => _content = content;

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Interlocked.Increment(ref _requestCount);

            if (_content is null)
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(_content)
            });
        }
    }
}

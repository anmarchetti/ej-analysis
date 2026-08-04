using System.Net;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using PointsOfInterest;
using PointsOfInterest.Ancillaries;

namespace easyJet.Holidays.External.AWS.PointsOfInterest.Tests;

public class HttpClientWrapperTests
{
    private static HttpClientWrapper CreateWrapper(HttpMessageHandler handler)
    {
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://example.com") };
        return new HttpClientWrapper(httpClient, Mock.Of<ILogger<HttpClientWrapper>>());
    }

    private static HttpClientWrapper CreateWrapper(HttpResponseMessage response)
    {
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync((HttpRequestMessage _, CancellationToken _) => response);
        return CreateWrapper(handler.Object);
    }

    [Fact]
    public async Task GetResponse_Valid_Returns()
    {
        using var response = new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{ \"value\": 1 }") };
        var wrapper = CreateWrapper(response);
        var result = await wrapper.GetResponse<TestDto>("https://example.com/test");
        Assert.Equal(1, result.Value);
    }

    [Fact]
    public async Task GetResponse_NullData_Throws()
    {
        using var response = new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("null") };
        var wrapper = CreateWrapper(response);
        await Assert.ThrowsAsync<PointsOfInterestException>(() => wrapper.GetResponse<TestDto>("https://example.com/test"));
    }

    [Fact]
    public async Task PostJson_Success_Returns()
    {
        using var response = new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{ \"value\": 2 }") };
        var wrapper = CreateWrapper(response);
        var result = await wrapper.PostJson<TestDto, TestDto>("https://example.com/test", new TestDto { Value = 1 });
        Assert.Equal(2, result!.Value);
    }

    [Fact]
    public async Task PostJson_RetryOnTransientStatus_ThenSuccess()
    {
        int calls = 0;
        using var handler = new DelegateHandler((req, ct) =>
        {
            calls++;
            if (calls == 1)
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
            }
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{ \"value\": 5 }")
            });
        });
        var wrapper = CreateWrapper(handler);
        var result = await wrapper.PostJson<TestDto, TestDto>("https://e.com/poi", new TestDto { Value = 1 });
        Assert.Equal(5, result!.Value);
        Assert.Equal(2, calls); // one retry
    }

    [Fact]
    public async Task PostJson_NonRetryableStatus_Throws_NoRetry()
    {
        int calls = 0;
        using var handler = new DelegateHandler((req, ct) =>
        {
            calls++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.BadRequest));
        });
        var wrapper = CreateWrapper(handler);
        await Assert.ThrowsAsync<HttpRequestException>(() => wrapper.PostJson<TestDto, TestDto>("https://e.com/poi", new TestDto()));
        Assert.Equal(1, calls);
    }

    [Fact]
    public async Task PostJson_RetryableStatus_ExceedsMax_Rethrows()
    {
        int calls = 0;
        using var handler = new DelegateHandler((req, ct) =>
        {
            calls++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.GatewayTimeout));
        });
        var wrapper = CreateWrapper(handler);
        await Assert.ThrowsAsync<HttpRequestException>(() => wrapper.PostJson<TestDto, TestDto>("https://e.com/poi", new TestDto()));
        // MaxRetries + initial = 5 attempts (MaxRetries is 4 in source)
        Assert.Equal(5, calls);
    }

    [Fact]
    public async Task PostJson_NetworkException_RetriesThenSuccess()
    {
        int calls = 0;
        using var handler = new DelegateHandler((req, ct) =>
        {
            calls++;
            if (calls < 3)
            {
                throw new HttpRequestException("network glitch");
            }
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{ \"value\": 9 }")
            });
        });
        var wrapper = CreateWrapper(handler);
        var result = await wrapper.PostJson<TestDto, TestDto>("https://e.com/poi", new TestDto());
        Assert.Equal(9, result!.Value);
        Assert.Equal(3, calls); // 2 failures + success
    }

    [Fact]
    public async Task PostJson_RetryAfterHeader_UsesHeaderThenSucceeds()
    {
        int calls = 0;
        using var handler = new DelegateHandler((req, ct) =>
        {
            calls++;
            if (calls == 1)
            {
                var resp = new HttpResponseMessage((HttpStatusCode)429); // TooManyRequests
                resp.Headers.TryAddWithoutValidation("Retry-After", "1");
                return Task.FromResult(resp);
            }
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{ \"value\": 3 }")
            });
        });
        var wrapper = CreateWrapper(handler);
        var result = await wrapper.PostJson<TestDto, TestDto>("https://e.com/poi", new TestDto());
        Assert.Equal(3, result!.Value);
        Assert.Equal(2, calls);
    }

    [Fact]
    public async Task PostJson_RetryAfterDateHeader_ParsesDateAndRetries()
    {
        int calls = 0;
        var date = DateTimeOffset.UtcNow.AddMilliseconds(100).ToUniversalTime();
        using var handler = new DelegateHandler((req, ct) =>
        {
            calls++;
            if (calls == 1)
            {
                var resp = new HttpResponseMessage(HttpStatusCode.ServiceUnavailable);
                resp.Headers.TryAddWithoutValidation("Retry-After", date.ToString("R"));
                return Task.FromResult(resp);
            }
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{ \"value\": 7 }")
            });
        });
        var wrapper = CreateWrapper(handler);
        var result = await wrapper.PostJson<TestDto, TestDto>("https://e.com/poi", new TestDto());
        Assert.Equal(7, result!.Value);
        Assert.Equal(2, calls);
    }

    [Fact]
    public async Task PostJson_CancellationToken_Cancels()
    {
        var tcs = new TaskCompletionSource();
        using var handler = new DelegateHandler(async (req, ct) =>
        {
            // wait until canceled
            try
            {
                await Task.Delay(5000, ct);
            }
            catch (OperationCanceledException) { }
            throw new TaskCanceledException();
        });
        var wrapper = CreateWrapper(handler);
        using var cts = new CancellationTokenSource();
        cts.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => wrapper.PostJson<TestDto, TestDto>("https://e.com/poi", new TestDto(), cts.Token));
    }

    [Fact]
    public async Task PostJson_SuccessNullBody_Throws_NoRetry()
    {
        int calls = 0;
        using var handler = new DelegateHandler((req, ct) =>
        {
            calls++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("null")
            });
        });
        var wrapper = CreateWrapper(handler);
        await Assert.ThrowsAsync<PointsOfInterestException>(() => wrapper.PostJson<TestDto, TestDto>("https://e.com/poi", new TestDto()));
        Assert.Equal(1, calls);
    }

    private sealed record TestDto
    {
        public int Value { get; set; }
    }

    private sealed class DelegateHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> _func;
        public DelegateHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> func)
        {
            _func = func;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => _func(request, cancellationToken);
    }
}

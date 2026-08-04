using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Models;
using easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Services;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Tests.Services;

public class HttpClientWrapperTests
{
    private static HttpClientWrapper CreateWrapper(Func<HttpRequestMessage, HttpResponseMessage> responder)
    {
        var handler = new DelegateHandler(responder);
        var client = new HttpClient(handler);
        return new HttpClientWrapper(client);
    }

    [Fact]
    public async Task GetOffers_ReturnsEmpty_WhenEndpointIsNull()
    {
        var wrapper = CreateWrapper(_ => new HttpResponseMessage(HttpStatusCode.OK));
        var result = await wrapper.GetOffers(null!, CancellationToken.None);
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOffers_ReturnsEmpty_WhenEndpointIsWhitespace()
    {
        var wrapper = CreateWrapper(_ => new HttpResponseMessage(HttpStatusCode.OK));
        var result = await wrapper.GetOffers(" ", CancellationToken.None);
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOffers_DeserializesList_WhenValidJsonReturned()
    {
        var offers = new List<HbgHotelDiscountOffer>
         {
             new HbgHotelDiscountOffer { AccommodationCode = "A1", DiscountPercentage =10, GiataCode =111, AccommodationName = "Hotel A", TravelWindowFrom = "2024-01-01", TravelWindowTo = "2024-01-06" },
             new HbgHotelDiscountOffer { AccommodationCode = "B2", DiscountPercentage =15, GiataCode =222, AccommodationName = "Hotel B", TravelWindowFrom = "2024-02-01", TravelWindowTo = "2024-02-11" }
         };
        var json = JsonSerializer.Serialize(offers);
        var wrapper = CreateWrapper(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        });
        var result = await wrapper.GetOffers("https://example.com/data", CancellationToken.None);
        result.Should().HaveCount(2);
        result.Select(o => o.AccommodationCode).Should().BeEquivalentTo(new[] { "A1", "B2" });
    }

    [Fact]
    public async Task GetOffers_ReturnsEmpty_WhenResponseJsonNull()
    {
        var wrapper = CreateWrapper(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("null", Encoding.UTF8, "application/json")
        });
        var result = await wrapper.GetOffers("https://example.com/data", CancellationToken.None);
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOffers_ReturnsEmpty_OnHttpRequestException()
    {
        var wrapper = CreateWrapper(_ => throw new HttpRequestException("network"));
        var result = await wrapper.GetOffers("https://example.com/data", CancellationToken.None);
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOffers_ReturnsEmpty_OnCancellation()
    {
        using var cts = new CancellationTokenSource();
        cts.Cancel();
        var wrapper = CreateWrapper(_ => throw new TaskCanceledException());
        var result = await wrapper.GetOffers("https://example.com/data", cts.Token);
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOffers_UsesProvidedEndpoint()
    {
        string? capturedUrl = null;
        var wrapper = CreateWrapper(req =>
        {
            capturedUrl = req.RequestUri?.ToString();
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("[]", Encoding.UTF8, "application/json")
            };
        });
        var endpoint = "https://example.com/offers";
        await wrapper.GetOffers(endpoint, CancellationToken.None);
        capturedUrl.Should().Be(endpoint);
    }

    private sealed class DelegateHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder;
        public DelegateHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) => _responder = responder;
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        => Task.FromResult(_responder(request));
    }
}

using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using AutoFixture;
using easyJet.Feature.Tracker.Models.Eskel;
using easyJet.Feature.Tracker.Services;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using NSubstitute.Extensions;
using Xunit;

namespace easyJet.Feature.Tracker.Tests.Services
{
    public class EskelServiceTests
    {
        private readonly Fixture fixture;
        private readonly EskelService sut;

        public EskelServiceTests()
        {
            fixture = new Fixture();

            sut = Substitute.ForPartsOf<EskelService>();
            sut.Configure().Endpoint.Returns("notARealEndpointJustTesting");
            sut.Configure().EskelToken.Returns("justSomeString");
            sut.Configure().MaxConcurrentTasks.Returns(7);
            sut.Configure().RequestTimeout.Returns(5);
        }

        [Fact]
        public async void GetBookings_OnExceptionFromHttpRequest_GathersEmptyResultList()
        {
            // Arrange
            var startDate = DateTime.UtcNow.AddDays(-3);
            var endDate = startDate.AddDays(3);

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetResponseAsyncFromProvidedClient(default, default)).DoNotCallBase();
            sut.Configure().GetResponseAsyncFromProvidedClient(default, default).ReturnsForAnyArgs(Task.FromException<HttpResponseMessage>(new Exception()));

            // Act
            var results = await sut.GetBookings(startDate, endDate);

            // Assert
            results.Should().NotBeNull();
            results.Should().BeEmpty();
        }

        [Fact]
        public async void GetBookings_WithNonOKResponses_GathersEmptyResultList()
        {
            // Arrange
            var startDate = DateTime.UtcNow.AddDays(-3);
            var endDate = startDate.AddDays(3);

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetResponseAsyncFromProvidedClient(default, default)).DoNotCallBase();
            sut.Configure().GetResponseAsyncFromProvidedClient(default, default).ReturnsForAnyArgs(Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.InternalServerError)));

            // Act
            var results = await sut.GetBookings(startDate, endDate);

            // Assert
            results.Should().NotBeNull();
            results.Should().BeEmpty();
        }

        [Fact]
        public async void GetBookings_RequestsPerDayBetweenStartAndEnd_GathersRequestResultsInList()
        {
            // Arrange
            var startDate = DateTime.UtcNow.AddDays(-3);
            var endDate = startDate.AddDays(3);

            sut.Configure().WhenForAnyArgs(substitute => substitute.GetResponseAsyncFromProvidedClient(default, default)).DoNotCallBase();
            sut.Configure().GetResponseAsyncFromProvidedClient(default, default).ReturnsForAnyArgs(Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonConvert.SerializeObject(new List<Booking>() { fixture.Create<Booking>(), fixture.Create<Booking>(), fixture.Create<Booking>() }))
                }));

            // Act
            var results = await sut.GetBookings(startDate, endDate);

            // Assert
            results.Should().NotBeNullOrEmpty();
        }
    }
}

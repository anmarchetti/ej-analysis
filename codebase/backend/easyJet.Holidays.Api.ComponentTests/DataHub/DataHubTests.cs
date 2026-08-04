using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Microsoft.Net.Http.Headers;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.DataHub
{
    public class DataHubTests : BaseFixtureAwareComponentTest
    {
        private readonly HttpClient _datahubClient;

        public DataHubTests(WebApplicationFixture webApp) : base(webApp)
        {
            _datahubClient = CreateClient();
            _datahubClient.DefaultRequestHeaders.Add(HeaderNames.Authorization, "secretMock");
        }

        [Fact]
        public async Task SynchronisePnr_Success()
        {
            var request = new DatahubSyncRequest()
            {
                Reservations = [new() { ReservationId = "77881122" }]
            };

            var response = await _datahubClient.PostAsJsonAsync($"/api/v1.0/shared-services/datahub/synchronize-seats", request);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task SynchronisePnr_ErrorResponse()
        {
            var request = new DatahubSyncRequest()
            {
                Reservations = [new() { ReservationId = "bad_res" }]
            };

            var response = await _datahubClient.PostAsJsonAsync($"/api/v1.0/shared-services/datahub/synchronize-seats", request);

            var content = await response.Content.ReadAsStringAsync();

            response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        }

        [Fact]
        public async Task SynchroniseFlightPnr_Success()
        {
            var request = new DatahubSyncRequest()
            {
                Reservations = [new() { ReservationId = "77881122" }]
            };

            var response = await _datahubClient.PostAsJsonAsync($"/api/v1.0/shared-services/datahub/synchronize-flights", request);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task SynchroniseFlightPnr_ErrorResponse()
        {
            var request = new DatahubSyncRequest()
            {
                Reservations = [new() { ReservationId = "bad_res" }]
            };

            var response = await _datahubClient.PostAsJsonAsync($"/api/v1.0/shared-services/datahub/synchronize-flights", request);

            var content = await response.Content.ReadAsStringAsync();

            response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        }
    }
}

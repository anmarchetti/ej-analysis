using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.RecommendedDestination;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Cms.Models.HealthEntryRequirements;
using easyJet.Holidays.External.Cms.Models.RecommendedDestination;
using easyJet.Holidays.External.Cms.Services;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using RecommendedDestinationResponse = easyJet.Holidays.External.Cms.Models.RecommendedDestination.RecommendedDestinationResponse;

namespace easyJet.Holidays.External.Cms.Tests.Services
{
    public class CmsContentServiceTests
    {
        private readonly IFixture _fixture;

        public CmsContentServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            var cmsSettings = Options.Create(new CmsSettings
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings
                {
                    GetHealthEntryRequirements = "api/PageContent/GetHealthEntryRequirements",
                    GetHealthEntryRequirementsFlightAndHotel = "api/PageContent/GetHealthEntryRequirementsFlightAndHotel"
                },
            });

            var cacheSettings = Options.Create(new CacheSettings
            {
                Buckets = new Buckets
                {
                    CMSContent = "CMSContent"
                }
            });

            _fixture.Inject(cmsSettings);
            _fixture.Inject(cacheSettings);
            _fixture.Inject<ICacheService>(new NoCacheService());
        }

        [Fact]
        public async Task GetHealthEntryRequirementsForAirport_RegularBooking_UsesStandardEndpoint()
        {
            var apiServiceMock = _fixture.Freeze<Mock<IApiService>>();
            var expectedRequirements = new List<HealthEntryRequirement> { new HealthEntryRequirement() };

            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<HealthEntryRequirementsRequest, HealthEntryRequirementsResponse>(
                    It.Is<HealthEntryRequirementsRequest>(r =>
                        r.Endpoint.ToString().Contains("GetHealthEntryRequirements") &&
                        !r.Endpoint.ToString().Contains("FlightAndHotel"))))
                .ReturnsAsync(new HealthEntryRequirementsResponse
                {
                    Payload = new JsonApiPayload<List<HealthEntryRequirement>> { Body = expectedRequirements }
                });

            var sut = _fixture.Create<CmsContentService>();

            var result = await sut.GetHealthEntryRequirementsForAirport("LGW", isFlightAndHotel: false);

            result.Should().BeEquivalentTo(expectedRequirements);
        }

        [Fact]
        public async Task GetHealthEntryRequirementsForAirport_FlightAndHotelBooking_UsesFlightAndHotelEndpoint()
        {
            var apiServiceMock = _fixture.Freeze<Mock<IApiService>>();
            var expectedRequirements = new List<HealthEntryRequirement> { new HealthEntryRequirement() };

            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<HealthEntryRequirementsRequest, HealthEntryRequirementsResponse>(
                    It.Is<HealthEntryRequirementsRequest>(r => r.Endpoint.ToString().Contains("FlightAndHotel"))))
                .ReturnsAsync(new HealthEntryRequirementsResponse
                {
                    Payload = new JsonApiPayload<List<HealthEntryRequirement>> { Body = expectedRequirements }
                });

            var sut = _fixture.Create<CmsContentService>();

            var result = await sut.GetHealthEntryRequirementsForAirport("LGW", isFlightAndHotel: true);

            result.Should().BeEquivalentTo(expectedRequirements);
        }

        [Fact]
        public async Task GetHealthEntryRequirementsForAirport_ApiThrows_ReturnsEmptyList()
        {
            var apiServiceMock = _fixture.Freeze<Mock<IApiService>>();

            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<HealthEntryRequirementsRequest, HealthEntryRequirementsResponse>(
                    It.IsAny<HealthEntryRequirementsRequest>()))
                .ThrowsAsync(new InvalidOperationException("CMS unavailable"));

            var sut = _fixture.Create<CmsContentService>();

            var result = await sut.GetHealthEntryRequirementsForAirport("LGW");

            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetSomethingDifferentDestinationsCodes_ReturnsOnlyDestinationsWithTag()
        {
            var apiServiceMock = _fixture.Freeze<Mock<IApiService>>();
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<RecommendedDestinationRequest, RecommendedDestinationResponse>(It.IsAny<RecommendedDestinationRequest>()))
                .ReturnsAsync(new RecommendedDestinationResponse
                {
                    Payload = new JsonApiPayload<Dictionary<string, CmsRecommendedDestination>>
                    {
                        Body = new Dictionary<string, CmsRecommendedDestination>
                        {
                            {
                                "ITLG",
                                new CmsRecommendedDestination
                                {
                                    Code = "ITLG",
                                    Tags = [ "THML" ]
                                }
                            },
                            {
                                "ITRO",
                                new CmsRecommendedDestination
                                {
                                    Code = "ITLG",
                                    Tags = []
                                }
                            }
                        }
                    }
                });

            var sut = _fixture.Create<CmsContentService>();

            var result = (await sut.GetSomethingDifferentDestinationsCodes()).ToArray();
            result.Should().NotBeNull();
            result.Length.Should().Be(1);
            result[0].Should().Be("ITLG");
        }
    }
}

using AutoFixture;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.MissedSearches;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.ReferenceData.Destinations;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers
{
    public class DestinationControllerTests
    {
        private readonly IFixture _fixture;
        private readonly Mock<IDestinationsService> _destinationsServiceMock = new();
        private readonly Mock<IReferenceDataService> _referenceDataServiceMock = new();
        private readonly Mock<IDestinationTitlesService> _destinationTitlesServiceMock = new();
        private readonly Mock<IRouteAvailabilityService> _routeAvailabilityServiceMock = new();
        private readonly Mock<ILanguageService> _languageServiceMock = new();
        private readonly Mock<IMissedSearchesService> _missedSearchesServiceMock = new();

        public DestinationControllerTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
        }

        [Theory]
#pragma warning disable xUnit1012 // Null should only be used for nullable parameters
        [InlineData(null)]
#pragma warning restore xUnit1012 // Null should only be used for nullable parameters
        [InlineData("")]
        [InlineData("AB")]
        public async Task Search_TooShortQuery_ReturnsBadRequest(string query)
        {
            var searchSettings = new SearchSettings
            {
                DestinationsMinCharacters = 3,
                StoreMissedSearches = true,
            };

            var sut = new DestinationController(
                _destinationsServiceMock.Object,
                _destinationTitlesServiceMock.Object,
                Options.Create(searchSettings),
                _routeAvailabilityServiceMock.Object,
                _referenceDataServiceMock.Object,
                _languageServiceMock.Object,
                _missedSearchesServiceMock.Object
                );

            var response = await sut.Search(query, It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime?>(), It.IsAny<DateTime>(), It.IsAny<int?>());

            response.Should().NotBeNull();
            response.Should().BeOfType<BadRequestObjectResult>();
            (response! as BadRequestObjectResult)!.Value.Should().Be("Search query must contain at least 3 characters");
        }

        [Theory]
        [AutoMoqData]
        public async Task Search_RouteValidationEnabled_ChecksRouteAvailability(string query, string from, int flexibleDays, DateTime? startDate, DateTime? endDate, int? duration)
        {
            var searchSettings = new SearchSettings
            {
                DisableRouteValidation = false
            };

            _routeAvailabilityServiceMock
                .Setup(x => x.GetDestinationAvailability(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime?>(), It.IsAny<DateTime>(), It.IsAny<int?>(), It.IsAny<string>()))
                .ReturnsAsync(new DestinationsSearchResponse
                {
                    Destinations = new List<DestinationItem>
                    {
                        new DestinationItem()
                    }
                });

            var sut = new DestinationController(
                _destinationsServiceMock.Object,
                _destinationTitlesServiceMock.Object,
                Options.Create(searchSettings),
                _routeAvailabilityServiceMock.Object,
                _referenceDataServiceMock.Object,
                _languageServiceMock.Object,
                _missedSearchesServiceMock.Object);

            await sut.Search(query, from, flexibleDays, startDate, endDate, duration);

            _routeAvailabilityServiceMock.Verify(
                x => x.GetDestinationAvailability(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime?>(), It.IsAny<DateTime>(), It.IsAny<int?>(), It.IsAny<string>()),
                Times.Once);

            _destinationsServiceMock.Verify(
                x => x.Search(It.IsAny<string>(), It.IsAny<DestinationFilter>()),
                Times.Never);
        }

        [Theory]
        [AutoMoqData]
        public async Task Search_RouteValidationDisabled_ChecksRouteAvailability(string query, string from, int flexibleDays, DateTime? startDate, DateTime? endDate, int? duration)
        {
            var searchSettings = new SearchSettings
            {
                DisableRouteValidation = true
            };

            _destinationsServiceMock
                .Setup(x => x.Search(It.IsAny<string>(), It.IsAny<DestinationFilter>()))
                .ReturnsAsync(new DestinationsSearchResponse
                {
                    Destinations = new List<DestinationItem>
                    {
                        new DestinationItem()
                    }
                });

            var sut = new DestinationController(
                _destinationsServiceMock.Object,
                _destinationTitlesServiceMock.Object,
                Options.Create(searchSettings),
                _routeAvailabilityServiceMock.Object,
                _referenceDataServiceMock.Object,
                _languageServiceMock.Object,
                _missedSearchesServiceMock.Object);

            await sut.Search(query, from, flexibleDays, startDate, endDate, duration);

            _routeAvailabilityServiceMock.Verify(
                x => x.GetDestinationAvailability(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime?>(), It.IsAny<DateTime>(), It.IsAny<int?>(), It.IsAny<string>()),
                Times.Never);

            _destinationsServiceMock.Verify(
                x => x.Search(It.IsAny<string>(), It.IsAny<DestinationFilter>()),
                Times.Once);
        }

        [Theory]
        [AutoMoqData]
        public async Task Search_NoDestinationsFound_SaveToDynamoDB(string query, string from, int flexibleDays, DateTime? startDate, DateTime? endDate, int? duration, string language)
        {
            var searchSettings = new SearchSettings
            {
                DisableRouteValidation = false,
                StoreMissedSearches = true,
            };

            _languageServiceMock
                .Setup(x => x.GetCurrentLanguage())
                .Returns(language);

            _routeAvailabilityServiceMock
                .Setup(x => x.GetDestinationAvailability(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime?>(), It.IsAny<DateTime>(), It.IsAny<int?>(), It.IsAny<string>()))
                .ReturnsAsync(new DestinationsSearchResponse
                {
                    Destinations = []
                });

            var sut = new DestinationController(
                _destinationsServiceMock.Object,
                _destinationTitlesServiceMock.Object,
                Options.Create(searchSettings),
                _routeAvailabilityServiceMock.Object,
                _referenceDataServiceMock.Object,
                _languageServiceMock.Object,
                _missedSearchesServiceMock.Object);

            await sut.Search(query, from, flexibleDays, startDate, endDate, duration);

            _missedSearchesServiceMock
                .Verify(x => x.Save(query, from, flexibleDays, startDate, endDate));
        }

        [Theory]
        [AutoMoqData]
        public async Task Search_NoDestinationsFound_SavingDisabled(string query, string from, int flexibleDays, DateTime? startDate, DateTime? endDate, int? duration, string language)
        {
            var searchSettings = new SearchSettings
            {
                DisableRouteValidation = false,
                StoreMissedSearches = false,
            };

            _languageServiceMock
                .Setup(x => x.GetCurrentLanguage())
                .Returns(language);

            _routeAvailabilityServiceMock
                .Setup(x => x.GetDestinationAvailability(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime?>(), It.IsAny<DateTime>(), It.IsAny<int?>(), It.IsAny<string>()))
                .ReturnsAsync(new DestinationsSearchResponse
                {
                    Destinations = []
                });

            var sut = new DestinationController(
                _destinationsServiceMock.Object,
                _destinationTitlesServiceMock.Object,
                Options.Create(searchSettings),
                _routeAvailabilityServiceMock.Object,
                _referenceDataServiceMock.Object,
                _languageServiceMock.Object,
                _missedSearchesServiceMock.Object);

            await sut.Search(query, from, flexibleDays, startDate, endDate, duration);

            _missedSearchesServiceMock
                .Verify(x => x.Save(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>()), Times.Never);
        }
    }
}

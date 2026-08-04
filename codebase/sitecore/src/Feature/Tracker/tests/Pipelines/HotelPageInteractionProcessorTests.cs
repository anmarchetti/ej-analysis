using System;
using System.Collections.Generic;
using easyJet.Feature.Tracker.Logging;
using easyJet.Feature.Tracker.Pipelines.HotelAnalytics;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using NSubstitute.Extensions;
using Sitecore.Analytics;
using Sitecore.Analytics.Data;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Marketing.Definitions.Goals;
using Sitecore.NSubstituteUtils;
using Xunit;
using Type = easyJet.Foundation.Destinations.Models.Domain.Type;

namespace easyJet.Feature.Tracker.Tests.Pipelines
{
    public class HotelPageInteractionProcessorTests
    {
        private readonly ITrackerLogger loggerMock;
        private readonly ITrackerProvider trackerProviderServiceMock;
        private readonly HotelPageInteractionProcessor sut;

        public HotelPageInteractionProcessorTests()
        {
            loggerMock = Substitute.For<ITrackerLogger>();
            trackerProviderServiceMock = Substitute.For<ITrackerProvider>();
            sut = Substitute.ForPartsOf<HotelPageInteractionProcessor>(loggerMock, trackerProviderServiceMock);
        }

        [Fact]
        public void Process_OnMissingGoal_CreatesAndPopulatesNewEventData()
        {
            // Arrange
            var hotelCode = "XYZ12345";
            var hotelName = "testName";
            var countryCode = "testCountry";
            var locationCode = "testLocation";
            var themeCode = "testTheme";
            var typeCode = "testType";

            PageEventData receivedData = null;

            var assertionCollection = new List<KeyValuePair<string, object>>()
            {
                new KeyValuePair<string, object>(Constants.HotelPageEvent.AccommodationId, hotelCode),
                new KeyValuePair<string, object>(Constants.HotelPageEvent.Name, hotelName),
                new KeyValuePair<string, object>(Constants.HotelPageEvent.CountryCode, countryCode),
                new KeyValuePair<string, object>(Constants.HotelPageEvent.LocationCode, locationCode),
                new KeyValuePair<string, object>(Constants.HotelPageEvent.ThemeCode, themeCode),
                new KeyValuePair<string, object>(Constants.HotelPageEvent.TypeCode, typeCode)
            };

            var item = new FakeItem().WithTemplate(Constants.TemplateIds.HotelPage);
            item.WithField(Constants.HotelItemFields.CodeKey, hotelCode);
            var destinationsSearchServiceMock = Substitute.For<IDestinationsSearchService>();
            var hotel = new Hotel()
            {
                Code = hotelCode,
                Name = hotelName,
                Country = new DatasourceObject() { Code = countryCode },
                Location = new DatasourceObject() { Code = locationCode },
                HotelTheme = new HotelTheme() { Code = themeCode },
                HighestPriorityType = new Type() { Code = typeCode }
            };

            destinationsSearchServiceMock.GetHotelsByAtcomCodes(default).ReturnsForAnyArgs(new Hotel[] { hotel });

            var freshGoalDefinition = Substitute.For<IGoalDefinition>();
            var alias = "testAlias";
            var goalID = Guid.NewGuid();
            freshGoalDefinition.Alias.Returns(alias);
            freshGoalDefinition.Id.Returns(goalID);

            trackerProviderServiceMock.CurrentTracker.Returns(Substitute.For<ITracker>());
            sut.Configure().When(substitute => substitute.GetContextItem()).DoNotCallBase();
            sut.Configure().GetContextItem().Returns(item);
            sut.Configure().When(substitute => substitute.ResolveDestinationsSearchService()).DoNotCallBase();
            sut.Configure().ResolveDestinationsSearchService().Returns(destinationsSearchServiceMock);

            sut.Configure().When(substitute => substitute.GetGoalData()).DoNotCallBase();
            sut.Configure().GetGoalData().Returns(null as Sitecore.Analytics.Model.PageEventData);
            sut.Configure().When(substitute => substitute.GetGoalDefinition()).DoNotCallBase();
            sut.Configure().GetGoalDefinition().Returns(freshGoalDefinition);
            sut.Configure().WhenForAnyArgs(substitute => substitute.RegisterPageEventData(default)).DoNotCallBase();
            sut.Configure().WhenForAnyArgs(substitute => substitute.RegisterPageEventData(default)).Do(ci => receivedData = ci[0] as PageEventData);

            // Act
            sut.Process(default);

            // Assert
            receivedData.Should().NotBeNull();
            receivedData.CustomValues.Should().Contain(assertionCollection);
        }

        [Fact]
        public void Process_WithMissingHotelPageVisitDefinitionId_ReturnsWithoutUpdatingValues()
        {
            // Arrange
            var hotelCode = "XYZ12345";
            var hotelName = "testName";
            var countryCode = "testCountry";
            var locationCode = "testLocation";
            var themeCode = "testTheme";
            var typeCode = "testType";

            var item = new FakeItem().WithTemplate(Constants.TemplateIds.HotelPage);
            item.WithField(Constants.HotelItemFields.CodeKey, hotelCode);
            var destinationsSearchServiceMock = Substitute.For<IDestinationsSearchService>();
            var hotel = new Hotel()
            {
                Code = hotelCode,
                Name = hotelName,
                Country = new DatasourceObject() { Code = countryCode },
                Location = new DatasourceObject() { Code = locationCode },
                HotelTheme = new HotelTheme() { Code = themeCode },
                HighestPriorityType = new Type() { Code = typeCode }
            };

            destinationsSearchServiceMock.GetHotelsByAtcomCodes(default).ReturnsForAnyArgs(new Hotel[] { hotel });

            trackerProviderServiceMock.CurrentTracker.Returns(Substitute.For<ITracker>());
            sut.Configure().When(substitute => substitute.GetContextItem()).DoNotCallBase();
            sut.Configure().GetContextItem().Returns(item);
            sut.Configure().When(substitute => substitute.ResolveDestinationsSearchService()).DoNotCallBase();
            sut.Configure().ResolveDestinationsSearchService().Returns(destinationsSearchServiceMock);

            sut.Configure().When(substitute => substitute.GetGoalData()).DoNotCallBase();
            sut.Configure().GetGoalData().Returns(null as Sitecore.Analytics.Model.PageEventData);
            sut.Configure().When(substitute => substitute.GetGoalDefinition()).DoNotCallBase();
            sut.Configure().GetGoalDefinition().Returns(null as IGoalDefinition);
            sut.Configure().When(substitute => substitute.RegisterPageEventData(default)).DoNotCallBase();

            // Act
            sut.Process(default);

            // Assert
            sut.DidNotReceiveWithAnyArgs().RegisterPageEventData(default);
        }

        [Fact]
        public void Process_WithAlreadyPresentGoal_UpdatesData()
        {
            // Arrange
            var hotelCode = "XYZ12345";
            var hotelName = "testName";
            var countryCode = "testCountry";
            var locationCode = "testLocation";
            var themeCode = "testTheme";
            var typeCode = "testType";

            var assertionCollection = new List<KeyValuePair<string, object>>()
            {
                new KeyValuePair<string, object>(Constants.HotelPageEvent.AccommodationId, hotelCode),
                new KeyValuePair<string, object>(Constants.HotelPageEvent.Name, hotelName),
                new KeyValuePair<string, object>(Constants.HotelPageEvent.CountryCode, countryCode),
                new KeyValuePair<string, object>(Constants.HotelPageEvent.LocationCode, locationCode),
                new KeyValuePair<string, object>(Constants.HotelPageEvent.ThemeCode, themeCode),
                new KeyValuePair<string, object>(Constants.HotelPageEvent.TypeCode, typeCode)
            };

            var item = new FakeItem().WithTemplate(Constants.TemplateIds.HotelPage);
            item.WithField(Constants.HotelItemFields.CodeKey, hotelCode);
            var destinationsSearchServiceMock = Substitute.For<IDestinationsSearchService>();
            var hotel = new Hotel()
            {
                Code = hotelCode,
                Name = hotelName,
                Country = new DatasourceObject() { Code = countryCode },
                Location = new DatasourceObject() { Code = locationCode },
                HotelTheme = new HotelTheme() { Code = themeCode },
                HighestPriorityType = new Type() { Code = typeCode }
            };

            destinationsSearchServiceMock.GetHotelsByAtcomCodes(default).ReturnsForAnyArgs(new Hotel[] { hotel });

            var goalData = new Sitecore.Analytics.Model.PageEventData();

            trackerProviderServiceMock.CurrentTracker.Returns(Substitute.For<ITracker>());
            sut.Configure().When(substitute => substitute.GetContextItem()).DoNotCallBase();
            sut.Configure().GetContextItem().Returns(item);
            sut.Configure().When(substitute => substitute.ResolveDestinationsSearchService()).DoNotCallBase();
            sut.Configure().ResolveDestinationsSearchService().Returns(destinationsSearchServiceMock);

            sut.Configure().When(substitute => substitute.GetGoalData()).DoNotCallBase();
            sut.Configure().GetGoalData().Returns(goalData);
            sut.Configure().When(substitute => substitute.GetGoalDefinition()).DoNotCallBase();
            sut.Configure().When(substitute => substitute.RegisterPageEventData(default)).DoNotCallBase();

            // Act
            sut.Process(default);

            // Assert
            sut.DidNotReceiveWithAnyArgs().GetGoalDefinition();
            sut.DidNotReceiveWithAnyArgs().RegisterPageEventData(default);

            goalData.CustomValues.Should().Contain(assertionCollection);
        }

        [Fact]
        public void Process_WhenServiceResolvingThrows_CatchesAndLogs()
        {
            // Arrange
            var item = new FakeItem().WithTemplate(Constants.TemplateIds.HotelPage);
            item.WithField(Constants.HotelItemFields.CodeKey, "XYZ12345");

            trackerProviderServiceMock.CurrentTracker.Returns(Substitute.For<ITracker>());
            sut.Configure().When(substitute => substitute.GetContextItem()).DoNotCallBase();
            sut.Configure().GetContextItem().Returns(item);
            sut.Configure().When(substitute => substitute.ResolveDestinationsSearchService()).DoNotCallBase();
            sut.Configure().ResolveDestinationsSearchService().Throws(new Exception());

            sut.Configure().When(substitute => substitute.GetGoalData()).DoNotCallBase();
            sut.Configure().When(substitute => substitute.GetGoalDefinition()).DoNotCallBase();
            sut.Configure().When(substitute => substitute.RegisterPageEventData(default)).DoNotCallBase();

            // Act
            sut.Process(default);

            // Assert
            loggerMock.ReceivedWithAnyArgs().Error(message: default, exception: default, owner: default);
            sut.DidNotReceiveWithAnyArgs().GetGoalData();
            sut.DidNotReceiveWithAnyArgs().GetGoalDefinition();
            sut.DidNotReceiveWithAnyArgs().RegisterPageEventData(default);
        }

        [Fact]
        public void Process_WhenHotelCannotBeFound_LogsErrorAndReturns()
        {
            // Arrange
            var item = new FakeItem().WithTemplate(Constants.TemplateIds.HotelPage);
            item.WithField(Constants.HotelItemFields.CodeKey, "XYZ12345");
            var destinationsSearchServiceMock = Substitute.For<IDestinationsSearchService>();
            var hotel = null as Hotel;

            destinationsSearchServiceMock.GetHotelsByAtcomCodes(default).ReturnsForAnyArgs(new Hotel[] { hotel });

            trackerProviderServiceMock.CurrentTracker.Returns(Substitute.For<ITracker>());
            sut.Configure().When(substitute => substitute.GetContextItem()).DoNotCallBase();
            sut.Configure().GetContextItem().Returns(item);
            sut.Configure().When(substitute => substitute.ResolveDestinationsSearchService()).DoNotCallBase();
            sut.Configure().ResolveDestinationsSearchService().Returns(destinationsSearchServiceMock);

            sut.Configure().When(substitute => substitute.GetGoalData()).DoNotCallBase();
            sut.Configure().When(substitute => substitute.GetGoalDefinition()).DoNotCallBase();
            sut.Configure().When(substitute => substitute.RegisterPageEventData(default)).DoNotCallBase();

            // Act
            sut.Process(default);

            // Assert
            loggerMock.ReceivedWithAnyArgs().Error(message: default, owner: default);
            sut.DidNotReceiveWithAnyArgs().GetGoalData();
            sut.DidNotReceiveWithAnyArgs().GetGoalDefinition();
            sut.DidNotReceiveWithAnyArgs().RegisterPageEventData(default);
        }

        [Fact]
        public void Process_WhenContextItemIsNeitherHotelPageNorHotelDetailsPage_ReturnsWithoutFurtherAction()
        {
            // Arrange
            var item = new FakeItem().WithTemplate(ID.NewID); // so that Template is neither HotelPage nor HotelDetails

            trackerProviderServiceMock.CurrentTracker.Returns(Substitute.For<ITracker>());
            sut.Configure().When(substitute => substitute.GetContextItem()).DoNotCallBase();
            sut.Configure().GetContextItem().Returns(item);
            sut.Configure().When(substitute => substitute.ResolveDestinationsSearchService()).DoNotCallBase();
            sut.Configure().When(substitute => substitute.GetGoalData()).DoNotCallBase();
            sut.Configure().When(substitute => substitute.GetGoalDefinition()).DoNotCallBase();
            sut.Configure().When(substitute => substitute.RegisterPageEventData(default)).DoNotCallBase();

            // Act
            sut.Process(default);

            // Assert
            sut.DidNotReceiveWithAnyArgs().ResolveDestinationsSearchService();
            sut.DidNotReceiveWithAnyArgs().GetGoalData();
            sut.DidNotReceiveWithAnyArgs().GetGoalDefinition();
            sut.DidNotReceiveWithAnyArgs().RegisterPageEventData(default);
        }

        [Fact]
        public void Process_WhenContextItemIsNull_ReturnsWithoutFurtherAction()
        {
            // Arrange
            trackerProviderServiceMock.CurrentTracker.Returns(Substitute.For<ITracker>());
            sut.Configure().When(substitute => substitute.GetContextItem()).DoNotCallBase();
            sut.Configure().GetContextItem().ReturnsForAnyArgs(null as Item);
            sut.Configure().When(substitute => substitute.ResolveDestinationsSearchService()).DoNotCallBase();
            sut.Configure().When(substitute => substitute.GetGoalData()).DoNotCallBase();
            sut.Configure().When(substitute => substitute.GetGoalDefinition()).DoNotCallBase();
            sut.Configure().When(substitute => substitute.RegisterPageEventData(default)).DoNotCallBase();

            // Act
            sut.Process(default);

            // Assert
            sut.DidNotReceiveWithAnyArgs().ResolveDestinationsSearchService();
            sut.DidNotReceiveWithAnyArgs().GetGoalData();
            sut.DidNotReceiveWithAnyArgs().GetGoalDefinition();
            sut.DidNotReceiveWithAnyArgs().RegisterPageEventData(default);
        }

        [Fact]
        public void Process_WithoutCurrentTracker_ReturnsWithoutFurtherAction()
        {
            // Arrange
            trackerProviderServiceMock.CurrentTracker.Returns(null as ITracker);
            sut.Configure().When(substitute => substitute.GetContextItem()).DoNotCallBase();
            sut.Configure().When(substitute => substitute.ResolveDestinationsSearchService()).DoNotCallBase();
            sut.Configure().When(substitute => substitute.GetGoalData()).DoNotCallBase();
            sut.Configure().When(substitute => substitute.GetGoalDefinition()).DoNotCallBase();
            sut.Configure().When(substitute => substitute.RegisterPageEventData(default)).DoNotCallBase();

            // Act
            sut.Process(default);

            // Assert
            sut.DidNotReceiveWithAnyArgs().GetContextItem();
            sut.DidNotReceiveWithAnyArgs().ResolveDestinationsSearchService();
            sut.DidNotReceiveWithAnyArgs().GetGoalData();
            sut.DidNotReceiveWithAnyArgs().GetGoalDefinition();
            sut.DidNotReceiveWithAnyArgs().RegisterPageEventData(default);
        }
    }
}

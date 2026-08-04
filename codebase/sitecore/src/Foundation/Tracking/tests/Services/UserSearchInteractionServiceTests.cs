using System;
using System.Collections.Generic;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.PushNotifications.Facets;
using easyJet.Foundation.Tracking.Extenstions;
using easyJet.Foundation.Tracking.Logging;
using easyJet.Foundation.Tracking.Models.Requests;
using easyJet.Foundation.Tracking.Services;
using NSubstitute;
using Sitecore.Analytics;
using Sitecore.Analytics.Tracking;
using Sitecore.ContentSearch.Linq;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Tracking.Tests.Services
{
    public class UserSearchInteractionServiceTests
    {
        private readonly UserSearchInteractionService sut;
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IAirportRepository airportRepository;
        private readonly ITrackingLogger logger;
        private readonly IContactService contactService;

        public UserSearchInteractionServiceTests()
        {
            contactService = Substitute.For<IContactService>();
            logger = Substitute.For<ITrackingLogger>();
            airportRepository = Substitute.For<IAirportRepository>();
            destinationsRepository = Substitute.For<IDestinationsRepository>();
            sut = Substitute.ForPartsOf<UserSearchInteractionService>(contactService, destinationsRepository, airportRepository, logger);
        }

        [Fact]
        public void Add_ShouldThrowArgumentException_IfCannotFindAnyAirports()
        {
            // Act/Assert
            Assert.Throws<ArgumentNullException>(() => sut.Add(new UserSearchRequest()));
        }

        [Fact]
        public void ClearInteractionsAsync_ShouldThrowException_IfXConnectClientCannotBeCreated()
        {
            // Act/Assert
            Assert.Throws<InvalidOperationException>(() => sut.ClearInteractionsAsync(DateTime.Now).GetAwaiter().GetResult());
        }

        [Fact]
        public void Add_ShouldThrowArgumentException_IfFromAirportIsNotFound()
        {
            // Arrange
            var userSearchRequest = new UserSearchRequest
            {
                From = new List<string> { "FROM" },
                To = new List<string> { "TO" },
                StartDate = "2020-01-01",
                EndDate = "2020-01-01"
            };
            var searchByAirportCodeHits = new SearchResults<BaseDatasourceSearchResultItem>(new List<SearchHit<BaseDatasourceSearchResultItem>>(), 0);
            airportRepository.SearchByAirportCode(Arg.Any<List<string>>()).ReturnsForAnyArgs(searchByAirportCodeHits);

            // Act
            Assert.Throws<ArgumentException>(() => sut.Add(userSearchRequest));

            // Assert
            logger.Received().Warn(Arg.Any<string>(), sut);
        }

        [Fact]
        public void Add_ShouldThrowArgumentException_IfToAirportIsNotFound()
        {
            // Arrange
            var userSearchRequest = new UserSearchRequest
            {
                From = new List<string> { "FROM" },
                To = new List<string> { "TO" },
                StartDate = "2020-01-01",
                EndDate = "2020-01-01"
            };
            var airportFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Airport).WithName("FROM").WithField(Destinations.Constants.Fields.DatasourceItem.Code, "FROM");
            var searchByAirportCodeHits = new SearchResults<BaseDatasourceSearchResultItem>(
                new[]
                {
                    new SearchHit<BaseDatasourceSearchResultItem>(1f, new BaseDatasourceSearchResultItem
                    {
                        TemplateId = Destinations.Constants.TemplateIds.Airport,
                        Code = "FROM",
                        ItemName = "FROM",
                        TemplateName = "Airport",
                        ItemId = airportFakeItem.ID,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    })
                }, 1);
            var searchByCodesHits = new SearchResults<BaseDestinationsSearchResultItem>(new List<SearchHit<BaseDestinationsSearchResultItem>>(), 0);
            airportRepository.SearchByAirportCode(Arg.Any<List<string>>()).ReturnsForAnyArgs(searchByAirportCodeHits);
            destinationsRepository.SearchByCodes(Arg.Any<List<string>>()).ReturnsForAnyArgs(searchByCodesHits);

            // Act
            Assert.Throws<ArgumentException>(() => sut.Add(userSearchRequest));

            // Assert
            logger.Received().Warn(Arg.Any<string>(), sut);
        }

        [Fact]
        public void Add_ShouldThrowArgumentException_IfToAirportIsNotFound2()
        {
            // Arrange
            var userSearchRequest = new UserSearchRequest
            {
                From = new List<string> { "FROM" },
                To = new List<string> { "TO" },
                StartDate = "2020-01-01",
                EndDate = "2020-01-01"
            };
            var airportFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Airport).WithName("FROM").WithField(Destinations.Constants.Fields.DatasourceItem.Code, "FROM");
            var searchByAirportCodeHits = new SearchResults<BaseDatasourceSearchResultItem>(
                new[]
                {
                    new SearchHit<BaseDatasourceSearchResultItem>(1f, new BaseDatasourceSearchResultItem
                    {
                        TemplateId = Destinations.Constants.TemplateIds.Airport,
                        Code = "FROM",
                        ItemName = "FROM",
                        TemplateName = "Airport",
                        ItemId = airportFakeItem.ID,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    })
                }, 1);
            var searchByCodesHits = new SearchResults<BaseDestinationsSearchResultItem>(
                new[]
                {
                    new SearchHit<BaseDestinationsSearchResultItem>(1f, new BaseDestinationsSearchResultItem
                    {
                        TemplateId = Destinations.Constants.TemplateIds.Airport,
                        Code = "FROM",
                        ItemName = "FROM",
                        TemplateName = "Airport",
                        ItemId = airportFakeItem.ID,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    })
                }, 1);
            airportRepository.SearchByAirportCode(Arg.Any<List<string>>()).ReturnsForAnyArgs(searchByAirportCodeHits);
            destinationsRepository.SearchByCodes(Arg.Any<List<string>>()).ReturnsForAnyArgs(searchByCodesHits);
            var tracker = Substitute.For<ITracker>();
            tracker.IsActive.Returns(true);
            tracker.Contact.Returns(Substitute.For<Contact>());
            var interaction = Substitute.For<CurrentInteraction>();
            tracker.Interaction.Returns(interaction);

            // Act
            using (new TrackerSwitcher(tracker))
            {
                sut.Add(userSearchRequest);

                // Assert
                logger.Received().Debug(Arg.Any<string>(), sut);
            }
        }
    }
}

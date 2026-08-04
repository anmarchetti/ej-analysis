using System.Collections.Generic;
using System.Linq;
using AutoFixture;
using easyJet.Feature.Tracker.Commands.Profiles;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.Analytics.Models.Profiles;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.Tracker.Tests.Commands.Profiles
{
    public class RunDestinationProfileCardImportCommandTests
    {
        private readonly Fixture fixture;
        private readonly IDestinationsRepository destinationsRepoMock;
        private readonly ICsvUtilsService csvUtilServiceMock;
        private readonly IProfileService profileServiceMock;
        private readonly IAnalyticsLogger loggerMock;
        private readonly RunDestinationsProfileCardImportCommandProxy sut;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunDestinationProfileCardImportCommandTests()
        {
            fixture = new Fixture();
            destinationsRepoMock = Substitute.For<IDestinationsRepository>();
            csvUtilServiceMock = Substitute.For<ICsvUtilsService>();
            profileServiceMock = Substitute.For<IProfileService>();
            loggerMock = Substitute.For<IAnalyticsLogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            sut = Substitute.ForPartsOf<RunDestinationsProfileCardImportCommandProxy>(destinationsRepoMock, csvUtilServiceMock, profileServiceMock, databaseProvider, loggerMock, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void SynchronizeItem_SynchronizesItems()
        {
            // Arrange
            var foundDestinationCode = "aCodeThatMatches";
            var foundBeachCode = 11;
            var foundCityCode = 12;
            var foundLakeCode = 13;

            var matchItemID = ID.NewID;

            var fakeSearchHitItem = new FakeItem(matchItemID);

            var searchHitDocumentSub = Substitute.ForPartsOf<BaseDestinationsSearchResultItem>();
            searchHitDocumentSub.Code = foundDestinationCode;
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(fakeSearchHitItem);

            var notFoundDestinationCode = "aCodeThatDoesNotMatch";
            var notFoundBeachCode = 21;
            var notFoundCityCode = 22;
            var notFoundLakeCode = 23;

            sut.Configure().When(substitute => substitute.GetFileDataFromItem<LocationProfileTypeCsv>(default)).DoNotCallBase();
            sut.Configure().GetFileDataFromItem<LocationProfileTypeCsv>(default).ReturnsForAnyArgs(new List<LocationProfileTypeCsv>()
            {
                new LocationProfileTypeCsv() { Code = foundDestinationCode, Beach = foundBeachCode, City = foundCityCode, Lakes = foundLakeCode },
                new LocationProfileTypeCsv() { Code = notFoundDestinationCode, Beach = notFoundBeachCode, City = notFoundCityCode, Lakes = notFoundLakeCode }
            });

            destinationsRepoMock.SearchByCodes(default).ReturnsForAnyArgs(new SearchResults<BaseDestinationsSearchResultItem>(new List<SearchHit<BaseDestinationsSearchResultItem>>() { new SearchHit<BaseDestinationsSearchResultItem>(1f, searchHitDocumentSub) }, 1));

            // Act
            var result = sut.SynchronizeItemsProxy(null)?.ToList();

            // Assert
            profileServiceMock.Received().TagGenericProfile(
                Arg.Is<Item>(argument => argument.ID.Equals(matchItemID)),
                Arg.Is<HotelThemesProfile>(argument =>
                    argument.Beach == foundBeachCode &&
                    argument.City == foundCityCode &&
                    argument.Lakes == foundLakeCode),
                Arg.Any<TagChildrenSettings>());
            profileServiceMock.DidNotReceive().TagGenericProfile(
                Arg.Any<Item>(),
                Arg.Is<HotelThemesProfile>(argument =>
                    argument.Beach == notFoundBeachCode &&
                    argument.City == notFoundCityCode &&
                    argument.Lakes == notFoundLakeCode),
                Arg.Any<TagChildrenSettings>());
            result.Should().NotBeNullOrEmpty();
            result.Should().Contain(fakeSearchHitItem);
        }

        public class RunDestinationsProfileCardImportCommandProxy : RunDestinationProfileCardImportCommand
        {
            public RunDestinationsProfileCardImportCommandProxy(
                IDestinationsRepository destinationsRepository,
                ICsvUtilsService csvUtilsService,
                IProfileService profileService,
                IDatabaseProvider databaseProvider,
                IAnalyticsLogger logger,
                IUserCreationService userCreationService,
                ISitecoreUIService sitecoreUiService)
                : base(destinationsRepository, csvUtilsService, profileService, databaseProvider, logger, userCreationService, sitecoreUiService)
            {
            }

            public IEnumerable<Item> SynchronizeItemsProxy(Item ctxItem) => base.ProcessItems(ctxItem);
        }
    }
}

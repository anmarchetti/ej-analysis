using System.Collections.Generic;
using System.Linq;
using AutoFixture;
using easyJet.Feature.Tracker.Commands.Profiles;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Feature.Tracker.Tests.Commands.Profiles
{
    public class RunDestinationProfileCardExportCommandTests
    {
        private readonly Fixture fixture;

        private readonly IDestinationsRepository destinationsRepoMock;
        private readonly ICustomCacheRepository customCacheRepoMock;
        private readonly ICsvUtilsService csvUtilsServiceMock;
        private readonly IAnalyticsLogger loggerMock;
        private readonly RunDestinationProfileCardExportCommand sut;
        private readonly IDatabaseProvider databaseProvider;
        private readonly ISitecoreUIService sitecoreUIService;

        public RunDestinationProfileCardExportCommandTests()
        {
            fixture = new Fixture();
            destinationsRepoMock = Substitute.For<IDestinationsRepository>();
            customCacheRepoMock = Substitute.For<ICustomCacheRepository>();
            csvUtilsServiceMock = Substitute.For<ICsvUtilsService>();
            loggerMock = Substitute.For<IAnalyticsLogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            sitecoreUIService = Substitute.For<ISitecoreUIService>();
            sut = Substitute.ForPartsOf<RunDestinationProfileCardExportCommand>(destinationsRepoMock, customCacheRepoMock, csvUtilsServiceMock, databaseProvider, sitecoreUIService, loggerMock);
        }

        [Fact]
        public void Execute_WithCheckedExportResortsOnContextItem_AttemptsToAddRegionsToExport()
        {
            // Arrange
            var codeOfRegion = "thisShouldShowUp";
            var codeOfResort = "thisShouldAlsoShowUp!";
            var codeOfVirtualResort = "thisShouldAlsoShowUpToo!";
            var ctxItem = new FakeItem().WithField(Constants.Profiles.Fields.ExportResortsCheckbox, "1");
            var ctx = new CommandContext(ctxItem);

            var mockEndPoint = "testEndPoint";
            ctx.Parameters[Foundation.SitecoreExtensions.Constants.QueryStringParams.Endpoint] = mockEndPoint;

            var regionItem = new FakeItem()
                .WithField(Foundation.Destinations.Constants.Fields.DatasourceItem.Code, codeOfRegion)
                .WithField(Foundation.Destinations.Constants.Fields.DatasourceItem.Name, fixture.Create<string>())
                .WithChild(
                    new FakeItem()
                        .WithTemplate(Foundation.Destinations.Constants.TemplateIds.Resort)
                        .WithField(Foundation.Destinations.Constants.Fields.DatasourceItem.Code, codeOfResort))
                .WithChild(
                    new FakeItem()
                        .WithTemplate(Foundation.Destinations.Constants.TemplateIds.VirtualResort)
                        .WithField(Foundation.Destinations.Constants.Fields.DatasourceItem.Code, codeOfVirtualResort));

            var searchHitDocument = Substitute.ForPartsOf<BaseDatasourceSearchResultItem>();
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(regionItem);
            destinationsRepoMock.GetAllRegions().Returns(new SearchResults<BaseDatasourceSearchResultItem>(
                new List<SearchHit<BaseDatasourceSearchResultItem>>()
                {
                    new SearchHit<BaseDatasourceSearchResultItem>(1f, searchHitDocument)
                }, 1));

            // Act
            sut.Execute(ctx);

            // Assert
            csvUtilsServiceMock.Received().WriteToCsv(Arg.Is<List<LocationProfileTypeCsv>>(argument => argument.Any(item => item.Code == codeOfRegion) && argument.Any(item => item.Code == codeOfResort) && argument.Any(item => item.Code == codeOfVirtualResort)), delimeter: Arg.Any<string>());
            customCacheRepoMock.ReceivedWithAnyArgs().StoreItem<byte[]>(default, default, default);
            sitecoreUIService.Received(1).SheerResponse_Eval(Arg.Any<string>());
        }

        [Fact]
        public void Execute_WithUncheckedExportResortsOnContextItem_DoesNotAddRegionsToExport()
        {
            // Arrange
            var codeOfRegion = "thisShouldShowUp";
            var codeOfResort = "thisShouldNotShowUp";
            var codeOfVirtualResort = "thisShouldNotShowUpEither";
            var ctxItem = new FakeItem().WithField(Constants.Profiles.Fields.ExportResortsCheckbox, "0");
            var ctx = new CommandContext(ctxItem);

            var mockEndPoint = "testEndPoint";
            ctx.Parameters[Foundation.SitecoreExtensions.Constants.QueryStringParams.Endpoint] = mockEndPoint;

            var regionItem = new FakeItem()
                .WithField(Foundation.Destinations.Constants.Fields.DatasourceItem.Code, codeOfRegion)
                .WithField(Foundation.Destinations.Constants.Fields.DatasourceItem.Name, fixture.Create<string>())
                .WithChild(
                    new FakeItem()
                        .WithTemplate(Foundation.Destinations.Constants.TemplateIds.Resort)
                        .WithField(Foundation.Destinations.Constants.Fields.DatasourceItem.Code, codeOfResort))
                .WithChild(
                    new FakeItem()
                        .WithTemplate(Foundation.Destinations.Constants.TemplateIds.VirtualResort)
                        .WithField(Foundation.Destinations.Constants.Fields.DatasourceItem.Code, codeOfVirtualResort));

            var searchHitDocument = Substitute.ForPartsOf<BaseDatasourceSearchResultItem>();
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(regionItem);

            destinationsRepoMock.GetAllRegions().Returns(new SearchResults<BaseDatasourceSearchResultItem>(
                new List<SearchHit<BaseDatasourceSearchResultItem>>()
                {
                    new SearchHit<BaseDatasourceSearchResultItem>(1f, searchHitDocument)
                }, 1));

            // Act
            sut.Execute(ctx);

            // Assert
            csvUtilsServiceMock.Received().WriteToCsv(Arg.Is<List<LocationProfileTypeCsv>>(argument => argument.Any(item => item.Code == codeOfRegion) && argument.All(item => item.Code != codeOfResort) && argument.All(item => item.Code != codeOfVirtualResort)), delimeter: Arg.Any<string>());
            customCacheRepoMock.ReceivedWithAnyArgs().StoreItem<byte[]>(default, default, default);
            sitecoreUIService.Received(1).SheerResponse_Eval(Arg.Any<string>());
        }
    }
}

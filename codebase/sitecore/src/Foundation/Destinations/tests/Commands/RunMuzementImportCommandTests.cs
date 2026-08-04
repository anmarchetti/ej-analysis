using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Commands;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class RunMuzementImportCommandTests
    {
        private readonly RunMuzementImportCommand runMuzementImportCommand;
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IDestinationsLogger destinationsLogger;
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunMuzementImportCommandTests()
        {
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            destinationsLogger = Substitute.For<IDestinationsLogger>();
            destinationsSearchService = Substitute.For<IDestinationsSearchService>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            runMuzementImportCommand = Substitute.ForPartsOf<RunMuzementImportCommand>(csvUtilsService, databaseProvider, destinationsLogger, destinationsSearchService, userCreationService, sitecoreUiService);
        }

        [Theory]
        [AutoData]
        public void SynchronizeItems_ShouldBeEmpty_IfThereNoData(Db db)
        {
            // Arrange
            var muzementSettingsDbItem = new DbItem("Muzement Settings", ID.NewID, Constants.TemplateIds.MuzementSettings);
            muzementSettingsDbItem.Fields.Add(Constants.Fields.Message.Output, string.Empty);
            muzementSettingsDbItem.Fields.Add(Constants.Fields.MuzementSettings.RegionRadius, string.Empty);
            muzementSettingsDbItem.Fields.Add(Constants.Fields.MuzementSettings.MuzementDestinationsImport, string.Empty);
            db.Add(muzementSettingsDbItem);

            runMuzementImportCommand.GetFileData<DestinationMappingRow>(Arg.Any<Item>()).Returns(new List<DestinationMappingRow>());

            var searchResults = new BaseDestinationsSearchResultItem[0];

            destinationsSearchService
                .GetDestinationsByNames(Arg.Any<string[]>(), Arg.Any<DestinationFilter>())
                .Returns(new List<BaseDestinationsSearchResultItem>(searchResults));

            // Act
            var act = runMuzementImportCommand.ProcessItems(db.GetItem(muzementSettingsDbItem.ID));

            // Assert
            act.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void SynchronizeItems_ShouldUpdateMuzementIds_IfDestinationsExist(Db db, List<DestinationMappingRow> destinationMappings)
        {
            // Arrange
            var muzementSettingsDbItem = new DbItem("Muzement Settings", ID.NewID, Constants.TemplateIds.MuzementSettings);
            muzementSettingsDbItem.Fields.Add(Constants.Fields.Message.Output, string.Empty);
            muzementSettingsDbItem.Fields.Add(Constants.Fields.MuzementSettings.RegionRadius, string.Empty);
            muzementSettingsDbItem.Fields.Add(Constants.Fields.MuzementSettings.MuzementDestinationsImport, string.Empty);
            db.Add(muzementSettingsDbItem);

            var parent = new DbItem(destinationMappings.First().Region);
            parent.Fields.Add(Constants.Fields.Region.MuzementId, string.Empty);

            var resortDbItem = new DbItem(destinationMappings.First().ResortCode, ID.NewID, Constants.TemplateIds.Resort);
            resortDbItem.Fields.Add(Constants.Fields.Region.MuzementId, string.Empty);
            resortDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, destinationMappings.First().ResortCode);

            parent.Add(resortDbItem);
            db.Add(parent);

            runMuzementImportCommand.GetFileData<DestinationMappingRow>(Arg.Any<Item>()).Returns(destinationMappings);
            var resortItem = db.GetItem(resortDbItem.ID);
            var searchResults = new BaseDestinationsSearchResultItem[]
                {
                    new BaseDestinationsSearchResultItem()
                    {
                        ItemName = resortDbItem.Name,
                        TemplateId = Constants.TemplateIds.RegionPage,
                        Uri = resortItem.Uri
                    }
                };

            destinationsSearchService
                .GetDestinationsByCodes(Arg.Any<string[]>(), Arg.Any<bool>())
                .Returns(new List<BaseDestinationsSearchResultItem>(searchResults));

            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(resortItem);
            // Act
            var act = runMuzementImportCommand.ProcessItems(db.GetItem(muzementSettingsDbItem.ID));

            // Assert
            act.Should().HaveCount(2);
            act.ElementAt(0)[Constants.Fields.Region.MuzementId].Should().Be(destinationMappings.First().ResortId);
            act.ElementAt(1)[Constants.Fields.Region.MuzementId].Should().Be(destinationMappings.First().RegionId);
        }
    }
}

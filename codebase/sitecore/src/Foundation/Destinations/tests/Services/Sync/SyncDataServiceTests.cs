using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.Destinations.Services.Sync;
using easyJet.Foundation.Destinations.Tests.Infrastructures;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services.Sync
{
    public class SyncDataServiceTests
    {
        private readonly IMasterDataService masterDataService;
        private readonly IDatasourceRepository repository;
        private readonly SyncDataService syncDataService;
        private readonly IDestinationsLogger destinationsLogger;

        public SyncDataServiceTests()
        {
            masterDataService = Substitute.For<IMasterDataService>();
            repository = Substitute.For<IDatasourceRepository>();
            destinationsLogger = Substitute.For<IDestinationsLogger>();
            syncDataService = new SyncDataService(masterDataService, repository, destinationsLogger);
        }

        [Theory]
        [AutoDbData]
        public void SyncBoards_ShouldSuccessfulSyncData(DatasourceItemDbItem expectedItem, MasterData expected)
        {
            // Arrange
            masterDataService.GetBoardTypes()
                .Returns(new List<MasterData> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), false, Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = syncDataService.SyncBoards(ID.NewID, null).FirstOrDefault();

            // Assert
            actual.Fields[Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Name);
        }
    }
}

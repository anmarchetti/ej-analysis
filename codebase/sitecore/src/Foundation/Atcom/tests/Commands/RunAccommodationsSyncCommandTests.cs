using System.Collections.Generic;
using System.Linq;
using AutoFixture;
using easyJet.Foundation.Atcom.Commands;
using easyJet.Foundation.Atcom.Models.Domain;
using easyJet.Foundation.Atcom.Models.External;
using easyJet.Foundation.Atcom.Services;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.Atcom.Tests.Commands
{
    public class RunAccommodationsSyncCommandTests : BaseSyncCommandTests
    {
        private readonly RunAccommodationsSyncCommand runAccommodationsSyncCommand;
        private readonly IVrpWebService vrpWebserviceService;
        private readonly ISearchService searchService;
        private readonly ISitecoreUIService sitecoreUiService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;

        public RunAccommodationsSyncCommandTests()
        {
            vrpWebserviceService = Substitute.For<IVrpWebService>();
            searchService = Substitute.For<ISearchService>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            runAccommodationsSyncCommand = new RunAccommodationsSyncCommand(Service, vrpWebserviceService, searchService, Logger, databaseProvider, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeTrue_IfTempateIsValid()
        {
            // Arrange
            var resortDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            resortDBItem.TemplateID = Constants.TemplateIds.Resort;
            Db.Add(resortDBItem);

            var commandContext = new CommandContext(Db.GetItem(resortDBItem.ID));

            // Act
            var actual = runAccommodationsSyncCommand.IsCommandContextValid(commandContext);

            // Assert
            Assert.True(actual);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfTempatesIsNotValid()
        {
            // Arrange
            var accomadationDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            accomadationDBItem.TemplateID = Constants.TemplateIds.Accommodation;
            Db.Add(accomadationDBItem);

            var commandContext = new CommandContext(Db.GetItem(accomadationDBItem.ID));

            // Act
            var actual = runAccommodationsSyncCommand.IsCommandContextValid(commandContext);

            // Assert
            Assert.False(actual);
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void SynchronizeItems_ShouldBeEnumerableEmpty_IfCodeFieldHasNoValue(string code)
        {
            // Arrange
            var dbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            dbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, code);
            Db.Add(dbItem);

            // Act
            var actual = runAccommodationsSyncCommand.ProcessItems(Db.GetItem(dbItem.ID));

            // Assert
            Assert.Equal(Enumerable.Empty<Item>(), actual);
        }

        [Theory]
        [InlineData("AA")]
        public void SynchronizeItems_ShouldBeNotNull_IfCodeFieldHasValue(string code)
        {
            // Arrange
            var dbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            dbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, code);
            Db.Add(dbItem);

            Service.SyncAccommodations(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<Dictionary<string, AccommodationHeaderDataEntry>>(), Arg.Any<Dictionary<string, AtcomAccommodation>>())
                .Returns(new List<Item>());

            // Act
            var actual = runAccommodationsSyncCommand.ProcessItems(Db.GetItem(dbItem.ID));

            // Assert
            actual.Should().NotBeNull();
        }

        [Fact]
        public void SynchronizeItems_ShouldBeEmpty_IfCodeFieldNotExist()
        {
            // Arrange
            var dbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            Db.Add(dbItem);

            Service.SyncAccommodations(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<Dictionary<string, AccommodationHeaderDataEntry>>(), Arg.Any<Dictionary<string, AtcomAccommodation>>())
                .Returns(new List<Item>());

            // Act
            var actual = runAccommodationsSyncCommand.ProcessItems(Db.GetItem(dbItem.ID));

            // Assert
            actual.Should().BeEmpty();
        }
    }
}

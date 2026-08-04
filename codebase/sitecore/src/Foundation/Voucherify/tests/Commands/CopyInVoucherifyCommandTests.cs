using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using easyJet.Foundation.Voucherify.Commands;
using easyJet.Foundation.Voucherify.Logging;
using easyJet.Foundation.Voucherify.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Commands
{
    public class CopyInVoucherifyCommandTests
    {
        private readonly CopyInVoucherifyCommand command;
        private readonly ISyncDataService syncDataService;
        private readonly IVoucherifyLogger logger;

        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public CopyInVoucherifyCommandTests()
        {
            syncDataService = Substitute.For<ISyncDataService>();
            logger = Substitute.For<IVoucherifyLogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            command = new CopyInVoucherifyCommand(syncDataService, logger, databaseProvider, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeTrue_IfItemIsValid()
        {
            // Arrange
            var item = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "TESTCODE");

            var parentItem = new FakeItem()
                .WithTemplate(Templates.Promotion.Id)
                .WithField(Templates.Promotion.Fields.CustomerPromoCode, "Test title")
                .WithField(Templates.Promotion.Fields.DateValidityFrom, "20200707T081700Z")
                .WithField(Templates.Promotion.Fields.DateValidityTo, "20200707T081700Z")
                .WithChild(item)
                .ToSitecoreItem();

            var commandContext = new CommandContext(parentItem);

            // Act
            var actual = command.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoDbData]
        public void IsCommandContextValid_ShouldBeFalse_IfTempatesIsNotValid(Item parent)
        {
            // Arrange
            var commandContext = new CommandContext(parent);

            // Act
            var actual = command.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoDbData]
        public void SynchronizeItemsd_ShouldBeNotEmpty_SyncServiceReturnItem(Item parent)
        {
            // Arrange
            syncDataService.SyncPromotionToVoucherifyAndEnforceSortOrder(Arg.Any<Item>()).Returns(new[] { parent });

            // Act
            var actual = command.ProcessItems(parent);

            // Assert
            actual.Should().NotBeEmpty();
        }
    }
}
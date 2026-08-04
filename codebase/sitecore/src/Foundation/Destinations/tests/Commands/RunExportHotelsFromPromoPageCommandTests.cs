using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Commands;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class RunExportHotelsFromPromoPageCommandTests
    {
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IDestinationsLogger logger;
        private readonly RunExportHotelsFromPromoPageCommand runExportHotelsFromPromoPageCommand;

        public RunExportHotelsFromPromoPageCommandTests()
        {
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            logger = Substitute.For<IDestinationsLogger>();

            runExportHotelsFromPromoPageCommand = new RunExportHotelsFromPromoPageCommand(Substitute.For<ISitecoreUIService>(), logger);
        }

        [Theory]
        [AutoData]
        public void IsCommandContextValid_ShouldBeTrue_IfTemplateIsValid(Db db)
        {
            // Arrange
            var promoPageItem = new DbItem("PromoPage");
            promoPageItem.TemplateID = Constants.TemplateIds.PromoPage;

            var destinationFileField = new DbField(Constants.Fields.PromoPage.Destination)
            {
                Type = "TextField",
                Value = new ID().ToString()
            };

            promoPageItem.Fields.Add(destinationFileField);

            db.Add(promoPageItem);

            var commandContext = new CommandContext(db.GetItem(promoPageItem.ID));

            // Act
            var actual = runExportHotelsFromPromoPageCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void IsCommandContextValid_ShouldBeFalse_IfTemplateIsNotValid(Db db)
        {
            // Arrange
            var promoPageItem = new DbItem("PromoPage");
            promoPageItem.TemplateID = Constants.TemplateIds.PromoBlocksFolder;
            db.Add(promoPageItem);

            var commandContext = new CommandContext(db.GetItem(promoPageItem.ID));

            // Act
            var actual = runExportHotelsFromPromoPageCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeFalse();
        }
    }
}

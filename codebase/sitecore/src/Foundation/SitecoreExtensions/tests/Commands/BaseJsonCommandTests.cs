using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Logger;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Commands
{
    public class BaseJsonCommandTests
    {
        private const string CommandName = "fake:syncJsonCommand";

        private readonly BaseJsonCommand command;
        private readonly ILogger logger;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public BaseJsonCommandTests()
        {
            logger = Substitute.For<ILogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            command = Substitute.ForPartsOf<BaseJsonCommand>(databaseProvider, logger, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfSettingsIsNotValid()
        {
            // Arrange
            var item = new FakeItem();
            var context = new CommandContext(item);

            // Act
            var actual = command.IsCommandContextValid(context);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfItemTemplateIsNotValid()
        {
            // Arrange
            ID templateId = ID.Parse("{CF76DE30-2248-4C06-A065-EB4B76A9623D}");
            var item = new FakeItem().WithTemplate(templateId);

            CommandManager.RegisterCommand(CommandName, command);
            var context = new CommandContext(item);

            // Act
            var actual = command.IsCommandContextValid(context);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void GetFileData_ShouldBeEmptyFileModel_IfSettingsIsNotValid()
        {
            // Act
            var item = new FakeItem();
            var actual = command.GetFileData<FakeFileModel>(item);

            // Assert
            actual.Code.Should().BeNull();
        }
    }
}

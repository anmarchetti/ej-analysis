using easyJet.Feature.SitecoreEnhancment.Commands;
using easyJet.Feature.SitecoreEnhancment.ForceRepublish;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Commands
{
    public class ForceRepublishTreeAllLanguagesCommandTests
    {
        private readonly IForceRepublishService forceRepublishService;
        private readonly ISitecoreEnhancmentLogger logger;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;
        private readonly ForceRepublishTreeAllLanguagesCommandProxy command;

        public ForceRepublishTreeAllLanguagesCommandTests()
        {
            forceRepublishService = Substitute.For<IForceRepublishService>();
            logger = Substitute.For<ISitecoreEnhancmentLogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            command = new ForceRepublishTreeAllLanguagesCommandProxy(forceRepublishService, logger, databaseProvider, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void PublishLanguage_ShouldReturnCurrentLanguage()
        {
            // Act
            var actual = command.PublishLanguageProxy;

            // Assert
            actual.Should().Be(PublishLanguage.AllLanguages);
        }

        [Fact]
        public void PublishMode_ShouldReturnSignleItem()
        {
            // Act
            var actual = command.PublishModeProxy;

            // Assert
            actual.Should().Be(PublishMode.SubTree);
        }

        [Fact]
        public void IsCommandContextValidProxy_ShouldBeTrue()
        {
            // Arrange
            CommandContext context = new CommandContext();

            // Act
            var actual = command.IsCommandContextValidProxy(context);

            // Assert
            actual.Should().BeTrue();
        }

        private class ForceRepublishTreeAllLanguagesCommandProxy : ForceRepublishTreeAllLanguagesCommand
        {
            public ForceRepublishTreeAllLanguagesCommandProxy(
                IForceRepublishService forceRepublishService,
                ISitecoreEnhancmentLogger logger,
                IDatabaseProvider databaseProvider,
                IUserCreationService userCreationService,
                ISitecoreUIService sitecoreUiService)
                : base(forceRepublishService, logger, databaseProvider, userCreationService, sitecoreUiService)
            {
            }

            public bool IsCommandContextValidProxy(CommandContext ctx) => IsCommandContextValid(ctx);

            public PublishLanguage PublishLanguageProxy => PublishLanguage;

            public PublishMode PublishModeProxy => PublishMode;
        }
    }
}
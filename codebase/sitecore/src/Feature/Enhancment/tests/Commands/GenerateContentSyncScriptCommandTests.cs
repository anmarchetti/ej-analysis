using System.Collections.Generic;
using easyJet.Feature.SitecoreEnhancment.Commands;
using easyJet.Feature.SitecoreEnhancment.ForceRepublish;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.Testing.Extensions;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.FakeDb.Data.DataProviders;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Commands
{
    public class GenerateContentSyncScriptCommandTests
    {
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;
        private readonly GenerateContentSyncScriptCommandProxy command;
        private readonly BaseSettings baseSettings;
        private readonly IAdminService adminService;

        public GenerateContentSyncScriptCommandTests()
        {
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            baseSettings = Substitute.For<BaseSettings>();
            adminService = Substitute.For<IAdminService>();
            command = new GenerateContentSyncScriptCommandProxy(adminService, baseSettings, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void IsCommandContextValidProxy_ShouldBeTrue()
        {
            baseSettings.GetBoolSetting("GenerateContentSyncScripts.IsEnabled", Arg.Any<bool>()).Returns(true);
            FakeItem item = new FakeItem(ID.NewID, FakeUtil.FakeDatabase("master")).WithPathsPath("/sitecore/content/item");
            adminService.IsAdmin().Returns(true);
            // Arrange
            CommandContext context = new CommandContext(item)
            {
            };

            // Act
            var actual = command.IsCommandContextValidProxy(context);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void Database_IsCorrect()
        {
            // Act
            var actual = command.Database;

            // Assert
            actual.Should().BeSameAs("master");
        }

        private class GenerateContentSyncScriptCommandProxy : GenerateContentSyncScriptCommand
        {
            public GenerateContentSyncScriptCommandProxy(
                IAdminService adminService,
                BaseSettings baseSettings,
                IUserCreationService userCreationService,
                ISitecoreUIService sitecoreUiService)
                : base(adminService, baseSettings,  sitecoreUiService,  userCreationService)
            {
            }

            public new ID ScriptId => base.ScriptId;

            public new string Database => "master";

            public bool IsCommandContextValidProxy(CommandContext ctx) => IsCommandContextValid(ctx);

            protected override HashSet<string> AllowedPaths => base.AllowedPaths;

            protected override bool IsEnabled => base.IsEnabled;
        }
    }
}
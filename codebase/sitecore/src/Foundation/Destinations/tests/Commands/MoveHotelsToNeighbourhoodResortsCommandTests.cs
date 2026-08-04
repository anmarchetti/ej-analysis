using System.Collections.Generic;
using easyJet.Foundation.Destinations.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class MoveHotelsToNeighbourhoodResortsCommandTests
    {
        private readonly MoveHotelsToNeighbourhoodResortsCommandProxy command;

        public MoveHotelsToNeighbourhoodResortsCommandTests()
        {
            command = new MoveHotelsToNeighbourhoodResortsCommandProxy(
                Substitute.For<IAdminService>(),
                Substitute.For<ISitecoreUIService>(),
                Substitute.For<IUserCreationService>());
        }

        [Fact]
        public void ScriptId_IsCorrect()
        {
            command.ScriptId.Should().Be(Constants.ItemIds.MoveHotelsToNeighbourhoodResortsScript);
        }

        [Fact]
        public void Database_IsCorrect()
        {
            command.Database.Should().Be("master");
        }

        [Fact]
        public void AllowedTemplates_ShouldContainResortOnly()
        {
            command.AllowedTemplates.Should().BeEquivalentTo(new HashSet<ID>
            {
                Constants.TemplateIds.Resort
            });
        }

        [Fact]
        public void RequiresAdminUser_IsTrue()
        {
            command.RequiresAdminUser.Should().BeTrue();
        }

        [Fact]
        public void IsEnabled_IsTrue()
        {
            command.IsEnabled.Should().BeTrue();
        }

        private class MoveHotelsToNeighbourhoodResortsCommandProxy : MoveHotelsToNeighbourhoodResortsCommand
        {
            public MoveHotelsToNeighbourhoodResortsCommandProxy(
                IAdminService adminService,
                ISitecoreUIService sitecoreUiService,
                IUserCreationService userCreationService)
                : base(adminService, sitecoreUiService, userCreationService)
            {
            }

            public new ID ScriptId => base.ScriptId;

            public new string Database => base.Database;

            public new HashSet<ID> AllowedTemplates => base.AllowedTemplates;

            public new bool RequiresAdminUser => base.RequiresAdminUser;

            public new bool IsEnabled => base.IsEnabled;
        }
    }
}
using System.Collections.Generic;
using System.Linq;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Commands;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.SecurityModel;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class ExtendedCheckoutCommandTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly ExtendedCheckoutCommand extendedCheckoutCommand;

        public ExtendedCheckoutCommandTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            extendedCheckoutCommand = new ExtendedCheckoutCommand();
        }

        [Theory]
        [MemberData(nameof(ValidTemplates))]
        public void Execute_ShouldCreateNewVersionOfItem_IfItemVersionLatest(ID templateId)
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = templateId;

            db.Add(item);

            // Act
            using (new SecurityDisabler())
            {
                var context = new CommandContext(db.GetItem(item.ID));
                try
                {
                    extendedCheckoutCommand.Execute(context);
                }
                catch
                {
                }

                var actual = context.Items[0].Versions.Count;

                // Assert
                actual.Should().Be(2);
            }
        }

        [Theory]
        [MemberData(nameof(ValidTemplates))]
        public void Execute_ShouldNotCreateNewVersionOfItem_IfItemNotLastVersion(ID templateId)
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = templateId;

            db.Add(item);
            item.AddVersion("en");

            var context = new CommandContext(db.GetItem(item.ID).Versions.GetOlderVersions().FirstOrDefault());

            // Act
            try
            {
                extendedCheckoutCommand.Execute(context);
            }
            catch
            {
            }

            var actual = context.Items[0].Versions.Count;

            // Assert
            actual.Should().Be(2);
        }

        [Fact]
        public void Execute_ShouldNotCreateNewVersionOfItem_IfItemNotExist()
        {
            // Arrange
            var context = new CommandContext();

            // Act
            extendedCheckoutCommand.Execute(context);
            var actual = context.Items;

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void Execute_ShouldNotCreateNewVersionOfItem_IfItemNotValidItem(ID templateId)
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = templateId;

            db.Add(item);

            var context = new CommandContext(db.GetItem(item.ID));

            // Act
            try
            {
                extendedCheckoutCommand.Execute(context);
            }
            catch
            {
            }

            var actual = context.Items[0].Versions.Count;

            // Assert
            actual.Should().Be(1);
        }

        public static IEnumerable<object[]> ValidTemplates
        {
            get
            {
                return new[]
                {
                    new object[] { Constants.TemplateIds.AccommodationRoom },
                    new object[] { Constants.TemplateIds.SitecoreImage },
                    new object[] { Constants.TemplateIds.ExternalImage },
                    new object[] { Constants.TemplateIds.AccommodationFacility },
                    new object[] { Constants.TemplateIds.AccommodationBoard },
                    new object[] { Constants.TemplateIds.RoomFacility }
                };
            }
        }
    }
}

using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Models.Domain
{
    public class LinkTests
    {
        private readonly Fixture fixture;
        private readonly Db db;

        public LinkTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void LinkConstructor_ShouldNotSetDataFromLink_IfLinkNotPassed()
        {
            // Act
            var actual = new Link();

            // Assert
            actual.Anchor.Should().BeNull();
            actual.LinkType.Should().BeNull();
            actual.Text.Should().BeNull();
            actual.Target.Should().BeNull();
            actual.Url.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void LinkConstructor_ShouldSetDataFromLink_IfLinkPassed(string text, string anchor, string linkType, string target)
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var linkField = new DbField(Constants.Fields.PromoBlock.Link)
            {
                Type = "LinkField",
                Value = $"<link text='{text}' anchor='{anchor}' target='{target}' linktype='{linkType}' id='{item.ID}' />"
            };

            item.Fields.Add(linkField);

            db.Add(item);

            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "holidays" },
                    { "database", "master" }
                });

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                var actual = new Link(db.GetItem(item.ID).Fields[Constants.Fields.PromoBlock.Link], "holidays");

                // Assert
                actual.Anchor.Should().Be(anchor);
                actual.LinkType.Should().Be(linkType);
                actual.Text.Should().Be(text);
                actual.Target.Should().Be(target);
                actual.Url.Should().Contain(item.FullPath);
            }
        }

        [Theory]
        [AutoData]
        public void LinkConstructor_ShouldSetUrlFromLink_IfLinkNotInternal(string url)
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var linkField = new DbField(Constants.Fields.PromoBlock.Link)
            {
                Type = "LinkField",
                Value = $"<link url='{url}' />"
            };

            item.Fields.Add(linkField);

            db.Add(item);

            // Act
            var actual = new Link(db.GetItem(item.ID).Fields[Constants.Fields.PromoBlock.Link], "holidays");

            // Assert
            actual.Url.Should().Be(url);
        }
    }
}

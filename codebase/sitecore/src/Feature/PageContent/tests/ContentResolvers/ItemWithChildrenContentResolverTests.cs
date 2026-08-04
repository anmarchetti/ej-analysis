using easyJet.Feature.PageContent.ContentResolvers;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.ContentResolvers
{
    public class ItemWithChildrenContentResolverTests
    {
        private readonly ItemWithChildrenContentResolver resolver;

        public ItemWithChildrenContentResolverTests()
        {
            // Arrange
            resolver = new ItemWithChildrenContentResolver()
            {
                UseContextItem = true
            };
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfMethodThrowException()
        {
            // Act
            var actual = resolver.ResolveContents(null, null);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfNotUseContextItemMode()
        {
            // Arrange
            resolver.UseContextItem = false;

            // Act
            var actual = resolver.ResolveContents(new Rendering(), null);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldResolveContents_IfUseContextItemMode(Db db)
        {
            // Arrange
            resolver.UseContextItem = true;

            var rootDbItem = new DbItem("Root item");
            rootDbItem.Children.Add(new DbItem("Child item 1"));
            db.Add(rootDbItem);
            var root = db.GetItem(rootDbItem.ID);

            string testJsonText = @"
                        {
                            ""Website"": {
                                ""value"": ""www.testHotel.com""
                                }
                        }";

            var renderingConfig = Substitute.For<IRenderingConfiguration>();
            renderingConfig.ItemSerializer.Serialize(Arg.Any<Item>()).Returns(testJsonText);

            using (new EditContext(root))
            {
                root.Add("Chid 1", new TemplateID(ID.NewID));
            }

            var fakeSite = new FakeSiteContext(new StringDictionary
            {
                { "name", "website" }, { "database", "web" }
            });

            using (new SiteContextSwitcher(fakeSite))
            using (new ContextItemSwitcher(root))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfig) as JObject;

                ((string)actual["Website"]["value"]).Should().BeEquivalentTo("www.testHotel.com");
                actual["Children"].Should().HaveCount(1);
            }
        }
    }
}

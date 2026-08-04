using easyJet.Feature.PageContent.ContentResolvers;
using easyJet.Feature.PageContent.Models;
using easyJet.Feature.PageContent.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Sitecore.NSubstituteUtils;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.ContentResolvers
{
    public class SchemaContentResolverTests
    {
        private readonly SchemaContentResolver resolver;
        private readonly ISchemaFactory schemaFactory;

        public SchemaContentResolverTests()
        {
            // Arrange
            schemaFactory = Substitute.For<ISchemaFactory>();
            resolver = new SchemaContentResolver(schemaFactory);
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

        [Fact]
        public void ResolveContents_ShouldResolveContents_IfUseContextItemMode()
        {
            // Arrange
            var schema = new QuestionAndAnswerSchema();
            resolver.UseContextItem = true;
            schemaFactory.GetSchema(Arg.Any<Item>()).Returns(schema);
            var renderingConfig = Substitute.For<IRenderingConfiguration>();

            SiteContext siteContext = new SiteInfoPropertiesBuilder("TestSiteName")
               .WithDatabase("master")
               .WithEnableWebEdit(true);

            var item = new FakeItem();

            using (new SiteContextSwitcher(siteContext))
            using (new ContextItemSwitcher(item))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfig);

                // Assert
                actual.Should().NotBeNull();
            }
        }
    }
}

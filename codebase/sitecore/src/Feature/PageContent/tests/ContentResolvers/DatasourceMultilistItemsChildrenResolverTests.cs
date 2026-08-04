using System;
using easyJet.Feature.PageContent.ContentResolvers;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.ContentResolvers
{
    public class DatasourceMultilistItemsChildrenResolverTests
    {
        private readonly DatasourceMultilistItemsChildrenResolver resolver;
        private readonly IRenderingConfiguration renderingConfiguration;

        public DatasourceMultilistItemsChildrenResolverTests()
        {
            // Arrange
            renderingConfiguration = Substitute.For<IRenderingConfiguration>();
            resolver = Substitute.ForPartsOf<DatasourceMultilistItemsChildrenResolver>();
            resolver.UseContextItem = true;
        }

        [Fact]
        public void ResolveContents_ShouldLogError_IfThrowError()
        {
            // Arrange
            var item = new FakeItem().ToSitecoreItem();

            item.Template.OwnFields.Throws(new Exception());

            using (new ContextItemSwitcher(item))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfContextItemIsNull()
        {
            // Act
            var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

            // Assert
            actual.Should().BeNull();
        }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.Bundles.ContentResolvers;
using easyJet.Feature.Bundles.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Xunit;

namespace easyJet.Feature.Bundles.Tests.ContentResolvers
{
    public class BundlesContentResolverTests
    {
        private readonly BundlesContentResolver resolver;
        private readonly IDatabaseProvider dbProvider;
        private readonly IRenderingConfiguration renderingConfig;

        public BundlesContentResolverTests()
        {
            dbProvider = Substitute.For<IDatabaseProvider>();
            var bundlesLogger = Substitute.For<IBundlesLogger>();
            renderingConfig = Substitute.For<IRenderingConfiguration>();
            resolver = new BundlesContentResolver(dbProvider, bundlesLogger);
        }

        [Fact]
        public void ResolveContents_ShouldReturnEmpty_WhenContextItemIsNull()
        {
            // Arrange
            var rendering = Substitute.For<Rendering>();
            rendering.Item.Returns((Item)null);

            // Act
            var result = resolver.ResolveContents(rendering, renderingConfig);

            // Assert
            result.Should().BeEquivalentTo(new { items = Array.Empty<object>() });
        }

        [Fact]
        public void ResolveContents_ShouldReturnEmpty_WhenNoBundleGroups()
        {
            // Arrange
            var contextItem = ItemFactory.CreateFakeItem();
            contextItem.Axes.GetDescendants().Returns(Enumerable.Empty<Item>());
            var rendering = Substitute.For<Rendering>();
            rendering.Item.Returns(contextItem);

            // Act
            var result = resolver.ResolveContents(rendering, renderingConfig);

            // Assert
            result.Should().BeEquivalentTo(new { items = Array.Empty<object>() });
        }

        [Fact]
        public void ResolveContents_ShouldReturnEmpty_WhenDatasourceNotFound()
        {
            // Arrange
            var contextItem = ItemFactory.CreateFakeItem();
            contextItem.Database.GetItem("ABC123").Returns((Item)null);
            var rendering = Substitute.For<Rendering>();
            rendering.Item.Returns(contextItem);
            rendering.DataSource.Returns("ABC123");

            // Act
            var result = resolver.ResolveContents(rendering, renderingConfig);

            // Assert
            result.Should().BeEquivalentTo(new { items = Array.Empty<object>() });
        }

        [Fact]
        public void ResolveContents_ShouldReturnBundlesData_WhenBundleGroupsExist()
        {
            var bundleGroup = ItemFactory.CreateFakeItem(
                Constants.TemplateIds.BundleGroup,
                new Dictionary<string, string>
                {
                    { Constants.FieldNames.BundleGroup.Promocode, "ABC" },
                    { Constants.FieldNames.BundleGroup.Bundles, "Bundle1" }
                });
            var bundleGroups = new[] { bundleGroup };
            var contextItem = ItemFactory.CreateFakeItem();
            var datasourceItem = ItemFactory.CreateFakeItem();
            datasourceItem.Axes.GetDescendants().Returns(bundleGroups);
            var rendering = Substitute.For<Rendering>();
            rendering.Item.Returns(contextItem);
            rendering.DataSource.Returns("ABC123");
            contextItem.Database.GetItem("ABC123").Returns(datasourceItem);
            dbProvider.HasLanguageVersion(bundleGroup, contextItem.Language).Returns(true);

            // Act
            var result = resolver.ResolveContents(rendering, renderingConfig);

            // Assert
            var expected = new
            {
                items = new[]
                {
                    new
                    {
                        promoCode = "ABC",
                        bundles = "Bundle1"
                    },
                },
            };

            result.Should().BeEquivalentTo(expected);
        }
    }
}

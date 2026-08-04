using System;
using System.Text.Json;
using AutoFixture.Xunit2;
using easyJet.Feature.PageContent.ContentResolvers;
using easyJet.Feature.PageContent.Models;
using easyJet.Feature.PageContent.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands.TemplateBuilder;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.ContentResolvers
{
    public class ContextItemAllChildrenResolverTests
    {
        private readonly ContextItemAllChildrenResolver resolver;
        private readonly IRenderingConfiguration renderingConfiguration;

        public ContextItemAllChildrenResolverTests()
        {
            // Arrange
            renderingConfiguration = Substitute.For<IRenderingConfiguration>();
            resolver = Substitute.ForPartsOf<ContextItemAllChildrenResolver>();
            resolver.UseContextItem = false;
        }

        [Fact]
        public void ResolveContents_ShouldResolveContents_IfUseContextItemMode()
        {
            // Arrange
            resolver.UseContextItem = true;
            var renderingConfig = Substitute.For<IRenderingConfiguration>();

            string serilizedText = JsonSerializer.Serialize(new
            {
                Name = "FakeItem"
            });

            renderingConfig.ItemSerializer.Serialize(Arg.Any<Item>()).Returns(serilizedText);

            var child = new FakeItem().WithTemplate(Constants.TemplateIds.PeriodDrivenPromoPage);
            var item = new FakeItem().WithChild(child);

            using (new ContextItemSwitcher(item))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfig);

                // Assert
                actual.Should().NotBeNull();
            }
        }

        [Fact]
        public void ResolveContents_ShouldLogError_IfSerilizeThrowsError()
        {
            // Arrange
            resolver.UseContextItem = true;
            var renderingConfig = Substitute.For<IRenderingConfiguration>();

            renderingConfig.ItemSerializer.Serialize(Arg.Any<Item>()).Throws<Exception>();

            var child = new FakeItem().WithTemplate(Constants.TemplateIds.PeriodDrivenPromoPage);
            var item = new FakeItem().WithChild(child);

            using (new ContextItemSwitcher(item))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfig);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfContextItemIsNull()
        {
            // Arrange
            var rendering = Substitute.For<Rendering>();

            // Act
            var actual = resolver.ResolveContents(rendering, renderingConfiguration);

            // Assert
            actual.Should().BeNull();
        }
    }
}

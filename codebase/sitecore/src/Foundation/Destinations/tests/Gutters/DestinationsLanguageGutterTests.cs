using System.Reflection;
using easyJet.Foundation.Destinations.Gutters;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Applications.ContentEditor.Gutters;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Gutters
{
    public class DestinationsLanguageGutterTests
    {
        private readonly DestinationsLanguageGutter gutter;

        public DestinationsLanguageGutterTests()
        {
            gutter = new DestinationsLanguageGutter();
        }

        [Fact]
        public void GetIconDescriptor_ShouldReturnNull_IfItemIsNotDestinationItem()
        {
            // Arrange
            var item = new FakeItem().WithTemplate(ID.NewID);

            // Act
            var result = InvokeGetIconDescriptor(item);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void GetIconDescriptor_ShouldReturnNull_IfItemHasLanguageVersion()
        {
            // Arrange
            var item = new FakeItem()
                .WithTemplate(Constants.TemplateIds.Country)
                .WithLanguage("en")
                .WithItemVersions();

            item.ToSitecoreItem().Versions.Count.Returns(1);

            // Act
            var result = InvokeGetIconDescriptor(item);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void GetIconDescriptor_ShouldReturnIconDescriptor_IfItemHasNoLanguageVersion()
        {
            // Arrange
            var item = new FakeItem()
                .WithTemplate(Constants.TemplateIds.Country)
                .WithItemVersions();

            item.ToSitecoreItem().Versions.Count.Returns(0);

            // Act
            var result = InvokeGetIconDescriptor(item);

            // Assert
            result.Should().NotBeNull();
            result.Icon.Should().NotBeNullOrEmpty();
        }

        private GutterIconDescriptor InvokeGetIconDescriptor(FakeItem item)
        {
            return gutter.GetType()
                .GetMethod("GetIconDescriptor", BindingFlags.NonPublic | BindingFlags.Instance)
                .Invoke(gutter, new object[] { item.ToSitecoreItem() }) as GutterIconDescriptor;
        }
    }
}

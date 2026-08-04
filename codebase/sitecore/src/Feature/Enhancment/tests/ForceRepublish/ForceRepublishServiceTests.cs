using System;
using easyJet.Feature.SitecoreEnhancment.ForceRepublish;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Core;
using NSubstitute.Extensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.ForceRepublish
{
    public class ForceRepublishServiceTests
    {
        private readonly IChangeItemRevisionService changeItemRevisionService;

        private readonly IDatabaseProvider databaseProvider;

        private readonly IPublishManagerService publishManagerService;

        private readonly ISitecoreEnhancmentLogger sitecoreEnhancmentLogger;

        private readonly IForceRepublishService sut;

        public ForceRepublishServiceTests()
        {
            changeItemRevisionService = Substitute.For<IChangeItemRevisionService>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            sitecoreEnhancmentLogger = Substitute.For<ISitecoreEnhancmentLogger>();
            publishManagerService = Substitute.For<IPublishManagerService>();
            sut = new ForceRepublishService(publishManagerService, databaseProvider, changeItemRevisionService, sitecoreEnhancmentLogger);
        }

        [Fact]
        public void ForceRepublish_LogsException_IfThrowsException()
        {
            // Arrange
            var root = ArrangeTree();
            publishManagerService.Configure().When((IPublishManagerService i) => i.PublishItem(Arg.Any<Item>(), Arg.Any<Database[]>(), Arg.Any<Language[]>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<bool>())).Do((CallInfo i) => throw new Exception());

            // Act
            var result = sut.ForceRepublish(root, PublishMode.SubTree, PublishLanguage.AllLanguages);

            // Assert
            sitecoreEnhancmentLogger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void ForceRepublish_SingleItem_IfSingleItem()
        {
            // Arrange
            var root = ArrangeTree();

            // Act
            var result = sut.ForceRepublish(root, PublishMode.SingleItem, PublishLanguage.CurrentLanguage);

            // Assert
            result.Should().HaveCount(1);
        }

        [Fact]
        public void ForceRepublish_SingleItemAllLanguages_IfSingleItemAllLanguages()
        {
            // Arrange
            var root = ArrangeTree();

            // Act
            var result = sut.ForceRepublish(root, PublishMode.SingleItem, PublishLanguage.AllLanguages);

            // Assert
            result.Should().HaveCount(2);
        }

        [Fact]
        public void ForceRepublish_SubTree_IfSubTree()
        {
            // Arrange
            var root = ArrangeTree();

            // Act
            var result = sut.ForceRepublish(root, PublishMode.SubTree, PublishLanguage.CurrentLanguage);

            // Assert
            result.Should().HaveCount(2);
        }

        [Fact]
        public void ForceRepublish_SubTreeAllLanguages_IfSubTreeAllLanguages()
        {
            // Arrange
            var root = ArrangeTree();

            // Act
            var result = sut.ForceRepublish(root, PublishMode.SubTree, PublishLanguage.AllLanguages);

            // Assert
            result.Should().HaveCount(4);
        }

        private static FakeItem ArrangeTree()
        {
            var child = new FakeItem().WithLanguages(new[] { "en", "de" });
            var root = new FakeItem().WithLanguages(new[] { "en", "de" }).WithChild(child);

            var axes = Substitute.For<ItemAxes>(root.ToSitecoreItem());
            axes.GetDescendants().Returns(new Item[] { root, child });
            root = root.WithItemAxes(axes);
            return root;
        }
    }
}

using System;
using easyJet.Foundation.Publishing.Logging;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Abstractions;
using Sitecore.Data.Events;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Publishing.Tests
{
    [Collection(nameof(DontRunParallel))]
    public class SmartHtmlCacheClearerTests
    {
        private readonly IPublishingLogger logger;
        private readonly SmartHtmlCacheClearer sut;

        public SmartHtmlCacheClearerTests()
        {
            logger = Substitute.For<IPublishingLogger>();
            sut = Substitute.ForPartsOf<SmartHtmlCacheClearer>(
                Substitute.For<BaseCacheManager>(),
                Substitute.For<BaseSiteContextFactory>(),
                logger);

            ResetCounter();
        }

        [Fact]
        public void SmartClearCache_ShouldLogNothingChanged_WhenCounterIsZero()
        {
            // Act
            sut.SmartClearCache(null, EventArgs.Empty);

            // Assert
            logger.Received(1).Info(
                Arg.Is<string>(s => s.Contains("nothing changed")),
                Arg.Any<object>());
        }

        [Fact]
        public void SmartClearCache_ShouldNotClearCache_WhenCounterIsZero()
        {
            // Act
            sut.SmartClearCache(null, EventArgs.Empty);

            // Assert
            logger.DidNotReceive().Info(
                Arg.Is<string>(s => s.Contains("Clearing HTML cache")),
                Arg.Any<object>());
        }

        [Fact]
        public void SmartClearCache_ShouldLogItemsChangedAndCacheCleared_WhenCounterIsPositive()
        {
            // Arrange
            IncrementCounter();

            // Act
            sut.SmartClearCache(this, EventArgs.Empty);

            // Assert
            logger.Received(1).Info(
                Arg.Is<string>(s => s.Contains("1 item(s) changed")),
                Arg.Any<object>());
            logger.Received(1).Info(
                Arg.Is<string>(s => s.Contains("HTML cache cleared in")),
                Arg.Any<object>());
        }

        private static void ResetCounter()
        {
            ItemEditCounter.GetAndResetCounter();
            ItemEditCounter.ResetExcludedItemIds();
        }

        private static void IncrementCounter()
        {
            var editCounter = Substitute.ForPartsOf<ItemEditCounter>(Substitute.For<IPublishingLogger>());
            editCounter.Configure().GetExcludedItemIdsSetting().ReturnsForAnyArgs(string.Empty);
            editCounter.IncreaseCounter(null, new ItemSavedRemoteEventArgs(new FakeItem(), null));
        }
    }
}

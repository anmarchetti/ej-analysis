using System;
using System.ComponentModel;
using System.Threading.Tasks;
using easyJet.Foundation.Publishing.Logging;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Data;
using Sitecore.Data.Events;
using Sitecore.Data.Items;
using Sitecore.Events;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Publishing.Tests
{
    [CollectionDefinition(nameof(DontRunParallel), DisableParallelization = true)]
#pragma warning disable SA1402
#pragma warning disable SA1649
    public class DontRunParallel
#pragma warning restore SA1649
#pragma warning restore SA1402
    {
    }

    [Collection(nameof(DontRunParallel))]
    public class ItemEditCounterTests
    {
        private readonly ItemEditCounter sut;

        public ItemEditCounterTests()
        {
            sut = Substitute.ForPartsOf<ItemEditCounter>(Substitute.For<IPublishingLogger>());
        }

        [Fact]
        public void IncreaseCounter_Serial_WithItemSavedRemoteArgs_NoExcludedItemIds()
        {
            // Arrange
            var fakeItem = new FakeItem();
            var itemSaveEventArg = new ItemSavedRemoteEventArgs(fakeItem, null);
            ResetCounter();
            ConfigureReturnEmptyExcludedItemIds();

            // Act
            sut.IncreaseCounter(null, itemSaveEventArg);

            // Assert
            var counter = ItemEditCounter.GetAndResetCounter();
            counter.Should().Be(1);
        }

        [Fact]
        public void IncreaseCounter_Serial_WithSitecoreEventArgs_NoExcludedItemIds()
        {
            // Arrange
            var fakeItem = (Item)new FakeItem();
            var itemSaveEventArg = new SitecoreEventArgs("item:saved", new[] { fakeItem }, EventResult.CreateCancelResult());

            ResetCounter();
            ConfigureReturnEmptyExcludedItemIds();

            // Act
            sut.IncreaseCounter(null, itemSaveEventArg);

            // Assert
            var counter = ItemEditCounter.GetAndResetCounter();
            counter.Should().Be(1);
        }

        [Fact]
        public void IncreaseCounter_Serial_WithWrongEventName_NoExcludedItemIds()
        {
            // Arrange
            var fakeItem = (Item)new FakeItem();
            var itemSaveEventArg = new SitecoreEventArgs("item:unsaved", new[] { fakeItem }, EventResult.CreateCancelResult());

            ResetCounter();
            ConfigureReturnEmptyExcludedItemIds();

            // Act
            sut.IncreaseCounter(null, itemSaveEventArg);

            // Assert
            var counter = ItemEditCounter.GetAndResetCounter();
            counter.Should().Be(1);
        }

        [Fact]
        public void IncreaseCounter_Serial_ExceptionOnEventArgsParsing_NoExcludedItemIds()
        {
            // Arrange
            var fakeItem = new FakeItem();
            var itemSaveEventArg = new SitecoreEventArgs("item:saved", new[] { fakeItem }, EventResult.CreateCancelResult());

            ResetCounter();
            ConfigureReturnEmptyExcludedItemIds();

            // Act
            sut.IncreaseCounter(null, itemSaveEventArg);

            // Assert
            var counter = ItemEditCounter.GetAndResetCounter();
            counter.Should().Be(1);
        }

        [Fact]
        public void IncreaseCounter_Serial_WithNotSupportedEventArgs_NoExcludedItemIds()
        {
            // Arrange
            var itemSaveEventArg = new CancelEventArgs();

            ResetCounter();
            ConfigureReturnEmptyExcludedItemIds();

            // Act
            sut.IncreaseCounter(null, itemSaveEventArg);

            // Assert
            var counter = ItemEditCounter.GetAndResetCounter();
            counter.Should().Be(1);
        }

        [Fact]
        public void IncreaseCounter_Serial_WithItemSavedRemoteEventArgs_WithExcludedItemIds()
        {
            // Arrange
            var id = new ID(Guid.Parse("{5f492dcc-9037-4b8f-89b5-600ded00b2f0}"));
            var fakeItem = new FakeItem(id);
            var itemSaveEventArg = new ItemSavedRemoteEventArgs(fakeItem, null);
            sut.Configure().GetExcludedItemIdsSetting().ReturnsForAnyArgs(info => id.ToString());

            ResetCounter();

            // Act
            sut.IncreaseCounter(null, itemSaveEventArg);

            // Assert
            var counter = ItemEditCounter.GetAndResetCounter();
            counter.Should().Be(0);
        }

        [Fact]
        public void IncreaseCounter_Parallel_WithItemSavedRemoteArgs_NoExcludedItemIds()
        {
            // Arrange
            var fakeItem = new FakeItem();
            var itemSaveEventArg = new ItemSavedRemoteEventArgs(fakeItem, null);
            var counterIncrement = 5;

            ResetCounter();
            ConfigureReturnEmptyExcludedItemIds();

            // Act
            Parallel.For(0, counterIncrement, (count) => sut.IncreaseCounter(null, itemSaveEventArg));

            // Assert
            var counter = ItemEditCounter.GetAndResetCounter();
            counter.Should().Be(counterIncrement);
        }

        private static void ResetCounter()
        {
            ItemEditCounter.GetAndResetCounter();
            ItemEditCounter.ResetExcludedItemIds();
        }

        private void ConfigureReturnEmptyExcludedItemIds()
        {
            sut.Configure().GetExcludedItemIdsSetting().ReturnsForAnyArgs(string.Empty);
        }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using easyJet.Foundation.Publishing.Logging;
using Sitecore.Configuration;
using Sitecore.Data.Events;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Events;

[assembly: InternalsVisibleTo("easyJet.Foundation.Publishing.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Foundation.Publishing
{
    public class ItemEditCounter
    {
        private readonly IPublishingLogger logger;

        public ItemEditCounter(IPublishingLogger logger)
        {
            this.logger = logger;
        }

        private static HashSet<string> excludeItemIds;
        private static long itemsEditCount;

        public static long GetAndResetCounter() => Interlocked.Exchange(ref itemsEditCount, 0);

        public static void ResetExcludedItemIds() => excludeItemIds = null;

        public void IncreaseCounter(object sender, EventArgs args)
        {
            var eventName = ExtractEventName(args);
            var itemFromEvent = ExtractItemFromEvent(args);
            var excludeItemIds = GetExcludeItemIds();

            if (itemFromEvent != null && excludeItemIds.Contains(itemFromEvent.ID.ToString().ToLower()))
            {
                logger.Info($"{nameof(ItemEditCounter)} [{eventName}] item ({itemFromEvent.Uri}) is in exclude list.", this);
                return;
            }

            var count = Interlocked.Increment(ref itemsEditCount);

            logger.Info(
                itemFromEvent != null
                    ? $"{nameof(ItemEditCounter)} [{eventName}] counter={count} item: {itemFromEvent.Uri}"
                    : $"{nameof(ItemEditCounter)} [{eventName}] counter={count} (item not available)", this);
        }

        internal virtual string GetExcludedItemIdsSetting() => Settings.GetSetting("Publishing.ItemEditCounter.ExcludeItemIds", string.Empty);

        private static string ExtractEventName(EventArgs args)
        {
            switch (args)
            {
                case SitecoreEventArgs sitecoreEventArgs:
                    return sitecoreEventArgs.EventName;
                case ItemSavedRemoteEventArgs _:
                    return "item:saved:remote";
                case ItemDeletedRemoteEventArgs _:
                    return "item:deleted:remote";
                default:
                    return "unknown";
            }
        }

        private HashSet<string> GetExcludeItemIds()
        {
            if (excludeItemIds != null)
            {
                return excludeItemIds;
            }

            excludeItemIds = GetExcludedItemIdsSetting().Split("|".ToCharArray(), StringSplitOptions.RemoveEmptyEntries).Select(i => i.ToLower()).ToHashSet();

            return excludeItemIds;
        }

        private Item ExtractItemFromEvent(EventArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            try
            {
                switch (args)
                {
                    case ItemSavedRemoteEventArgs savedRemoteEventArgs:
                        return savedRemoteEventArgs.Item;
                    case ItemDeletedRemoteEventArgs deletedRemoteEventArgs:
                        return deletedRemoteEventArgs.Item;
                    case SitecoreEventArgs sitecoreEventArgs
                        when sitecoreEventArgs.EventName == "item:saved" || sitecoreEventArgs.EventName == "item:deleted":
                        return Event.ExtractParameter<Item>(sitecoreEventArgs, 0);
                }

                return null;
            }
            catch (Exception e)
            {
                logger.Error($"{nameof(ItemEditCounter)}", e, this);
                return null;
            }
        }
    }
}

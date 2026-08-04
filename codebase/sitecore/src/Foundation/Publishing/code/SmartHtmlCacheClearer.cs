using System;
using System.Diagnostics;
using easyJet.Foundation.Publishing.Logging;
using Sitecore.Abstractions;

namespace easyJet.Foundation.Publishing
{
    public class SmartHtmlCacheClearer : Sitecore.Publishing.SmartHtmlCacheClearer
    {
        private readonly IPublishingLogger logger;

        public SmartHtmlCacheClearer(BaseCacheManager cacheManager, BaseSiteContextFactory siteContextFactory, IPublishingLogger logger)
            : base(cacheManager, siteContextFactory)
        {
            this.logger = logger;
        }

        public void SmartClearCache(object sender, EventArgs args)
        {
            var changedItems = ItemEditCounter.GetAndResetCounter();
            if (changedItems <= 0)
            {
                logger.Info($"{nameof(SmartHtmlCacheClearer)} nothing changed. Cache will not be cleared", this);
                return;
            }

            logger.Info($"{nameof(SmartHtmlCacheClearer)} {changedItems} item(s) changed. Clearing HTML cache...", this);
            var sw = Stopwatch.StartNew();
            ClearCache(sender, args);
            sw.Stop();
            logger.Info($"{nameof(SmartHtmlCacheClearer)} HTML cache cleared in {sw.ElapsedMilliseconds}ms", this);
        }
    }
}

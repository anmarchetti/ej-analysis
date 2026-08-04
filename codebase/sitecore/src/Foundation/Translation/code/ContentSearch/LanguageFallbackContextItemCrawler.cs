using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.Translation.Common;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Translation.ContentSearch
{
    [ExcludeFromCodeCoverage]
    public class LanguageFallbackContextItemCrawler : SitecoreItemCrawler
    {
        public LanguageFallbackContextItemCrawler()
            : base()
        {
        }

        public LanguageFallbackContextItemCrawler(IIndexOperations indexOperations)
            : base(indexOperations)
        {
        }

        protected override void DoAdd(IProviderUpdateContext context, SitecoreIndexableItem indexable)
        {
            using (new IndexingContextSwitcher())
            {
                base.DoAdd(context, indexable);
            }
        }

        protected override void DoUpdate(IProviderUpdateContext context, SitecoreIndexableItem indexable)
        {
            using (new IndexingContextSwitcher())
            {
                base.DoUpdate(context, indexable);
            }
        }

        protected override void DoUpdate(IProviderUpdateContext context, SitecoreIndexableItem indexable, IndexEntryOperationContext operationContext)
        {
            using (new IndexingContextSwitcher())
            {
                base.DoUpdate(context, indexable, operationContext);
            }
        }
    }
}
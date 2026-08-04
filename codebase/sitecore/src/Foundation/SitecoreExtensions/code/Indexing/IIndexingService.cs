using Sitecore.Data.Items;

namespace easyJet.Foundation.SitecoreExtensions.Indexing
{
    public interface IIndexingService
    {
        void UpdateItem(Item item, string indexName);

        void UpdateItem(Item item, EasyjetIndexes i);

        void FullRebuild(string indexName);

        void FullRebuild(EasyjetIndexes i);

        string GetIndexName(EasyjetIndexes i);
    }
}
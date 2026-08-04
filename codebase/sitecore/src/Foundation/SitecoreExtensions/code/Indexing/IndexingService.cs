using System;
using System.Collections.Generic;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logging;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.Maintenance;
using Sitecore.Data.Items;

namespace easyJet.Foundation.SitecoreExtensions.Indexing
{
    [Service(typeof(IIndexingService), Lifetime = Lifetime.Transient)]
    public class IndexingService : IIndexingService
    {
        private static readonly Dictionary<EasyjetIndexes, string> IndexNames =
            new Dictionary<EasyjetIndexes, string>
            {
                { EasyjetIndexes.Core, Constants.Index.CoreIndex },
                { EasyjetIndexes.Master, Constants.Index.MasterIndex },
                { EasyjetIndexes.Web, Constants.Index.WebIndex },
                { EasyjetIndexes.MarketingDefinitionsMaster, Constants.Index.MarketingDefinitionsMasterIndex },
                { EasyjetIndexes.MarketingDefinitionsWeb, Constants.Index.MarketingDefinitionsWebIndex },
                { EasyjetIndexes.MarketingAssetMaster, Constants.Index.MarketingAssetMasterIndex },
                { EasyjetIndexes.MarketingAssetWeb, Constants.Index.MarketingAssetWebIndex },
                { EasyjetIndexes.Testing, Constants.Index.TestingIndex },
                { EasyjetIndexes.SuggestedTest, Constants.Index.SuggestedTestIndex },
                { EasyjetIndexes.Personalization, Constants.Index.PersonalizationIndex },
                { EasyjetIndexes.FxmMaster, Constants.Index.FxmMasterIndex },
                { EasyjetIndexes.FxmWeb, Constants.Index.FxmWebIndex },
                { EasyjetIndexes.DestinationMaster, Constants.Index.DestinationsMasterIndex },
                { EasyjetIndexes.DestinationWeb, Constants.Index.DestinationsWebIndex },
                { EasyjetIndexes.Publishing, Constants.Index.PublishingIndex },
                { EasyjetIndexes.TransferInfoMaster, Constants.Index.TransferInfoMasterIndex },
                { EasyjetIndexes.TransferInfoWeb, Constants.Index.TransferInfoWebIndex },
                { EasyjetIndexes.PromotionsMaster, Constants.Index.PromotionsMasterIndex },
                { EasyjetIndexes.PromotionsWeb, Constants.Index.PromotionsWebIndex },
                { EasyjetIndexes.ArticlesMaster, Constants.Index.ArticlesMasterIndex },
                { EasyjetIndexes.ArticlesWeb, Constants.Index.ArticlesWebIndex }
            };

        private readonly ISitecoreExtensionsLogger logger;

        public IndexingService(ISitecoreExtensionsLogger logger)
        {
            this.logger = logger;
        }

        public void UpdateItem(Item item, string indexName)
        {
            if (item == null || string.IsNullOrEmpty(indexName))
            {
                logger.Warn($"{nameof(UpdateItem)}: {nameof(item)} or {nameof(indexName)} null or empty!", this);
                return;
            }

            try
            {
                var index = ContentSearchManager.GetIndex(indexName);
                logger.Info($"{nameof(UpdateItem)}: updating index: {indexName} - Subtree: {item.Paths.FullPath}", this);
                IndexCustodian.Refresh(index, new SitecoreIndexableItem(item));
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(UpdateItem)}: failed to update index '{indexName}' for item '{item.ID}'.", ex, this);
            }
        }

        public void UpdateItem(Item item, EasyjetIndexes i)
        {
            try
            {
                UpdateItem(item, GetIndexName(i));
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(UpdateItem)}: failed while resolving index for value '{i}'.", ex, this);
            }
        }

        public void FullRebuild(string indexName)
        {
            if (string.IsNullOrEmpty(indexName))
            {
                logger.Warn($"{nameof(FullRebuild)}: {nameof(indexName)} null or empty!", this);
                return;
            }

            try
            {
                var index = ContentSearchManager.GetIndex(indexName);
                logger.Info($"{nameof(FullRebuild)}: rebuild index: {indexName}", this);
                IndexCustodian.FullRebuild(index);
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(FullRebuild)}: failed to rebuild index '{indexName}'.", ex, this);
            }
        }

        public void FullRebuild(EasyjetIndexes i)
        {
            try
            {
                FullRebuild(GetIndexName(i));
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(FullRebuild)}: failed while resolving index for value '{i}'.", ex, this);
            }
        }

        public string GetIndexName(EasyjetIndexes i)
        {
            return !IndexNames.TryGetValue(i, out var result)
                ? throw new ArgumentOutOfRangeException(nameof(i), i, "Unknown index")
                : result;
        }
    }
}
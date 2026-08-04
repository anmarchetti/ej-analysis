using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Feature.SitecoreEnhancment.ForceRepublish
{
    public interface IPublishManagerService
    {
        void PublishItem(
            Item contextItem,
            Database[] databases,
            Language[] languages,
            bool deep,
            bool compareRevisions,
            bool publishRelatedItems);
    }
}
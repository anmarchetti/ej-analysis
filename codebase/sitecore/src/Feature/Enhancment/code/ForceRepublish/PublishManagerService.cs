using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.Publishing;

namespace easyJet.Feature.SitecoreEnhancment.ForceRepublish
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IPublishManagerService), Lifetime = Lifetime.Transient)]
    public class PublishManagerService : IPublishManagerService
    {
        public void PublishItem(Item contextItem, Database[] databases, Language[] languages, bool deep, bool compareRevisions, bool publishRelatedItems)
        {
            PublishManager.PublishItem(contextItem, databases, languages, deep, false, false);
        }
    }
}
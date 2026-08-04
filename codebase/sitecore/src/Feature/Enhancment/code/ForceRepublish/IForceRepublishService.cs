using System.Collections.Generic;
using Sitecore.Data.Items;

namespace easyJet.Feature.SitecoreEnhancment.ForceRepublish
{
    public interface IForceRepublishService
    {
        IEnumerable<Item> ForceRepublish(Item currentItem, PublishMode publishMode = PublishMode.SingleItem, PublishLanguage publishLanguage = PublishLanguage.CurrentLanguage);
    }
}
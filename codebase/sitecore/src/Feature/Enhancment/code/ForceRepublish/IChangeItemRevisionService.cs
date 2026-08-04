using System.Collections.Generic;
using Sitecore.Data.Items;

namespace easyJet.Feature.SitecoreEnhancment.ForceRepublish
{
    public interface IChangeItemRevisionService
    {
        void ChangeItemRevision(Item item);

        void ChangeItemRevision(List<Item> items);
    }
}
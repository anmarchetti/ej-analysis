using System.Collections.Generic;
using System.Linq;
using System.Xml;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.Data.Items;
using Sitecore.Xml;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class PromoFacilitiesComputedField : AccommodationComputedField
    {
        private const string CacheKeyPrefix = "Destinations.Cache.PromoBlocks";

        private readonly ICustomCacheRepository cache;

        private string SiteName { get; }

        public PromoFacilitiesComputedField(XmlNode configurationNode)
        {
            cache = new CustomCacheRepository();
            SiteName = XmlUtil.GetAttribute("siteName", configurationNode);
        }

        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            Item item = indexableItem?.Item;
            if (item == null)
            {
                return null;
            }

            var cacheKey = $"{CacheKeyPrefix}-{item.ID}-{indexableItem.Culture}";
            var data = cache.GetItem<List<string>>(cacheKey);

            if (data != null)
            {
                return data;
            }

            var featuredFacilitiesFolder = item.Axes.SelectSingleItem(item.QuerySafePath() +
               $"/*[@@templateid='{Constants.TemplateIds.PageComponentsFolder}']/*[@@templateid='{Constants.TemplateIds.PromoBlocksFolder}' and @{Constants.Fields.PromoBlocksFolder.FeaturedFacilities}='1']");

            var promoFacilities = featuredFacilitiesFolder?.Children
                   .Where(x => x.TemplateID == Constants.TemplateIds.PromoBlock)
                   .Select(x => JsonConvert.SerializeObject(new PromoFacility(x)
                   {
                       Link = new Link(x.Fields[Constants.Fields.PromoBlock.Link], SiteName)
                   })).ToList();

            if (promoFacilities != null && promoFacilities.Any())
            {
                cache.StoreItem(cacheKey, promoFacilities);
            }

            return promoFacilities;
        }
    }
}

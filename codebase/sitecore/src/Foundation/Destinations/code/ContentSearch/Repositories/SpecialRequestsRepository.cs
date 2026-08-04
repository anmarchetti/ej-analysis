using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Mvc.Extensions;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    [Service(typeof(ISpecialRequestsRepository), Lifetime = Lifetime.Transient)]
    public class SpecialRequestsRepository : ISpecialRequestsRepository
    {
        private readonly IHtmlCacheRepository cache;

        public SpecialRequestsRepository(IHtmlCacheRepository cache)
        {
            this.cache = cache;
        }

        public SpecialRequests GetAll()
        {
            string cacheKey = "Destinations.Cache.SpecialRequests";
            var data = cache.GetItem<SpecialRequests>(cacheKey);
            if (data != null)
            {
                return data;
            }

            var specialRequestTypeFolder = Context.Database
                .SelectSingleItem($"{Context.Site.RootPath}/*[@@templateid ='{Templates.Data.Id}']/*[@@templateid ='{Constants.TemplateIds.SpecialRequestsFolder}']");

            if (specialRequestTypeFolder == null)
            {
                return null;
            }

            MultilistField specialRequestTypesField = specialRequestTypeFolder?.Fields[Constants.Fields.SpecialRequestsFolder.SpecialRequestsTypes];
            MultilistField contradictoryTypesField = specialRequestTypeFolder?.Fields[Constants.Fields.SpecialRequestsContradictoryFolder.SpecialRequestsContradictoryGroups];

            var specialRequestTypes = specialRequestTypesField?.GetItems()
                .Where(item => item.TemplateID == Constants.TemplateIds.SpecialRequestType)
                .Select(item => new SpecialRequestType(item)).ToList();

            var specialRequestsContradictoryGroups = contradictoryTypesField?.GetItems()
                .Where(item => item.TemplateID == Constants.TemplateIds.SpecialRequestsContradictoryGroupId)
                .Select(item => new SpecialRequestsContradictoryGroup(item)).ToList();

            var result = new SpecialRequests
            {
                SpecialRequestType = specialRequestTypes,
                SpecialRequestsContradictoryGroup = specialRequestsContradictoryGroups
            };

            if (specialRequestTypes.Any() || specialRequestsContradictoryGroups.Any())
            {
                cache.StoreItem(cacheKey, result);
            }

            return result;
        }
    }
}
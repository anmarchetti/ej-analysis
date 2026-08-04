using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    [Service(typeof(ITransferTypesRepository), Lifetime = Lifetime.Transient)]
    public class TransferTypesRepository : ITransferTypesRepository
    {
        private readonly IHtmlCacheRepository cache;

        public TransferTypesRepository(IHtmlCacheRepository cache)
        {
            this.cache = cache;
        }

        public IEnumerable<TransferType> GetAll()
        {
            string cacheKey = "Destinations.Cache.TransferTypes";
            var data = cache.GetItem<List<TransferType>>(cacheKey);
            if (data != null)
            {
                return data;
            }

            var transferTypeFolder = Context.Database
                .SelectSingleItem($"{Context.Site.RootPath}/*[@@templateid ='{Templates.Data.Id}']/*[@@templateid ='{Constants.TemplateIds.TransfersTypeFolder}']");

            if (transferTypeFolder == null)
            {
                return new List<TransferType>();
            }

            var transferTypes = transferTypeFolder.Children
                .Where(item => item.TemplateID == Constants.TemplateIds.TransferType)
                .Select(item => new TransferType()
                {
                    Code = item.Fields[Constants.Fields.DatasourceItem.Code]?.Value,
                    Name = item.Fields[Constants.Fields.DatasourceItem.Name]?.Value,
                    Content = item.Fields[Constants.Fields.DatasourceItem.Content]?.Value,
                    IconUrl = item.GetMediaUrl(Constants.Fields.AccommodationReferenceItem.Icon),
                    ContentByDate = item.GetChildren().Select(x => new ContentByDate(x))
                }).ToList();

            if (transferTypes.Any())
            {
                cache.StoreItem(cacheKey, transferTypes);
            }

            return transferTypes;
        }
    }
}
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.SitecoreExtensions.Services;
using Newtonsoft.Json.Linq;
using Sitecore.Abstractions;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Foundation.Destinations.ContentResolvers
{
    public class HotelWithReviewsContentResolver : RenderingContentsResolver
    {
        private int HotelWithReviewMaxSize { get; }

        private readonly IDestinationsRepository destinationsRepository;
        private readonly IOrderedListItemsManager orderedListItemsManager;

        public HotelWithReviewsContentResolver(IDestinationsRepository destinationsRepository, IOrderedListItemsManager orderedListItemsManager, BaseSettings settings)
        {
            this.destinationsRepository = destinationsRepository;
            this.orderedListItemsManager = orderedListItemsManager;
            HotelWithReviewMaxSize = settings.GetIntSetting("Destinations.HotelWithReviews.HotelTakeCount", 0);
        }

        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            var contextItem = GetContextItem(rendering, renderingConfig);
            if (contextItem == null)
            {
                return null;
            }

            var jobject = new JObject
            {
                ["items"] = new JArray()
            };

            var resorts = GetResorts(contextItem);
            var items = GetHotels(resorts);

            if (items == null || !items.Any())
            {
                return jobject;
            }

            jobject["items"] = ProcessItems(items);
            return jobject;
        }

        /// <summary>
        /// Retrieves a list of resorts based on the template type of the provided Sitecore context item.
        /// </summary>
        /// <param name="contextItem">Context Item.</param>
        /// <returns>
        /// Collection of resort items.
        /// </returns>
        protected internal IEnumerable<Item> GetResorts(Item contextItem)
        {
            if (contextItem == null)
            {
                return Enumerable.Empty<Item>();
            }

            if (contextItem.TemplateID == Constants.TemplateIds.Resort)
            {
                return new Item[] { contextItem };
            }

            if (contextItem.TemplateID == Constants.TemplateIds.RegionPage || contextItem.TemplateID == Constants.TemplateIds.RegionCityPage)
            {
                return orderedListItemsManager.GetOrderedItems(contextItem, Constants.Fields.SortingFields.SeoResortSortOrder);
            }

            if (contextItem.TemplateID == Constants.TemplateIds.VirtualResort)
            {
                MultilistField multilistField = contextItem.Fields[Constants.Fields.VirtualDestination.Resorts];
                return multilistField?.GetItems().ToList();
            }

            return Enumerable.Empty<Item>();
        }

        /// <summary>
        /// Retrieves a collection of hotels with reviews from a list of resorts, limiting the total number of hotels to a specified maximum.
        /// </summary>
        /// <param name="resorts">Collection of resort items.</param>
        /// <returns>
        /// A collection of <see cref="HotelWithReviewSearchResultItem"/> objects, with a maximum size of <see cref="HotelWithReviewMaxSize"/>.
        /// If no hotels are found, an empty list is returned.
        /// </returns>
        protected internal IEnumerable<HotelWithReviewSearchResultItem> GetHotels(IEnumerable<Item> resorts)
        {
            if (resorts == null)
            {
                return Enumerable.Empty<HotelWithReviewSearchResultItem>();
            }

            List<HotelWithReviewSearchResultItem> result = new List<HotelWithReviewSearchResultItem>();

            foreach (var resort in resorts)
            {
                var hotels = destinationsRepository.GetHotelsWithReviews(resort.Paths.FullPath);
                if (hotels != null && hotels.Any())
                {
                    result.AddRange(hotels.Select(x => x.Document));
                }

                if (result.Count >= HotelWithReviewMaxSize)
                {
                    return result.Take(HotelWithReviewMaxSize).OrderBy(x => x.NormalaziedName);
                }
            }

            return result;
        }

        private static JArray ProcessItems(IEnumerable<HotelWithReviewSearchResultItem> items)
        {
            var jArray = new JArray();
            foreach (var item in items)
            {
                var value = new JObject
                {
                    [Constants.Fields.DatasourceItem.Name] = item.ItemName,
                    [Constants.Fields.AccommodationItem.StarRating] = item.StarRating,
                    [Constants.Fields.AccommodationItem.TotalNumberOfReviews] = item.TotalNumberOfReviews,
                    [Constants.Fields.AccommodationItem.HotelRating] = item.HotelRating,
                    ["url"] = item.HotelUrl,
                };

                if (item.EcoFacility != null)
                {
                    value["EcoFacility"] = JToken.Parse(item.EcoFacility);
                }

                jArray.Add(value);
            }

            return jArray;
        }
    }
}
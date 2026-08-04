using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using Newtonsoft.Json.Linq;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Foundation.Destinations.ContentResolvers
{
    public class HotelContentResolver : RenderingContentsResolver
    {
        private readonly IDestinationsRepository destinationsRepository;

        public HotelContentResolver(IDestinationsRepository destinationsRepository)
        {
            this.destinationsRepository = destinationsRepository;
        }

        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            try
            {
                if (!UseContextItem)
                {
                    Log.Warn($"{nameof(HotelContentResolver)} has to use context item mode", this);
                    return null;
                }

                var contextItem = GetContextItem(rendering, renderingConfig);

                var result = ProcessItem(contextItem, rendering, renderingConfig);
                SetAdditionalProperties(result, contextItem);

                return result;
            }
            catch (Exception e)
            {
                Log.Error($"{nameof(HotelContentResolver)} cannot resolve content for Item {rendering?.Item?.Name}", e, this);
                return null;
            }
        }

        /// <summary>
        /// Set additional properties to serialized context item.
        /// </summary>
        /// <param name="processedItem">Serialized item.</param>
        /// <param name="contextItem">Context item.</param>
        private void SetAdditionalProperties(JObject processedItem, Item contextItem)
        {
            processedItem.Add("Locations", JArray.FromObject(GetDestinations(contextItem)));
            processedItem["Facilities"] = JArray.FromObject(GetFacilities(contextItem));

            string hotelCode = contextItem[Constants.Fields.DatasourceItem.Code];
            if (string.IsNullOrEmpty(hotelCode))
            {
                return;
            }

            var data = destinationsRepository.SearchHotelsByCodes(new string[] { hotelCode })?.FirstOrDefault();

            // Overwrite ClosestFacility field
            processedItem["ClosestFacility"] = JObjectMapper.ToJObject(data?.Document?.ClosestFacility);
            processedItem["EcoFacility"] = JObjectMapper.ToJObject(data?.Document?.EcoFacility);
        }

        private List<Destination> GetDestinations(Item item)
        {
            var parent = item.Parent;

            var destinations = new List<Destination>();
            while (parent.IsDestinationItem())
            {
                destinations.Add(new Destination()
                {
                    Code = parent[Constants.Fields.DatasourceItem.Code],
                    Name = parent[Constants.Fields.DatasourceItem.Name],
                    Type = DestinationsMapper.MapRegionTemplateName(parent.TemplateName),
                });
                parent = parent.Parent;
            }

            return destinations;
        }

        /// <summary>
        /// Get accommodation's facilities.
        /// </summary>
        /// <param name="item">Accommodation item.</param>
        /// <returns>Collection of accommodation's facilities.</returns>
        private IEnumerable<HotelFacility> GetFacilities(Item item)
        {
            if (item == null || !item.TemplateID.Equals(Constants.TemplateIds.Accommodation))
            {
                return Enumerable.Empty<HotelFacility>();
            }

            var facilitiesFolder = item
                    .GetChildren()
                    .FirstOrDefault(x => x.TemplateID.Equals(Constants.TemplateIds.AccommodationFacilitiesFolder));

            if (facilitiesFolder == null)
            {
                return Enumerable.Empty<HotelFacility>();
            }

            // Get accommodation facilities
            var facilities = facilitiesFolder.GetChildren()
             .Where(x => x.TemplateID == Constants.TemplateIds.AccommodationFacility)
             .Select(AccommodationMapper.MapHotelFacilityFromItem)
             .Where(x => x != null);

            return facilities;
        }
    }
}
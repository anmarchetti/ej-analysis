using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using easyJet.Foundation.BeCause.Logging;
using easyJet.Foundation.BeCause.Models.Request;
using easyJet.Foundation.BeCause.Services.Api;
using easyJet.Foundation.BeCause.Settings;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;

namespace easyJet.Foundation.BeCause.Services
{
    [Service(typeof(IDataPushService), Lifetime = Lifetime.Transient)]
    public class DataPushService : IDataPushService
    {
        private readonly IMasterDataService masterDataService;
        private readonly IBeCauseLogger logger;
        private readonly ISettingsService settingsService;
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IDatabaseProvider databaseProvider;

        public DataPushService(
            IMasterDataService masterDataService,
            IBeCauseLogger logger,
            ISettingsService settingsService,
            IDestinationsRepository destinationsRepository,
            IDatabaseProvider databaseProvider)
        {
            this.masterDataService = masterDataService;
            this.logger = logger;
            this.settingsService = settingsService;
            this.destinationsRepository = destinationsRepository;
            this.databaseProvider = databaseProvider;
        }

        public (bool isFaulted, string errorMessage) PushHotelData()
        {
            try
            {
                var settings = settingsService.GetSettings();
                if (settings == null)
                {
                    throw new Exception($"{nameof(PushHotelData)} - Settings not found!");
                }

                var customIdentifierId = settings.CustomIdentifierId;
                if (string.IsNullOrWhiteSpace(customIdentifierId))
                {
                    throw new Exception($"{nameof(PushHotelData)} - customIdentifierId is null, empty or whitespace!");
                }

                logger.Info("Fetching all hotels from destinations master index ...'", this);
                var hotels = destinationsRepository.GetAllHotels()
                    .Select(hotel => databaseProvider.GetItem(hotel.Document.ItemId, DatabaseType.Master))
                    .Where(hotel => hotel != null)
                    .Select(MapHotel)
                    .Where(mapping => mapping != null)
                    .DistinctBy(mapping => mapping.Id)
                    .ToList();

                if (!hotels.Any())
                {
                    throw new Exception($"{nameof(PushHotelData)} - no hotels left after mapping!");
                }

                logger.Info($"Received {hotels.Count} hotels from destinations master index.", this);

                if (!settings.IsEnabled)
                {
                    throw new Exception($"{nameof(PushHotelData)} - BeCause feature is disabled");
                }

                var request = CreateHotelMappingRequest(customIdentifierId, hotels, settings);
                masterDataService.GetHotelMappingResultAsync(request).GetAwaiter().GetResult();
                return (false, string.Empty);
            }
            catch (Exception exception)
            {
                logger.Error($"{nameof(PushHotelData)}", exception, this);
                return (true, exception.Message);
            }
        }

        private HotelMapping MapHotel(Item item)
        {
            var ancestors = item.Axes.GetAncestors();
            var parentCountry = Array.Find(ancestors, a => a.TemplateID == Destinations.Constants.TemplateIds.Country);
            var parentResort = Array.Find(ancestors, a => a.TemplateID == Destinations.Constants.TemplateIds.Resort);
            var parentRegion = Array.Find(ancestors, a => a.TemplateID == Destinations.Constants.TemplateIds.RegionPage || a.TemplateID == Destinations.Constants.TemplateIds.RegionCityPage);
            if (parentCountry == null || parentResort == null || parentRegion == null)
            {
                logger.Warn($"Parent country/resort/region not found for hotel: {item.Paths.FullPath}", this);
                return null;
            }

            var countryCode = parentCountry[Destinations.Constants.Fields.DatasourceItem.Code];
            if (string.IsNullOrWhiteSpace(countryCode))
            {
                logger.Warn($"Code field was null or empty on parent country: {parentCountry.Paths.FullPath}", this);
                return null;
            }

            try
            {
                var regionInfo = new RegionInfo(countryCode.ToUpper());
                var lat = item[Destinations.Constants.Fields.AccommodationItem.Latitude]?.Trim().Replace(",", ".");
                var lon = item[Destinations.Constants.Fields.AccommodationItem.Longitude]?.Trim().Replace(",", ".");
                var city = item[Destinations.Constants.Fields.AccommodationItem.City];
                var resort = item[Destinations.Constants.Fields.AccommodationItem.Resort];
                var giataCode = item[Destinations.Constants.Fields.AccommodationItem.GiataCode];
                var region = parentRegion.DisplayName;
                var street = item.DisplayName;
                var zip = item[Destinations.Constants.Fields.AccommodationItem.PostalCode];
                var name = item.DisplayName;

                if (string.IsNullOrWhiteSpace(city))
                {
                    city = string.IsNullOrWhiteSpace(resort)
                        ? parentResort.DisplayName
                        : resort;
                }

                if (string.IsNullOrWhiteSpace(giataCode)
                    || string.IsNullOrWhiteSpace(name)
                    || string.IsNullOrWhiteSpace(street)
                    || string.IsNullOrWhiteSpace(city)
                    || string.IsNullOrWhiteSpace(lat)
                    || string.IsNullOrWhiteSpace(lon)
                    || !decimal.TryParse(lat, out var latitude)
                    || !decimal.TryParse(lon, out var longitude))
                {
                    logger.Warn($"Discarding mapping for hotel: '{item.Paths.FullPath}' >> at least one mandatory field is empty/invalid! - GIATA:'{giataCode}' - Name:'{name}' - Street:'{street}' - City:'{city}' - ThreeLetterCountryCode:'{regionInfo.ThreeLetterISORegionName}' - Latitude:'{lat}' - Longitude:'{lon}'", this);
                    return null;
                }

                return new HotelMapping
                {
                    City = city,
                    GiataCode = giataCode,
                    Latitude = latitude,
                    Longitude = longitude,
                    Region = region,
                    Street = street,
                    ThreeLetterCountryCode = regionInfo.ThreeLetterISORegionName,
                    ZipCode = zip,
                    Name = name,
                };
            }
            catch (ArgumentException ex)
            {
                logger.Error($"{nameof(MapHotel)} code:{countryCode} can't be converted to threeLetterCountryCode", ex, this);
                return null;
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(MapHotel)} failed with unknown error", ex, this);
                return null;
            }
        }

        private HotelMappingRequest CreateHotelMappingRequest(string customIdentifierId, List<HotelMapping> hotels, BeCauseSettings settings)
        {
            return new HotelMappingRequest
            {
                CustomIdentifierId = customIdentifierId,
                Hotels = hotels,
                CertificationTags = settings.CertificationTags,
                IncludeLowConfidenceMatches = false,
                IncludeExpiredCertificationHolders = false,
                IncludeUnknownActiveCertificationHolders = false
            };
        }
    }
}
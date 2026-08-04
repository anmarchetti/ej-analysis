using System;
using System.Collections.Generic;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.TripAdvisor.Logging;
using easyJet.Foundation.TripAdvisor.Models;
using easyJet.Foundation.TripAdvisor.Models.Domain;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.TripAdvisor.Services.Sync
{
    [Service(typeof(ISyncDataService), Lifetime = Lifetime.Singleton)]
    public class SyncDataService : ISyncDataService
    {
        private readonly IMasterDataService service;
        private readonly ITripAdvisorLogger logger;

        public SyncDataService(IMasterDataService service, ITripAdvisorLogger logger)
        {
            this.service = service;
            this.logger = logger;
        }

        public IEnumerable<SyncResult> SyncRatings(IEnumerable<Item> hotelItems)
        {
            foreach (var hotelItem in hotelItems)
            {
                TripAdvisorError error = null;
                try
                {
                    var tripAdvisorId = hotelItem[Destinations.Constants.Fields.AccommodationItem.TripAdvisorId];
                    var code = hotelItem[Destinations.Constants.Fields.DatasourceItem.Code];
                    var (location, resolvedTripAdvisorId) = ResolveLocation(hotelItem, tripAdvisorId, code);

                    if (location.HasError())
                    {
                        logger.Debug($"Hotel {hotelItem.Name} ({hotelItem.ID}), TripAdvisorId: {resolvedTripAdvisorId}, Code: {code} was not updated", this);
                        error = location?.Error ?? new TripAdvisorError { Type = "NotFound", Message = "Unable to resolve location — no valid TripAdvisor id, hotel code, or coordinates available" };
                    }
                    else
                    {
                        UpdateTripAdvisorData(hotelItem, resolvedTripAdvisorId, location);
                    }
                }
                catch (Exception exc)
                {
                    logger.Error($"Error occurred while updating rating for {hotelItem.Name} ({hotelItem.ID})", exc, this);
                    error = new TripAdvisorError { Type = exc.GetType().Name, Message = exc.Message };
                }

                yield return new SyncResult(error, hotelItem);
            }
        }

        private static (string hotelItemTripAdvisorId, string hotelRating, string totalNumberOfReviews) GetHotelData(Item hotelItem)
        {
            var hotelItemTripAdvisorId = hotelItem.Fields[Destinations.Constants.Fields.AccommodationItem.TripAdvisorId]?.Value;
            var hotelRating = hotelItem.Fields[Destinations.Constants.Fields.AccommodationItem.HotelRating]?.Value;
            var totalNumberOfReviews = hotelItem.Fields[Destinations.Constants.Fields.AccommodationItem.TotalNumberOfReviews]?.Value;
            return (hotelItemTripAdvisorId, hotelRating, totalNumberOfReviews);
        }

        private (Location location, string resolvedTripAdvisorId) ResolveLocation(Item hotelItem, string tripAdvisorId, string code)
        {
            var location = ResolveByTripAdvisorId(tripAdvisorId);
            if (!location.HasError())
            {
                return (location, tripAdvisorId);
            }

            location = ResolveByCode(code);
            if (!location.HasError())
            {
                return (location, tripAdvisorId);
            }

            var mappedTripAdvisorId = ResolveByCoordinates(hotelItem, tripAdvisorId);
            if (mappedTripAdvisorId != null)
            {
                tripAdvisorId = mappedTripAdvisorId;
            }

            location = ResolveByTripAdvisorId(tripAdvisorId);
            return (location, tripAdvisorId);
        }

        private Location ResolveByTripAdvisorId(string tripAdvisorId) => !string.IsNullOrWhiteSpace(tripAdvisorId)
            ? service.GetLocation(tripAdvisorId)
            : null;

        private Location ResolveByCode(string code) => !string.IsNullOrEmpty(code)
            ? service.GetLocation(code)
            : null;

        private string ResolveByCoordinates(Item item, string tripAdvisorId)
        {
            if (!Settings.GetBoolSetting(Constants.Settings.AutoLocationMappingEnabled, false))
            {
                return null;
            }

            if (!string.IsNullOrEmpty(tripAdvisorId))
            {
                return null;
            }

            var longitude = item[Destinations.Constants.Fields.AccommodationItem.Longitude];
            var latitude = item[Destinations.Constants.Fields.AccommodationItem.Latitude];
            var name = item[Destinations.Constants.Fields.DatasourceItem.Name];

            if (string.IsNullOrWhiteSpace(longitude) || string.IsNullOrWhiteSpace(latitude) || string.IsNullOrWhiteSpace(name))
            {
                return null;
            }

            var location = service.GetLocationByCoordinatesAndHotelName(latitude, longitude, name);
            var validDistance = Settings.GetDoubleSetting(Constants.Settings.ValidDistanceInMiles, 0);

            if (location != null && !string.IsNullOrWhiteSpace(location.LocationId) && location.Distance <= validDistance)
            {
                return location.LocationId;
            }

            logger.Warn(
                $"Hotel {item.Name} ({item.ID}) [TripAdvisorId: {location?.LocationId}] " +
                $"was not updated because distance ({location?.Distance}) " +
                $"exceeds limit {validDistance}", this);

            return null;
        }

        private void UpdateTripAdvisorData(Item hotelItem, string tripAdvisorId, Location location)
        {
            using (new SecurityDisabler())
            {
                var (hotelItemTripAdvisorId, hotelRating, totalNumberOfReviews) = GetHotelData(hotelItem);
                try
                {
                    logger.Debug($"Item data before trip advisor update - TripAdvisorId: {tripAdvisorId}, locationId: {hotelItemTripAdvisorId}, rating: {hotelRating}, numberOfReviews: {totalNumberOfReviews}", this);
                    logger.Debug($"New Data from trip advisor - TripAdvisorId: {tripAdvisorId}, locationId: {location.LocationId}, rating: {location.Rating}, numberOfReviews {location.NumberOfReviews}", this);
                    var changes = new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.AccommodationItem.HotelRating, location.Rating?.ToString() },
                        { Destinations.Constants.Fields.AccommodationItem.TotalNumberOfReviews, location.NumberOfReviews?.ToString() },
                        { Destinations.Constants.Fields.AccommodationItem.TripAdvisorId, location.LocationId }
                    };
                    hotelItem.BulkUpdate(changes, false);
                }
                catch (Exception ex)
                {
                    logger.Error($"Error occurred while updating rating for {hotelItem.Name} ({hotelItem.ID}). TripAdvisorId: {tripAdvisorId}", ex, this);
                }

                (hotelItemTripAdvisorId, hotelRating, totalNumberOfReviews) = GetHotelData(hotelItem);
                logger.Debug($"Item data after trip advisor update - TripAdvisorId: {tripAdvisorId}, locationId: {hotelItemTripAdvisorId}, rating: {hotelRating}, numberOfReviews: {totalNumberOfReviews}", this);
            }
        }
    }
}

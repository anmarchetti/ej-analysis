using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IHotelContentFieldsService), Lifetime = Lifetime.Transient)]
    public class HotelContentFieldsService : IHotelContentFieldsService
    {
        private readonly IAirportsService airportsService;

        public HotelContentFieldsService(IAirportsService airportsService)
        {
            this.airportsService = airportsService;
        }

        /// <summary>
        /// Populates hotel content fields from the upsert request.
        /// </summary>
        /// <remarks>
        /// This method uses patch/update-only semantics. Only request values that are present
        /// and non-empty are applied to Sitecore. Null, empty, or whitespace values are ignored
        /// and do not clear existing Sitecore field values.
        /// </remarks>
        /// <param name="hotelItem">The Sitecore hotel item to update.</param>
        /// <param name="request">The upsert request containing hotel field values.</param>
        /// <param name="createNewVersion">Whether to create a new Sitecore item version during update.</param>
        /// <param name="populateNewExpediaDefaults">Whether to populate default metadata values for newly created Expedia hotels.</param>
        public void Populate(Item hotelItem, UpsertHotelRequest request, bool createNewVersion, bool populateNewExpediaDefaults)
        {
            if (hotelItem == null)
            {
                throw new ArgumentNullException(nameof(hotelItem));
            }

            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var changes = new Dictionary<string, string>();

            AddIfHasValue(changes, Constants.Fields.DatasourceItem.Name, request.Name);
            AddIfHasValue(changes, Constants.Fields.DatasourceItem.Code, request.Code);
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.GiataCode, request.GiataCode);
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.Description, request.HotelDescription);
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.StarRating, request.StarRating?.ToString(CultureInfo.InvariantCulture));
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.Address, request.Address);
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.City, request.City);
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.PostalCode, request.PostalCode);
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.Resort, request.Resort?.Name);
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.Website, request.Website);
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.Email, request.Email);
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.BookingPhone, request.BookingPhone ?? request.Phone);
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.HotelPhone, request.HotelPhone ?? request.Phone);
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.FaxNumber, request.FaxNumber);
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.Longitude, request.Longitude?.ToString(CultureInfo.InvariantCulture));
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.Latitude, request.Latitude?.ToString(CultureInfo.InvariantCulture));
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.Strapline, request.StrapLine);
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.KeySellingPoint1, request.KeySellingPoint1);
            AddIfHasValue(changes, Constants.Fields.MetaData.TrackingPageTitle, request.TrackingPageTitle);
            AddIfHasValue(changes, Constants.Fields.AccommodationItem.TripAdvisorId, request.TripAdvisorId);
            AddIfHasValue(changes, Constants.Fields.POIs.Subtitle, request.Subtitle);

            AddAirportsIfProvided(changes, hotelItem, request);

            if (populateNewExpediaDefaults)
            {
                AddNewExpediaDefaults(changes);
            }

            if (!changes.Any())
            {
                return;
            }

            hotelItem.BulkUpdate(changes, allowEmptyValues: false, createNewVersion: createNewVersion);
        }

        private static void AddNewExpediaDefaults(IDictionary<string, string> changes)
        {
            var robotsValue = string.Join("|", Constants.RobotsIds.NoFollowId.ToString(), Constants.RobotsIds.NoIndexId.ToString());
            var changeFrequencyValue = Constants.ChangeFrequencyDoNotIncludeId.ToString();

            changes[Constants.Fields.MetaData.Robots] = robotsValue;
            changes[Constants.Fields.SitemapBase.ChangeFrequency] = changeFrequencyValue;
        }

        private static void AddIfHasValue(IDictionary<string, string> changes, string fieldName, string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return;
            }

            changes[fieldName] = value;
        }

        private static string ResolveSiteRootPath(Item hotelItem)
        {
            var configuredRootPath = Settings.GetSetting("Destinations.SiteRootPath");

            if (!string.IsNullOrWhiteSpace(configuredRootPath))
            {
                return configuredRootPath;
            }

            if (!string.IsNullOrWhiteSpace(Context.Site?.RootPath))
            {
                return Context.Site.RootPath;
            }

            var itemPath = hotelItem?.Paths?.FullPath;

            if (string.IsNullOrWhiteSpace(itemPath))
            {
                return null;
            }

            const string homeSegment = "/Home/";

            var homeIndex = itemPath.IndexOf(homeSegment, StringComparison.InvariantCultureIgnoreCase);

            if (homeIndex > 0)
            {
                return itemPath.Substring(0, homeIndex);
            }

            return null;
        }

        private void AddAirportsIfProvided(
            IDictionary<string, string> changes,
            Item hotelItem,
            UpsertHotelRequest request)
        {
            if (request.AirportCodes == null || !request.AirportCodes.Any())
            {
                return;
            }

            var airportCodes = request.AirportCodes
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim().ToUpperInvariant())
                .Distinct(StringComparer.InvariantCultureIgnoreCase)
                .ToList();

            if (!airportCodes.Any())
            {
                return;
            }

            var airportsValue = ResolveAirportsValue(hotelItem, airportCodes);

            AddIfHasValue(
                changes,
                Constants.Fields.AccommodationItem.Airports,
                airportsValue);
        }

        private string ResolveAirportsValue(Item hotelItem, IEnumerable<string> airportCodes)
        {
            var originalContentDatabase = Context.ContentDatabase;

            try
            {
                if (Context.ContentDatabase == null && hotelItem?.Database != null)
                {
                    Context.ContentDatabase = hotelItem.Database;
                }

                var sitePath = ResolveSiteRootPath(hotelItem);

                return airportsService.GetAccommodationAirportsField(
                    hotelItem,
                    airportCodes,
                    sitePath);
            }
            finally
            {
                Context.ContentDatabase = originalContentDatabase;
            }
        }
    }
}

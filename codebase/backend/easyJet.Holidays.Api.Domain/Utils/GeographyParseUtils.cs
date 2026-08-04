using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using Force.DeepCloner;

namespace easyJet.Holidays.Api.Domain.Utils
{
    /// <summary>
    /// Utilities to build geography field value and do requests to atcom
    /// </summary>
    public class GeographyParseUtils
    {
        private static readonly string _atcomAnywhereCode = "ALL";

        /// <summary>
        /// Returns geography field bace on country/region/resort codes
        /// ES|IT,ESBA|ESDR,ESBABA|ESBABB
        /// </summary>
        /// <param name="destinations"></param>
        /// <returns></returns>
        public static string BuildGeographyField(List<DestinationItem> destinations)
        {
            if (destinations == null || !destinations.Any())
            {
                return _atcomAnywhereCode;
            }

            var countries = new List<string>();
            var regions = new List<string>();
            var resorts = new List<string>();

            //check if we need include child regions to countries
            //only countries - not necessary (AT|BG|HR|CY|CZ|DK|EG|EE|FR|DE|GI|GR|HU|IS|IL)
            bool addRegionsToCountry = destinations.Any(item => item.Type == DestinationItemType.Region) ||
                                       destinations.Any(item => item.Type == DestinationItemType.Resort);

            foreach (DestinationItem item in destinations)
            {
                if (item.Type == DestinationItemType.Resort)
                {
                    resorts.Add(item.Code);
                    regions.Add(item.Parents.FirstOrDefault(x => x.Type == DestinationItemType.Region)?.Code ?? "");
                    countries.Add(item.Parents.FirstOrDefault(x => x.Type == DestinationItemType.Country)?.Code ?? "");
                }

                if (item.Type == DestinationItemType.Region)
                {
                    regions.Add(item.Code);
                    countries.Add(item.Parents.FirstOrDefault(x => x.Type == DestinationItemType.Country)?.Code ?? "");
                }

                if (item.Type == DestinationItemType.Country)
                {
                    countries.Add(item.Code);
                    //add child regions to country if necessary
                    if (addRegionsToCountry && item.Children != null && item.Children.Any())
                    {
                        regions.AddRange(item.Children.Where(x => x.Type == DestinationItemType.Region)
                            .Select(destinationItem => destinationItem.Code ?? ""));
                    }
                }
            }

            countries = countries.Where(x => !string.IsNullOrEmpty(x)).Distinct().ToList();
            regions = regions.Where(x => !string.IsNullOrEmpty(x)).Distinct().ToList();
            resorts = resorts.Where(x => !string.IsNullOrEmpty(x)).Distinct().ToList();
            var parts = new List<string>()
            {
                string.Join("|", countries),
                regions.Count == 0 && resorts.Count == 0 ? null : string.Join("|", regions),
                resorts.Count == 0 ? null : string.Join("|", resorts)
            }.Where(x => x != null);
            return string.Join(",", parts);
        }

        /// <summary>
        /// Returns AccomCodes field based on destinations (hotels)
        /// HRDB0028,X9174306,HRDB0020
        /// </summary>
        /// <param name="destinations"></param>
        /// <returns>AccomCodes string field or null</returns>
        public static string BuildAccomCodesField(List<DestinationItem> destinations)
        {
            if (destinations == null || !destinations.Any())
            {
                return null;
            }

            var accomCodes = string.Join(",",
                destinations.Where(item => item.Type == DestinationItemType.Hotel).Select(item => item.Code));
            return accomCodes;
        }

        /// <summary>
        /// Split atcom request to two requests if geography field contains resorts.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="request">Initial request</param>
        /// <param name="action">Action to execute</param>
        /// <param name="destinationsSearchService">Service to get destination by codes</param>
        /// <returns></returns>
        public static async Task<(T, bool)[]> DoSplitByGeographyRequests<T>(PackagesSearchRequest request,
            Func<PackagesSearchRequest, Task<(T, bool)>> action, IDestinationsService destinationsSearchService)
        {
            //Atcom only supports whether geography or accomCodes, but not both.
            //Geography value will be ignored if AccomCodes is specified.
            //Therefore we should ignore handling geography and will send single request
            if (!string.IsNullOrWhiteSpace(request.AccomCodes))
            {
                var singleRequestRes = await action(request);
                return new[] { singleRequestRes };
            }

            //TODO Check why we ignore countries destinations
            var parts = request.Geography?.Split(',');

            if (request.Geography != null && parts?.Length == 3)
            {
                // [0] is countries
                var regions = parts[1].Split('|');
                var resorts = parts[2].Split('|');

                // Get all regions info from geography field
                var destinationsInfo =
                    await destinationsSearchService.GetDestinationsByCodes(resorts.Concat(regions).ToArray(), true);

                return await SplitRequestByDestinations(request, action, destinationsInfo);
            }
            // Single atcom request if no resorts found in geography field
            else
            {
                var singleRequestRes = await action(request);
                return new[] { singleRequestRes };
            }
        }

        /// <summary>
        /// Parse array of destinations by type
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="destinationsInfo"></param>
        /// <returns></returns>
        public static Dictionary<DestinationItemType?, List<T>>
            ParseDestinationItemsByType<T>(IEnumerable<T> destinationsInfo) where T : DestinationItem
        {
            var destinationsItemsByType = destinationsInfo?.GroupBy(item => item.Type)
                .Where(items => items.Key.HasValue)
                .ToDictionary(items => items.Key, items => items.ToList());

            return destinationsItemsByType ?? new Dictionary<DestinationItemType?, List<T>>();
        }

        /// <summary>
        /// Parse geography into arrays of destinations
        /// </summary>
        /// <param name="geography"></param>
        /// <returns>Arrays of appropriate destinations</returns>
        public static (IEnumerable<string> countries, IEnumerable<string> regions, IEnumerable<string> resorts)
            ParseGeographyField(string geography)
        {
            var countries = Enumerable.Empty<string>();
            var regions = Enumerable.Empty<string>();
            var resorts = Enumerable.Empty<string>();

            var geographyParts = geography?.Split(',');

            if (geographyParts == null || !geographyParts.Any())
            {
                return (countries, regions, resorts);
            }

            switch (geographyParts.Count())
            {
                case 1:
                    countries = geographyParts[0].Split('|');
                    break;
                case 2:
                    countries = geographyParts[0].Split('|');
                    regions = geographyParts[1].Split('|');
                    break;
                case 3:
                    countries = geographyParts[0].Split('|');
                    regions = geographyParts[1].Split('|');
                    resorts = geographyParts[2].Split('|');
                    break;
            }

            return (countries, regions, resorts);
        }

        /// <summary>
        /// Parse destinations into arrays of destinations
        /// </summary>
        /// <param name="destinations"></param>
        /// <returns>Arrays of appropriate destinations</returns>
        public static (HashSet<string> countries, HashSet<string> regions, HashSet<string> resorts)
            ParseDestinationsField(string[] destinations)
        {
            var countries = new HashSet<string>();
            var regions = new HashSet<string>();
            var resorts = new HashSet<string>();

            if (destinations == null || !destinations.Any())
            {
                return (countries, regions, resorts);
            }

            foreach (var destination in destinations)
            {
                var destinationInfo = destination.Split(':');
                if (destinationInfo.Length == 2)
                {
                    string destinationType = destinationInfo[0];
                    string destinationCode = destinationInfo[1];
                    switch (destinationType)
                    {
                        case "country":
                        case "virtualcountry":
                            countries.Add(destinationCode);
                            break;
                        case "virtualregion":
                        case "region":
                            regions.Add(destinationCode);
                            break;
                        case "resort":
                            resorts.Add(destinationCode);
                            break;
                    }
                }
            }

            return (countries, regions, resorts);
        }

        /// <summary>
        /// Get all destinations from the geography
        /// </summary>
        /// <param name="geography"></param>
        /// <returns>Array of destinations</returns>
        public static IEnumerable<string> GetAllDestinationsCodes(string geography)
        {
            var (countries, regions, resorts) = ParseGeographyField(geography);
            return countries.Concat(regions.Concat(resorts));
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <param name="action"></param>
        /// <param name="destinationsInfo"></param>
        /// <typeparam name="T"></typeparam>
        /// <returns></returns>
        public static async Task<(T, bool)[]> SplitRequestByDestinations<T>(PackagesSearchRequest request,
            Func<PackagesSearchRequest, Task<(T, bool)>> action, IEnumerable<DestinationItem> destinationsInfo)
        {
            if (string.IsNullOrWhiteSpace(request.Geography))
            {
                request.Geography = BuildGeographyField(destinationsInfo.ToList());
            }

            var destinationItemsByType = ParseDestinationItemsByType(destinationsInfo);
            var countriesSpecified = destinationItemsByType.TryGetValue(DestinationItemType.Country, out var countriesInfo);
            var regionsSpecified = destinationItemsByType.TryGetValue(DestinationItemType.Region, out var regionsInfo);
            var resortsSpecified = destinationItemsByType.TryGetValue(DestinationItemType.Resort, out var resortsInfo);

            var tasks = new List<Task<(T, bool)>>();

            //if regions and resorts are specified  at the same time - we need to split the request (Atcom features)
            if (regionsSpecified && resortsSpecified)
            {
                // Build geography field for resorts request
                var resortsGeographyRequest = BuildGeographyField(resortsInfo.ToList());

                // Build geography field without resorts
                var otherDestinations = regionsInfo;

                if (countriesSpecified)
                {
                    //if countries specified then add them
                    otherDestinations.AddRange(countriesInfo);
                }

                //remove regions that already exist within resortsGeographyRequest
                otherDestinations = otherDestinations.Where(region =>
                    resortsInfo.All(resort => resort.Parents.All(parent => parent.Code != region.Code))).ToList();

                //if otherDestinations is empty or null, the BuildGeographyField method returns "ALL" geographic data, which is inappropriate for this case 
                var otherGeographyRequest = otherDestinations.Any() ? BuildGeographyField(otherDestinations) : null;

                if (!string.IsNullOrWhiteSpace(resortsGeographyRequest))
                {
                    var rq = request.DeepClone();
                    rq.Geography = resortsGeographyRequest;
                    tasks.Add(action(rq));
                }

                if (!string.IsNullOrWhiteSpace(otherGeographyRequest))
                {
                    var rq = request.DeepClone();
                    rq.Geography = otherGeographyRequest;
                    tasks.Add(action(rq));
                }

                var requestsResults = await Task.WhenAll(tasks);
                return requestsResults;
            }

            //otherwise, send one request
            return new[] { await action(request) };
        }

        /// <summary>
        /// Splits a list of destination items into sets of country, region, and resort codes based on their type.
        /// </summary>
        /// <param name="destinationItems">The list of destination items.</param>
        /// <returns>A tuple containing three HashSets: country codes, region codes, and resort codes.</returns>
        public static (HashSet<string> countryCodes, HashSet<string> regionCodes, HashSet<string> resortCodes) SplitGeographyByDestinations(IEnumerable<DestinationItem> destinationItems)
        {
            ArgumentNullException.ThrowIfNull(destinationItems);

            var countryCodes = new HashSet<string>();
            var regionCodes = new HashSet<string>();
            var resortCodes = new HashSet<string>();

            foreach (var destination in destinationItems)
            {
                switch (destination.Type)
                {
                    case DestinationItemType.Country:
                        countryCodes.Add(destination.Code);
                        break;
                    case DestinationItemType.Region:
                        regionCodes.Add(destination.Code);
                        break;
                    case DestinationItemType.Resort:
                        resortCodes.Add(destination.Code);
                        break;
                    case DestinationItemType.VirtualCountry:
                    case DestinationItemType.VirtualRegion:
                        foreach (var relatedRegion in destination.RelatedRegions)
                            regionCodes.Add(relatedRegion);
                        break;
                    case DestinationItemType.VirtualResort:
                        if (destination.RelatedResorts == null)
                        {
                            break;
                        }
                        foreach (var relatedResort in destination.RelatedResorts)
                            resortCodes.Add(relatedResort);
                        break;
                    case DestinationItemType.Hotel:
                        var (country, region, resort) = SplitGeographyByDestinations(destination.Parents);
                        countryCodes.UnionWith(country);
                        regionCodes.UnionWith(region);
                        resortCodes.UnionWith(resort);
                        break;
                }
            }

            return (countryCodes, regionCodes, resortCodes);
        }
    }
}
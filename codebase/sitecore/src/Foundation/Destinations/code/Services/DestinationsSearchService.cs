using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.Queries;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Extensions;
using easyJet.Foundation.Destinations.Helpers;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Multisite.Extensions;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Newtonsoft.Json;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Configuration;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Muzement = easyJet.Foundation.Destinations.Models.Domain.Muzement.Muzement;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IDestinationsSearchService), Lifetime = Lifetime.Transient)]
    public class DestinationsSearchService : BatchSearchService, IDestinationsSearchService
    {
        private const string ResortsByVirtualCountryPattern = "{0}-{1}";

        // EUXE-1140 allows user to search by non-latin character ex. 'Ä'
        private static readonly bool ShouldBeCultureSearch = Settings.GetBoolSetting("Destinations.ShouldBeCultureSearch", true);

        private readonly IDestinationsRepository repository;
        private readonly IHtmlCacheRepository cache;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IDestinationsLogger destinationsLogger;
        private readonly IFacilityMatrixService facilityMatrixService;
        private readonly int chunkSize;

        public DestinationsSearchService(
            BaseSettings settings,
            IDestinationsRepository repository,
            IHtmlCacheRepository cache,
            IDatabaseProvider databaseProvider,
            IFacilityMatrixService facilityMatrixService,
            IDestinationsLogger destinationsLogger)
        {
            this.repository = repository;
            this.cache = cache;
            this.databaseProvider = databaseProvider;
            this.destinationsLogger = destinationsLogger;
            this.facilityMatrixService = facilityMatrixService;
            chunkSize = settings.GetIntSetting("Destinations.ChunkSize", 50);
        }

        /// <inheritdoc/>
        public IEnumerable<BaseDestinationsSearchResultItem> GetDestinationsByCodes(string[] codes, bool includeRelatedItems = true)
        {
            var chunks = codes.Chunk(chunkSize).ToList();
            var destinationsSearchResults = BatchProcess(chunks, chunk => repository.SearchByCodes(chunk.ToList(), includeRelatedItems, false))
                .Select(x => x.Document)
                .ToArray();

            if (!destinationsSearchResults.Any())
            {
                destinationsLogger.Warn($"Can't get destinations items for {string.Join("|", codes)} codes", this);
            }

            return destinationsSearchResults;
        }

        /// <inheritdoc/>
        public DestinationInfo GetDestinationInfo(string code)
        {
            var searchResult = repository.SearchByCodes(new List<string> { code }).FirstOrDefault();

            if (searchResult == null)
            {
                destinationsLogger.Warn($"Can't get destination item for {code} ", this);
                return null;
            }

            var lang = searchResult.Document.Language;
            return cache.GetOrAdd($"Destinations.Cache.GetDestinationInfo.{code}.{lang}", () =>
            {
                var item = searchResult.Document.GetItem();

                var destinationInfo = new DestinationInfo()
                {
                    Code = item.Fields[Constants.Fields.DatasourceItem.Code].Value,
                    Name = item.Fields[Constants.Fields.DatasourceItem.Name].Value,
                    Description = item.GetFirstParagraphDescription(),
                    ImageUrl = item.GetMediumMediaUrl(Constants.Fields.SitecoreImageItem.Image),
                    Url = item.GetItemUrl(),
                };

                destinationsLogger.Debug($"Get item from search result document ID: '{item.ID}', path - {item.Paths.FullPath}, lang - {lang}, destinationInfo - {JsonConvert.SerializeObject(destinationInfo)} ", this);

                return destinationInfo;
            });
        }

        /// <inheritdoc />
        public IEnumerable<BaseHotelSearchResultItem> GetHotelsByGiataCodes(string[] giataCodes)
        {
            var chunks = giataCodes.Chunk(chunkSize).ToList();
            var hotelSearchResults = BatchProcess(chunks, chunk => repository.GetHotelsByGiataCodes(chunk.ToList()))
                .Select(x => x.Document)
                .ToArray();

            if (!hotelSearchResults.Any())
            {
                destinationsLogger.Warn($"Can't get hotel items for {string.Join("|", giataCodes)} GIATA codes", this);
                return Enumerable.Empty<BaseHotelSearchResultItem>();
            }

            return hotelSearchResults;
        }

        /// <inheritdoc/>
        public IEnumerable<BaseDestinationsSearchResultItem> GetDestinationsByNames(string[] names, DestinationFilter filter)
        {
            var destinationsSearchResults =
                BatchProcess(names.Chunk(chunkSize), chunk => repository.SearchByNames(chunk.ToList(), filter))
                    .Select(x => x.Document)
                    .ToArray();

            if (!destinationsSearchResults.Any())
            {
                destinationsLogger.Warn($"Can't get destinations items for {string.Join("|", names)} names", this);
            }

            return destinationsSearchResults;
        }

        /// <inheritdoc/>
        public IEnumerable<ChildDestination> GetPromoPageDestinations(ID promoPageItemId)
        {
            var promoDestinationsResult = cache.GetOrAdd(
                $"Destinations.Cache.GetDestinationsByPageId-{promoPageItemId}",
                () =>
                {
                    var promoPageItem = databaseProvider.GetItem(promoPageItemId);

                    if (promoPageItem == null)
                    {
                        destinationsLogger.Error(
                            $"Can't get item with ID: {promoPageItemId} from {Context.Database} database", this);
                        return null; // null - do not save to cache
                    }

                    MultilistField destinationsMultiListField =
                        promoPageItem.Fields?[Constants.Fields.PromoPage.Destination];

                    var destinationsItems = destinationsMultiListField?.GetItems();

                    if (destinationsItems == null || !destinationsItems.Any())
                    {
                        destinationsLogger.Warn($"Promo page with ID: {promoPageItemId} doesn't contain any destinations", this);
                        return null; // null - do not save to cache
                    }

                    var promoDestinationsCodes = destinationsItems
                        .Where(item => item != null)
                        .Select(GetDestinationCode)
                        .ToArray();

                    var promoDestinations = GetDestinationsByCodes(promoDestinationsCodes);

                    var codes = SourcesSearchResultMapper.MapDataSourceSearchResultByAtcomCode(promoDestinations, DestinationsMapper.MapFromBaseDestinationSearchResultItem).ToList();

                    // save and return result instead of enumeration
                    return codes;
                });

            return promoDestinationsResult;
        }

        /// <inheritdoc/>
        public DestinationsByAirportCodesResponse GetDestinationsByAirportCodes(DestinationByCodeQueryArgs args)
        {
            var results = BatchProcess(ChunkDestinationByCodeQueryArgs(args), argsChunk => repository.GetDestinationsByAirportCodes(argsChunk));

            if (!results.Any())
            {
                // If no results found, try to spell check the search query
                var suggestedQuery = repository.SpellCheck(args.Query, 1).FirstOrDefault();
                if (!string.IsNullOrEmpty(suggestedQuery))
                {
                    args.Query = suggestedQuery;
                    results = BatchProcess(ChunkDestinationByCodeQueryArgs(args), argsChunk => repository.GetDestinationsByAirportCodes(argsChunk));
                }
            }

            var query = results
               .GroupBy(hit => hit.Document.ItemId)
               .Select(group => group.First())
               .OrderBy(hit => hit.Document.SortOrder)
               .ThenByDescending(hit => hit.Score)
               .ToArray();

            var searchResults = GetPage(query, args.Take, args.Page).Select(x => x.Document);

            // INS-1199: Virtual countries need to be searched on resort level (e.g. Scotland -> Glasgow)
            var virtualCountriesAirportCodes = searchResults
                .Where(x => x.TemplateId == Constants.TemplateIds.VirtualCountry)
                .SelectMany(x => x.AirportCodes)
                .ToHashSet();

            args.Codes = args.Codes.Where(virtualCountriesAirportCodes.Contains).ToArray();
            args.Filter = DestinationFilter.Resort;
            if (args.Codes.Length > 0)
            {
                var virtualResults = BatchProcess(ChunkDestinationByCodeQueryArgs(args), argsChunk => repository.GetDestinationsByAirportCodes(argsChunk)).ToArray();
                if (virtualResults.Length > 0)
                {
                    var virtualSearchResults = virtualResults
                       .GroupBy(hit => hit.Document.ItemId)
                       .Select(group => group.First())
                       .OrderBy(hit => hit.Document.SortOrder)
                       .ThenByDescending(hit => hit.Score)
                       .Select(x => x.Document);

                    searchResults = searchResults.Concat(virtualSearchResults);
                }
            }

            var response = new DestinationsByAirportCodesResponse
            {
                Take = args.Take,
                Page = args.Page,
                Total = query.Length,
                Destinations = SourcesSearchResultMapper.MapDataSourceSearchResultByAtcomCode(searchResults, DestinationsMapper.MapFromDestinationSearchResultItem).ToList()
            };

            return response;
        }

        /// <inheritdoc/>
        public DestinationsSearchResponse GetAllCountries(bool showOnSearchPod = false, bool shouldGetItemsForDropdownOnly = true)
        {
            string cacheKey = $"Destinations.Cache.GetAllCountries-{showOnSearchPod}-{shouldGetItemsForDropdownOnly}";

            var data = cache.GetItem<DestinationsSearchResponse>(cacheKey);

            if (data != null)
            {
                return data;
            }

            // Search for Destination items
            var countries = repository.GetAllCountries(showOnSearchPod, shouldGetItemsForDropdownOnly).Select(x => new ChildDestination(x.Document)).ToArray();
            countries = FilterRelatedItems(countries, showOnSearchPod, shouldGetItemsForDropdownOnly);
            // Select only virtual countries.
            var virtualCountries = countries.Where(x => x.Type == Constants.TemplateNames.VirtualCountry);
            // Select all virtual countries resorts codes. For Virtual Country and Virtual Region, Children field contains resorts.
            var resortsCodes = virtualCountries.Where(x => x.Children != null).SelectMany(x => x.Children.Select(resort => resort.Code));
            // Search all resorts for virtual countries.
            var resorts = repository.SearchByCodes(resortsCodes.ToList(), true)
                .Where(x => x.Document.TemplateName == Constants.TemplateNames.Resort)
                .Select(x => new ChildDestination(x.Document));

            // Grouping resorts by theirs country codes.
            var resortsByVirtualCountries = resorts
                .GroupBy(group => string.Format(ResortsByVirtualCountryPattern, group.Parents?.FirstOrDefault(parent => parent.Type == Constants.TemplateNames.Country)?.Code, group.Parents?.FirstOrDefault(parent => parent.Type == Constants.TemplateNames.Region)?.Code))
                .ToDictionary(x => x.Key, value => value.ToList());

            countries = SetVirtualCountryChildren(countries, resortsByVirtualCountries);

            var response = new DestinationsSearchResponse(countries);

            if (countries.Any())
            {
                cache.StoreItem(cacheKey, response);
            }

            return response;
        }

        /// <inheritdoc/>
        public string GetImage(string code)
        {
            var data = cache.GetOrAdd($"Destinations.Cache.GetImage-{code}", () => repository.SearchByCodes(new List<string> { code }).FirstOrDefault());

            return data?.Document?.ImageUrl;
        }

        /// <inheritdoc/>
        public ImageData GetHotelImage(string code)
        {
            return cache.GetOrAdd($"Destinations.Cache.GetImage-{code}", () =>
            {
                 var data = repository.SearchHotelsByCodes(new[] { code }).FirstOrDefault();
                 var images = JsonDeserializerHelper.TryDeserializeObject<IEnumerable<ImageData>>(data?.Document?.Images, nameof(data.Document.Images), typeof(DestinationsSearchService));
                 return images?.FirstOrDefault();
            });
        }

        /// <inheritdoc/>
        public IEnumerable<HotelCoordinates> GetHotelsCoordinatesByParentCode(string code)
        {
            return cache.GetOrAdd($"Destinations.Cache.GetHotelsCoordinatesByParentCode-{code}", () =>
            {
                var hotelsParentItem = repository.GetDestinationItemByCode(code);
                if (hotelsParentItem == null)
                {
                    return Enumerable.Empty<HotelCoordinates>();
                }

                SearchResults<HotelSearchResultItem> hotelsCoordinates = null;
                if (hotelsParentItem.TemplateId.Equals(Constants.TemplateIds.VirtualRegion))
                {
                    MultilistField regionField = databaseProvider.GetItem(hotelsParentItem.Uri)?.Fields[Constants.Fields.VirtualDestination.Regions];
                    if (regionField == null || regionField.TargetIDs.Length == 0)
                    {
                        return Enumerable.Empty<HotelCoordinates>();
                    }

                    hotelsCoordinates = repository.GetHotelsCoordinatesByHotelsParentsPath(regionField.TargetIDs);
                }
                else if (hotelsParentItem.TemplateId.Equals(Constants.TemplateIds.VirtualResort))
                {
                    MultilistField resortsField = databaseProvider.GetItem(hotelsParentItem.Uri)?.Fields[Constants.Fields.VirtualDestination.Resorts];
                    if (resortsField == null || resortsField.TargetIDs.Length == 0)
                    {
                        return Enumerable.Empty<HotelCoordinates>();
                    }

                    hotelsCoordinates = repository.GetHotelsCoordinatesByHotelsParentsPath(resortsField.TargetIDs);
                }
                else
                {
                    hotelsCoordinates = repository.GetHotelsCoordinatesByHotelsParentsPath(new[] { hotelsParentItem.ItemId });
                }

                var searchResults = hotelsCoordinates.Hits.Select(x => x.Document);
                var data = SourcesSearchResultMapper.MapDataSourceSearchResultByAtcomCode(searchResults, (atcomCode, document) => new HotelCoordinates(document) { Code = atcomCode }).ToList();
                return data;
            });
        }

        public IEnumerable<ResortResponse> GetResortsByCodes(string[] codes, bool includeHotelCoordinates = false)
        {
            var searchResults = repository.SearchHotelsByResortCodes(codes).Select(x => x.Document).ToList();
            if (!searchResults.Any())
            {
                destinationsLogger.Warn($"Can't get resort items for {string.Join("|", codes)} codes", this);
            }

            var hotels = SourcesSearchResultMapper.MapDataSourceSearchResultByAtcomCode(searchResults, AccommodationMapper.MapFromSearchResultItem).ToList();
            return ResortMapper.MapFromHotels(hotels, includeHotelCoordinates);
        }

        public IEnumerable<ResortResponse> GetResorts(bool includeHotelCoordinates = false)
        {
            var searchResults = repository.SearchHotelsByResortCodes(Array.Empty<string>()).Select(x => x.Document).ToList();
            var hotels = SourcesSearchResultMapper.MapDataSourceSearchResultByAtcomCode(searchResults, AccommodationMapper.MapFromSearchResultItem).ToList();
            return ResortMapper.MapFromHotels(hotels, includeHotelCoordinates);
        }

        /// <inheritdoc/>
        public IEnumerable<HotelCoordinates> GetHotelsByEntryInPolygonBorders(Point topLeftAngle, Point bottomRightAngle)
        {
            return cache.GetOrAdd($"Destinations.Cache.GetHotelsByEntryInPolygonBorders-{topLeftAngle.Latitude}-{topLeftAngle.Longitude}-{bottomRightAngle.Latitude}-{bottomRightAngle.Longitude}", () =>
            {
                var hotels = repository.GetHotelsInsideCoordinateGrid(topLeftAngle, bottomRightAngle);

                var searchResults = hotels.Hits.Select(x => x.Document);
                return SourcesSearchResultMapper.MapDataSourceSearchResultByAtcomCode(searchResults, (atcomCode, document) => new HotelCoordinates(document) { Code = atcomCode });
            });
        }

        /// <inheritdoc/>
        public AccommodationResortInfo GetHotelResortInfoByHotelCode(string code)
        {
            return cache.GetOrAdd($"Destinations.Cache.GetHotelResortInfoByHotelCode-{code}", () => new AccommodationResortInfo(repository.GetAccommodationResortInfoByAccommodationCode(code)));
        }

        /// <inheritdoc/>
        public IEnumerable<HotelHighlights> GetHotelHighlightsByHotelCode(string code)
        {
            return cache.GetOrAdd($"Destinations.Cache.HotelHighlights-{code}", () =>
            {
                var hotelHighlights = repository.GetHotelHighlightsByAccommodationCode(code);
                if (hotelHighlights?.HotelHighlights == null)
                {
                    return Enumerable.Empty<HotelHighlights>();
                }

                return JsonConvert.DeserializeObject<IEnumerable<HotelHighlights>>(hotelHighlights.HotelHighlights);
            });
        }

        /// <inheritdoc/>
        public IEnumerable<PromoFacility> GetPromoFacilities(string code)
        {
            return cache.GetOrAdd(
                $"Destinations.Cache.GetPromoFacilities-{code}",
                () => repository.GetPromoFacilities(code)?.PromoFacilities?.Select(JsonConvert.DeserializeObject<PromoFacility>));
        }

        /// <inheritdoc/>
        public Muzement GetMuzement(string code)
        {
            var destinationItem = databaseProvider.GetItem(repository.GetDestinationItemByCode(code)?.Uri);

            if (destinationItem == null)
            {
                destinationsLogger.Warn($"Can't get destination item for {code} code", this);
                return null;
            }

            var muzementSettings = destinationItem.Database.SelectSingleItem($"{destinationItem.GetSettingsFolderQuery()}/*[@@templateid='{Constants.TemplateIds.MuzementSettings}']");
            var radius = default(float);
            var muzementHotelCoordinates = Enumerable.Empty<HotelCoordinates>();

            if (destinationItem.TemplateID == Constants.TemplateIds.Resort)
            {
                var muzementId = destinationItem[Constants.Fields.Region.MuzementId];
                if (!string.IsNullOrEmpty(muzementId))
                {
                    return new Muzement(new[] { muzementId }, radius, DestinationsMapper.MapRegionTemplateName(destinationItem.Template.Name), muzementHotelCoordinates);
                }

                // if resort item doesn't have muzement Id, set context item as Region
                destinationItem = destinationItem.Parent;
            }

            string[] muzementIds = null;

            // If the found item is a region, when the muzement IDs from the muzement ids field will be used, if the muzement ids filed value is not empty, else will be used hotels coordinates for region.
            if (destinationItem.TemplateID == Constants.TemplateIds.RegionPage || destinationItem.TemplateID == Constants.TemplateIds.RegionCityPage)
            {
                radius = MainUtil.GetFloat(muzementSettings[Constants.Fields.MuzementSettings.RegionRadius], 0);
                if (string.IsNullOrWhiteSpace(destinationItem[Constants.Fields.Region.MuzementId]))
                {
                    muzementHotelCoordinates = repository
                        .GetHotelsCoordinatesByHotelsParentsPath(new[] { destinationItem.ID })
                        .Select(x => new HotelCoordinates(x.Document));
                }
                else
                {
                    muzementIds = destinationItem[Constants.Fields.Region.MuzementId].Split(',').Where(x => !string.IsNullOrWhiteSpace(x)).ToArray();
                }
            }

            // If the found item is country then will use country code for muzement id.
            else if (destinationItem.TemplateID == Constants.TemplateIds.Country)
            {
                radius = MainUtil.GetFloat(muzementSettings[Constants.Fields.MuzementSettings.CountryRadius], 0);
                muzementIds = new[] { destinationItem[Constants.Fields.DatasourceItem.Code] };
            }

            return new Muzement(muzementIds, radius, DestinationsMapper.MapRegionTemplateName(destinationItem.Template.Name), muzementHotelCoordinates);
        }

        /// <inheritdoc/>
        public string[] GetHotelsCodes(string[] codes)
        {
            var chunks = codes.Chunk(chunkSize).ToList();
            var data = BatchProcess(chunks, chunk => repository.GetAllExistHotelsCodes(chunk))
                .Select(x => x.Document).ToList();

            return SourcesSearchResultMapper.MapSourcesSearchResultByAtcomCodes(codes, data, (code, document) => code).ToArray();
        }

        /// <inheritdoc/>
        public IEnumerable<Hotel> GetHotelsByAtcomCodes(string[] codes)
        {
            var data = repository.SearchHotelsByCodes(codes);
            if (data == null)
            {
                destinationsLogger.Warn($"No hotels found for {string.Join("|", codes)} atcom codes", this);
                return Enumerable.Empty<Hotel>();
            }

            destinationsLogger.Debug($"Found {data.Hits.Count()} hotels for '{string.Join("|", codes)}' atcom codes", this);
            var hotels = SourcesSearchResultMapper.MapSourcesSearchResultByAtcomCodes(codes, data.Hits.Select(x => x.Document), AccommodationMapper.MapFromSearchResultItem).ToList();
            facilityMatrixService.EnrichHotelFacilityMatrix(hotels);

            // additional logging for WP-86
            var hotelsWithMissingData = hotels.Where(h => string.IsNullOrWhiteSpace(h.Name) || string.IsNullOrWhiteSpace(h.Description) || h.Images == null).ToList();
            if (hotelsWithMissingData.Any())
            {
                destinationsLogger.Warn($"Found {hotelsWithMissingData.Count} hotels with missing data - codes:{string.Join("|", hotelsWithMissingData.Select(h => h.Code))}", this);
            }

            return hotels;
        }

        public HotelByGiataResponse GetExpediaHotelByGiataCode(string giataCode)
        {
            if (string.IsNullOrWhiteSpace(giataCode))
            {
                throw new ArgumentException($"Argument {nameof(giataCode)} cannot be null or empty");
            }

            var data = repository.SearchHotelsByCodes(new[] { giataCode });
            if (data == null || !data.Hits.Any())
            {
                destinationsLogger.Warn($"No hotel found for giata code '{giataCode}'", this);
                return null;
            }

            var document = data.Hits.Select(x => x.Document).FirstOrDefault();
            if (document == null)
            {
                destinationsLogger.Warn($"No hotel document found for giata code '{giataCode}'", this);
                return null;
            }

            destinationsLogger.Debug($"Found hotel for giata code '{giataCode}'", this);

            var sourceCode = document.SourceCodes?.FirstOrDefault();
            var hotel = AccommodationMapper.MapFromSearchResultItem(sourceCode, document);

            if (hotel == null)
            {
                destinationsLogger.Warn($"Hotel mapping returned null for giata code '{giataCode}'", this);
                return null;
            }

            var hotelItem = TryGetHotelItem(document, giataCode);

            if (hotelItem == null)
            {
                destinationsLogger.Warn($"Hotel Sitecore item could not be resolved for giata code '{giataCode}'. Expedia hotel response skipped.", this);
                return null;
            }

            hotel.Facilities = GetHotelFacilities(hotelItem);

            var hotelType = HotelTypeHelper.ResolveHotelType(document);

            var response = new HotelByGiataResponse(hotel)
            {
                SitecoreId = document.ItemId.ToString(),
                HotelType = hotelType.ToString(),
                RoomTypes = HotelTypeHelper.ResolveExpediaRoomTypes(hotelItem)
            };

            return response;
        }

        /// <inheritdoc/>
        public IEnumerable<ChildDestination> SearchByName(string searchQuery, bool showOnSearchPod, bool shouldGetItemsForAutocompleteOnly, DestinationFilter destinationFilter, bool includeSearchByAirportCode)
        {
            // Search for Destination items
            var data = repository.SearchByName(searchQuery, showOnSearchPod, shouldGetItemsForAutocompleteOnly, destinationFilter, includeSearchByAirportCode);

            if (data == null || data.TotalSearchResults == 0)
            {
                // If no results found, try to spell check the search query
                var suggestedQuery = repository.SpellCheck(searchQuery, 1).FirstOrDefault();
                if (!string.IsNullOrEmpty(suggestedQuery))
                {
                    data = repository.SearchByName(suggestedQuery, showOnSearchPod, shouldGetItemsForAutocompleteOnly, destinationFilter, includeSearchByAirportCode);
                }

                if (data == null || data.TotalSearchResults == 0)
                {
                    return Enumerable.Empty<ChildDestination>();
                }
            }

            return SourcesSearchResultMapper.MapDataSourceSearchResultByAtcomCode(data.Hits.Select(x => x.Document), DestinationsMapper.MapFromBaseDestinationSearchResultItem);
        }

        /// <summary>
        /// Get Destinations Code for Countries/Regions/Resorts and GiataCode for Hotels(Accommodations)
        /// </summary>
        /// <param name="item">Items to get code from.</param>
        /// <returns>Destination item code.</returns>
        private static string GetDestinationCode(Item item) =>
            item.TemplateID == Constants.TemplateIds.Accommodation ? item.Fields[Constants.Fields.AccommodationItem.GiataCode].Value : item.Fields?[Constants.Fields.DatasourceItem.Code]?.Value;

        private static IEnumerable<AccommodationFacilityVirtualGroup> GetHotelFacilities(Item hotelItem)
        {
            var facilitiesFolder = hotelItem.Children
                .FirstOrDefault(x => x.TemplateID == Constants.TemplateIds.AccommodationFacilitiesFolder);

            if (facilitiesFolder == null)
            {
                return Enumerable.Empty<AccommodationFacilityVirtualGroup>();
            }

            var facilities = facilitiesFolder.Children
                .Where(x => x.TemplateID == Constants.TemplateIds.AccommodationFacility)
                .Select(AccommodationMapper.MapExpediaHotelFacilityFromItem)
                .Where(x => x != null)
                .ToList();

            return new[]
            {
                new AccommodationFacilityVirtualGroup
                {
                    Items = facilities
                }
            };
        }

        /// <summary>
        /// Set Virtual Country children.
        /// </summary>
        /// <param name="countries">Virtual countries.</param>
        /// <param name="resortsByVirtualCountry">Resorts by virtual country.</param>
        private ChildDestination[] SetVirtualCountryChildren(ChildDestination[] countries, Dictionary<string, List<ChildDestination>> resortsByVirtualCountry)
        {
            for (int i = 0; i < countries.Length; i++)
            {
                var country = countries[i];
                if (country.Type == Constants.TemplateNames.VirtualCountry)
                {
                    var countryCode = country.Parents?.FirstOrDefault()?.Code;

                    if (!string.IsNullOrWhiteSpace(countryCode))
                    {
                        var virtualCountryResorts = new List<ChildDestination>();
                        // Try get resorts by their country code.
                        foreach (var relatedRegionCode in country.RelatedRegions)
                        {
                            if (resortsByVirtualCountry.TryGetValue(string.Format(ResortsByVirtualCountryPattern, countryCode, relatedRegionCode), out var resorts))
                            {
                                // Add resorts by region to children list.
                                virtualCountryResorts.AddRange(resorts);
                            }
                        }

                        // Set resorts to country.
                        country.Children = virtualCountryResorts;
                    }
                }
            }

            return countries;
        }

        private Item TryGetHotelItem(HotelSearchResultItem document, string giataCode)
        {
            try
            {
                return document.GetItem();
            }
            catch (Exception ex)
            {
                destinationsLogger.Warn(
                    $"Unable to resolve Sitecore item for hotel with giata code '{giataCode}'. Expedia hotel response cannot be populated.",
                    ex,
                    this);

                return null;
            }
        }

        private ChildDestination[] FilterRelatedItems(ChildDestination[] countries, bool showOnSearchPod, bool shouldGetItemsForDropdownOnly)
        {
            for (int i = 0; i < countries.Length; i++)
            {
                var country = countries[i];

                country.Children = showOnSearchPod ? country.Children?.Where(x => x.ShowOnSearchPod) : country.Children;
                country.Children = shouldGetItemsForDropdownOnly ? country.Children?.Where(x => x.ShowOnDropdown) : country.Children;
            }

            return countries;
        }

        private IEnumerable<DestinationByCodeQueryArgs> ChunkDestinationByCodeQueryArgs(DestinationByCodeQueryArgs args)
        {
            // EUXE-1140 allows user to search by non-latin character ex. 'Ä'
            var queryArgs = ShouldBeCultureSearch ? args.Query : Transliteration.ToLatin(args.Query)?.ToLower();
            var chunkCount = (args.Codes.Length + chunkSize - 1) / chunkSize;
            var takePerChunk = (int)Math.Round((float)args.Take / chunkCount, 0);
            var takeLeft = args.Take;

            for (var i = 0; i < args.Codes.Length; i += chunkSize)
            {
                var chunk = new DestinationByCodeQueryArgs
                {
                    Query = queryArgs,
                    Filter = args.Filter,
                    Codes = args.Codes.Skip(i).Take(chunkSize).ToArray(),
                    ShouldGetItemsForAutocompleteOnly = args.ShouldGetItemsForAutocompleteOnly,
                    ShouldGetItemsForDropdownOnly = args.ShouldGetItemsForDropdownOnly,
                    IncludeSearchByAirportCode = args.IncludeSearchByAirportCode,
                    ShouldBeCultureSearch = ShouldBeCultureSearch,
                    Take = Math.Min(takePerChunk, takeLeft),
                };

                takeLeft -= takePerChunk;

                yield return chunk;
            }
        }
    }
}

using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IReferenceDataService), Lifetime = Lifetime.Transient)]
    public class ReferenceDataService : IReferenceDataService
    {
        private const int NoExpiration = 0;
        private readonly IHtmlCacheRepository cache;
        private readonly IUserCountryRepository userCountryRepository;
        private readonly IDialingCodeRepository dialingCodeRepository;
        private readonly IBoardTypesRepository boardTypesRepository;
        private readonly IRoomTypesRepository roomTypesRepository;
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IFilterPillsRepository filterPillsRepository;

        public ReferenceDataService(
            IUserCountryRepository userCountryRepository,
            IDialingCodeRepository dialingCodeRepository,
            IBoardTypesRepository boardTypesRepository,
            IRoomTypesRepository roomTypesRepository,
            IDestinationsRepository destinationsRepository,
            IFilterPillsRepository filterPillsRepository,
            IHtmlCacheRepository cache)
        {
            this.userCountryRepository = userCountryRepository;
            this.dialingCodeRepository = dialingCodeRepository;
            this.boardTypesRepository = boardTypesRepository;
            this.roomTypesRepository = roomTypesRepository;
            this.destinationsRepository = destinationsRepository;
            this.filterPillsRepository = filterPillsRepository;
            this.cache = cache;
        }

        /// <inheritdoc/>
        public IEnumerable<UserCountry> GetAllCountries()
        {
            return cache.GetOrAdd($"ReferenceData.Cache.AllCountries-{Sitecore.Context.Language.Name}", () =>
            {
                var data = userCountryRepository.GetAllUserCountryItems();

                if (data != null)
                {
                    return data.Select(x => new UserCountry
                    {
                        Name = x[Constants.Fields.UserCountry.CountryName],
                        Code = x[Constants.Fields.UserCountry.CountryCode],
                        Iso2 = x[Constants.Fields.UserCountry.Iso2],
                        TrackingId = ItemUtils.GetTrackingId(x)
                    });
                }

                return Enumerable.Empty<UserCountry>();
            });
        }

        /// <inheritdoc/>
        public IEnumerable<DialingCode> GetAllDialingCodes()
        {
            return cache.GetOrAdd($"ReferenceData.Cache.AllDialingCodes-{Sitecore.Context.Language.Name}", () =>
            {
                var data = dialingCodeRepository.GetAllDialingCodeItems();

                if (data != null)
                {
                    return data.Select(x => new DialingCode
                    {
                        Name = x[Constants.Fields.DialingCode.AreaName],
                        Code = float.TryParse(x[Constants.Fields.DialingCode.AreaCode], out float areaCode) ? areaCode : -1
                    });
                }

                return Enumerable.Empty<DialingCode>();
            });
        }

        /// <inheritdoc/>
        public IEnumerable<BoardType> GetAllBoardTypes()
        {
            return cache.GetOrAdd($"ReferenceData.Cache.AllBoardTypes-{Sitecore.Context.Language.Name}", () =>
            {
                {
                    var data = boardTypesRepository.GetAllBoardTypeItems();
                    if (data != null)
                    {
                        return data.Select(item => new BoardType()
                        {
                            Code = item[Constants.Fields.DatasourceItem.Code],
                            Name = item[Constants.Fields.DatasourceItem.Name],
                            ItemName = item.Name,
                            TrackingId = ItemUtils.GetTrackingId(item),
                            Content = item[Constants.Fields.DatasourceItem.Content],
                            Description = item[Constants.Fields.DatasourceItem.Description],
                            IconUrl = item.GetMediaUrl(Constants.Fields.SitecoreIconItem.Icon),
                            BoardGroup = GetBoardGroup(item)
                        });
                    }

                    return Enumerable.Empty<BoardType>();
                }
            });
        }

        /// <inheritdoc/>
        public IEnumerable<RoomType> GetAllRoomTypes()
        {
            return cache.GetOrAdd($"ReferenceData.Cache.AllRoomTypes-{Sitecore.Context.Language.Name}", () =>
            {
                var data = roomTypesRepository.GetAll();
                return data.Hits.Select(x => x.Document).Select(x => new RoomType
                {
                    Code = x.Code,
                    Name = x.Title,
                    ItemName = x.Name,
                    TrackingId = x.Name,
                    Content = x.RichTextContent,
                    Description = x.Description,
                });
            });
        }

        /// <inheritdoc/>
        public RoomTypesPaged GetRoomTypes(int page, int take)
        {
            return cache.GetOrAdd(
                $"ReferenceData.Cache.RoomTypes-{Sitecore.Context.Language.Name}-{page}-{take}",
                () =>
                {
                    var data = roomTypesRepository.Get(page, take);
                    var result = data.Hits.Select(x => x.Document).Select(x => new RoomType
                    {
                        Code = x.Code,
                        Name = x.Title,
                        ItemName = x.Name,
                        TrackingId = x.Name,
                        Content = x.RichTextContent,
                        Description = x.Description
                    });
                    return new RoomTypesPaged { TotalSearchResults = data.TotalSearchResults, Rooms = result };
                },
                NoExpiration);
        }

        public IEnumerable<string> GetHotelCodes()
        {
            return cache.GetOrAdd(
                $"ReferenceData.Cache.HotelCodes-{Sitecore.Context.Language.Name}",
                () =>
                {
                    var data = destinationsRepository.GetAllExistHotelsCodes();
                    return data.Hits.Where(x => x.Document.SourceCodes != null)
                        .SelectMany(x => x.Document.SourceCodes)
                        .Where(x => !string.IsNullOrEmpty(x))
                        .ToHashSet();
                });
        }

        public async Task<IDictionary<string, string>> GetAccommodationToGiataMapping(List<string> accommodationCodes)
        {
            // splitting and trying to search in batches, because later we use predicates
            // and they are either failing with StackOverflowException (count=1000)
            // or taking really much time to execute (count=500)
            var batches = accommodationCodes.SplitList(100);
            var dict = new ConcurrentDictionary<string, string>();
            var contextLanguage = Sitecore.Context.Language;
            using (var semaphore = new SemaphoreSlim(10))
            {
                var tasks = batches
                    .Select(batch => ProcessBatch(batch, dict, contextLanguage, semaphore))
                    .ToList();

                await Task.WhenAll(tasks).ConfigureAwait(false);
                return dict;
            }
        }

        /// <inheritdoc/>
        public FilterPillsConfig GetFilterPillsConfig()
        {
            return cache.GetOrAdd($"ReferenceData.Cache.FilterPillsConfig-{Sitecore.Context.Language.Name}", () =>
            {
                var recommendedFilterConfig = GetRecommendedFilterConfig();

                var filterPillOptions = GetFilterPillOptions();

                return new FilterPillsConfig()
                {
                    Options = filterPillOptions,
                    RecommendedFilterConfig = recommendedFilterConfig
                };
            });
        }

        private List<FilterPillOption> GetFilterPillOptions()
        {
            var filterPillsItem = filterPillsRepository.GetFilterPillsItem();

            if (filterPillsItem == null)
            {
                return new List<FilterPillOption>();
            }

            var options = GetFilterPillOptions(filterPillsItem);

            return options;
        }

        private List<FilterPillOption> GetFilterPillOptions(Item folderItem)
        {
            var options = new List<FilterPillOption>();
            if (folderItem.HasChildren)
            {
                foreach (Item child in folderItem.Children.CheckVersion(folderItem))
                {
                    var type = child[Constants.Fields.RecommendedFilterOption.Type];
                    var code = child[Constants.Fields.RecommendedFilterOption.Code];

                    code = !string.IsNullOrEmpty(type) && !string.IsNullOrEmpty(code)
                        ? $"{type}|{code}"
                        : code;

                    options.Add(new FilterPillOption
                    {
                        FilterCode = child[Constants.Fields.RecommendedFilterOption.FilterCode],
                        Code = code,
                        Name = child[Constants.Fields.RecommendedFilterOption.Name]
                    });
                }
            }

            return options;
        }

        private RecommendedFilterConfig GetRecommendedFilterConfig()
        {
            var recommendedFiltersItem = filterPillsRepository.GetRecommendedFiltersItem();

            if (recommendedFiltersItem == null)
            {
                return new RecommendedFilterConfig();
            }

            var minNumberOfOffers = recommendedFiltersItem.GetInteger(Constants.Fields.RecommendedFilters.MinNumberOfOffers) ?? 0;

            var options = GetFilterPillOptions(recommendedFiltersItem);

            return new RecommendedFilterConfig
            {
                MinNumberOfOffers = minNumberOfOffers,
                Options = options
            };
        }

        private void AddBatchResultsToDictionary(List<string> batch, ConcurrentDictionary<string, string> dict)
        {
            var results = destinationsRepository.GetGiataToAccommodationCodesMapping(batch)
                .Where(x => x.Document.Code != null);

            foreach (var result in results)
            {
                if (result.Document.SourceCodes == null)
                {
                    continue;
                }

                foreach (var accomCode in result.Document.SourceCodes)
                {
                    dict.TryAdd(accomCode, result.Document.Code);
                }
            }
        }

        private async Task ProcessBatch(List<string> batch, ConcurrentDictionary<string, string> dict, Language contextLanguage, SemaphoreSlim semaphore)
        {
            await semaphore.WaitAsync().ConfigureAwait(false);
            try
            {
                if (contextLanguage != null)
                {
                    using (new LanguageSwitcher(contextLanguage))
                    {
                        AddBatchResultsToDictionary(batch, dict);
                    }
                }
                else
                {
                    AddBatchResultsToDictionary(batch, dict);
                }
            }
            finally
            {
                semaphore.Release();
            }
        }

        /// <summary>
        /// Get boardItem's Board Group data.
        /// </summary>
        /// <param name="boardItem">Board item.</param>
        /// <returns>DatasourceObject instance.</returns>
        private DatasourceObject GetBoardGroup(Item boardItem)
        {
            var boardGroupItem = ((ReferenceField)boardItem.Fields[Constants.Fields.BoardTypeItem.BoardGroup])?.TargetItem;

            if (boardGroupItem != null)
            {
                return new DatasourceObject(boardGroupItem)
                {
                    Type = boardGroupItem.TemplateName
                };
            }

            return null;
        }
    }
}

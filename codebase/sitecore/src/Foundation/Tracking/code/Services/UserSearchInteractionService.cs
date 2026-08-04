using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.PushNotifications.Facets;
using easyJet.Foundation.SitecoreExtensions.Utils;
using easyJet.Foundation.Tracking.Extenstions;
using easyJet.Foundation.Tracking.Logging;
using easyJet.Foundation.Tracking.Models.Requests;
using Newtonsoft.Json;
using Sitecore.Analytics;
using Sitecore.Configuration;
using Sitecore.XConnect;

namespace easyJet.Foundation.Tracking.Services
{
    [Service(typeof(IUserSearchInteractionService), Lifetime = Lifetime.Singleton)]
    public class UserSearchInteractionService : AnalyticsServiceBase, IUserSearchInteractionService
    {
        private readonly int batchSize = Settings.GetIntSetting("Tracking.BatchSize", 20);
        private readonly IDestinationsRepository destinationRepository;
        private readonly IAirportRepository airportRepository;

        public UserSearchInteractionService(IContactService contactService, IDestinationsRepository destinationRepository, IAirportRepository airportRepository, ITrackingLogger logger)
            : base(contactService, logger)
        {
            this.destinationRepository = destinationRepository;
            this.airportRepository = airportRepository;
        }

        /// <inheritdoc/>
        public void Add(UserSearchRequest request)
        {
            var airports = SearchTrackingItemsByCodes(request.From, (codes) => airportRepository.SearchByAirportCode(codes.ToList()));
            if (airports == null || !airports.Any())
            {
                string msg = $"Cannot find any airports for {string.Join(",", airports ?? new List<TrackingItem>())}";
                Logger.Warn(msg, this);
                throw new ArgumentException(nameof(airports), msg);
            }

            var destinations = SearchTrackingItemsByCodes(request.To, (codes) => destinationRepository.SearchByCodes(codes.ToList()));
            if (destinations == null || !destinations.Any())
            {
                string msg = $"Cannot find any destinations for {string.Join(",", destinations ?? new List<TrackingItem>())}";
                Logger.Warn(msg, this);
                throw new ArgumentException(nameof(destinations), msg);
            }

            Tracker.Current.Interaction.CustomValues.TryGetValueAs(UserSearches.DefaultFacetKey, out UserSearches customValue);
            var userSearches = customValue ?? new UserSearches();

            userSearches.Searches.Add(new UserSearch()
            {
                Airports = airports,
                Destinations = destinations,
                StartDate = DateUtil.ParseDateTime(request.StartDate, DateTime.MinValue),
                EndDate = DateUtil.ParseDateTime(request.EndDate, DateTime.MinValue),
            });

            Tracker.Current.Interaction.CustomValues[UserSearches.DefaultFacetKey] = userSearches;

            Logger.Debug($"Current user search ({JsonConvert.SerializeObject(Tracker.Current.Interaction.CustomValues[UserSearches.DefaultFacetKey])}) has been saved to current interaction [{Tracker.Current.Interaction.InteractionId}]", this);
        }

        /// <inheritdoc/>
        public async Task ClearInteractionsAsync(DateTime dateTime)
        {
            using (var client = GetClient())
            {
                try
                {
                    // TODO: implement the clean up functionality for obsolete user searches by dates
                    var queryable = client.Interactions.Where(x => x.GetFacet<UserSearches>().Searches.Any());

                    var enumerable = await queryable.GetBatchEnumerator(batchSize);

                    using (var cancellationTokenSource = new CancellationTokenSource())
                    {
                        Logger.Info("Interactions clean up job has been started", this);
                        var countOfCleanedInteractions = 0;
                        while (await enumerable.MoveNext(5, cancellationTokenSource.Token))
                        {
                            foreach (var interaction in enumerable.Current)
                            {
                                client.DeleteInteraction(interaction);
                                countOfCleanedInteractions++;
                            }
                        }

                        await client.SubmitAsync();
                        Logger.Info($"Interactions clean up job has been finished. Count of cleaned interactions: {countOfCleanedInteractions}", this);
                    }
                }
                catch (XdbExecutionException ex)
                {
                    Logger.Error($"Cannot delete interactions due to {ex.Message}", ex, this);
                }
            }
        }

        /// <summary>
        /// Search tracking items by codes.
        /// </summary>
        /// <typeparam name="T">Type of search result item.</typeparam>
        /// <param name="codes">Collection of codes.</param>
        /// <param name="search">Search function by codes.</param>
        /// <returns>Collection of tracking items.</returns>
        private List<TrackingItem> SearchTrackingItemsByCodes<T>(IEnumerable<string> codes, Func<IEnumerable<string>, Sitecore.ContentSearch.Linq.SearchResults<T>> search)
            where T : BaseDatasourceSearchResultItem
        {
            var searchResults = search(codes)
                .Where(x => x.Document != null)
                .Select(x => new TrackingItem()
                {
                    Code = x.Document.Code,
                    Name = x.Document.ItemName,
                    Type = x.Document.TemplateName,
                    Id = x.Document.ItemId.ToString()
                })
                // Distinct duplicates from SOLR. For more reference see Sitecore ticket CS0213228.
                .GroupBy(x => x.Id)
                .Select(x => x.First())
                .ToList();

            return searchResults;
        }
    }
}
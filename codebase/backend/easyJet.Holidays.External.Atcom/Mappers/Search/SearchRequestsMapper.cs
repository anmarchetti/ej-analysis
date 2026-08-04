using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.Hotel;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.PriceGraph;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Data.Transfers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Models.Search;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.Domain.Exceptions;
using Microsoft.Extensions.Options;
using System.Globalization;

namespace easyJet.Holidays.External.Atcom.Mappers.Search
{
    public class SearchRequestsMapper
    {
        private readonly SearchSettings _searchSettings;
        private readonly AtcomSettings _atcomSettings;
        private readonly SmartSeerSettings _smartSeerSettings;

        public SearchRequestsMapper(
            IOptions<SearchSettings> searchSettings,
            IOptions<SmartSeerSettings> smartSeerSettings,
            IOptions<AtcomSettings> atcomSettings)
        {
            _searchSettings = searchSettings.Value ?? throw new ArgumentNullException(nameof(searchSettings));
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _smartSeerSettings = smartSeerSettings.Value ?? throw new ArgumentNullException(nameof(smartSeerSettings));
        }

        /// <summary>
        /// Map search request to Atcom request
        /// </summary>
        /// <param name="request"></param>
        /// <returns>Atcom request</returns>
        public SearchAvailablePackagesRequest MapBaseSearchRequest(BaseSearchRequest request)
        {
            DateTime startDate;
            DateTime endDate;
            if (DateTime.TryParseExact(request.StartDate, DateFormatUtils.DateOnlyFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out startDate))
            {
                // EndDate should be equal to StartDate by default
                endDate = new DateTime(startDate.Ticks);
                if (request.FlexibleDays != 0)
                {
                    startDate = startDate.AddDays(-request.FlexibleDays);
                    endDate = endDate.AddDays(request.FlexibleDays);
                }
            }
            else
            {
                throw new DataFormatException($"Can not parse startDate: {request.StartDate}, expected format: {DateFormatUtils.DateOnlyFormat}");
            }

            var mappedRequest = new SearchAvailablePackagesRequest
            {
                StartDate = DateFormatUtils.DateOnly(startDate),
                EndDate = DateFormatUtils.DateOnly(endDate),
                Duration = request.Duration != null ? string.Join(",", request.Duration) : string.Empty,
                Departure = request.Departure?.ToUpperInvariant()?.Split(','),
                Adults = request.Adults(),
                Children = request.Children(),
                Infants = request.Infants(),
                ChildAges = request.ChildAges?.Split(','),
                Rooms = request.Room?.Count ?? 0
            };

            mappedRequest.SearchType = MapSearchType(request.SearchType);

            return mappedRequest;
        }

        /// <summary>
        /// Map packages search request to Atcom request
        /// </summary>
        /// <param name="request">Public api request</param>
        /// <param name="searchQueryTemplate"></param>
        /// <returns>Atcom request</returns>
        public SearchAvailablePackagesRequest MapSearchRequest(PackagesSearchRequest request, string searchQueryTemplate)
        {
            var mappedRequest = MapBaseSearchRequest(request);
            if (!string.IsNullOrEmpty(request.PromoPageId))
            {
                mappedRequest.PromoPageId = request.PromoPageId;
            }
            mappedRequest.Poly = request.Polygon;
            mappedRequest.Rooms = request.AutomaticAllocation ? 0 : (request.Room?.Count ?? 0); // 0 for Atcom means "automatic"
            mappedRequest.FreeForKidsOnly = request.Offers?.Split(',').Any(x => x == OfferConstants.FreeForKidsFilter) ?? false;

            if (string.IsNullOrWhiteSpace(request.AccomCodes))
            {
                mappedRequest.Geography = request.Geography?.ToUpperInvariant();
            }
            else
            {
                mappedRequest.AccomCodes = request.AccomCodes;
                mappedRequest.AccomCodesNumber = request.AccomCodes.Split(',').Count();
            }

            // It's range request: override end date and durations
            if (!string.IsNullOrWhiteSpace(request.EndDate))
            {
                if (request.FlexibleDays != 0)
                {
                    if (DateTime.TryParseExact(request.EndDate, DateFormatUtils.DateOnlyFormat,
                        CultureInfo.InvariantCulture, DateTimeStyles.None, out var endDate))
                    {
                        mappedRequest.EndDate = DateFormatUtils.DateOnly(endDate.AddDays(request.FlexibleDays));
                    }
                    else
                    {
                        throw new DataFormatException(
                            $"Can not parse endDate: {request.EndDate}, expected format: {DateFormatUtils.DateOnlyFormat}");
                    }
                }
                else
                {
                    mappedRequest.EndDate = request.EndDate;
                }

                mappedRequest.Duration = mappedRequest.Duration?.Any() == true
                    ? mappedRequest.Duration
                    : _atcomSettings.AllDurations; // use default duration if it's not specified
            }

            // Support for "from anywhere to anywhere"
            if (request.Departure == _atcomSettings.AnywhereCode)
            {
                mappedRequest.Departure = new string[0]; // important to be not null value
            }

            if (request.Geography == _atcomSettings.AnywhereCode)
            {
                mappedRequest.Geography = string.Empty; // important to be empty string
            }

            if (!string.IsNullOrWhiteSpace(request.OutboundTimeSlots))
            {
                mappedRequest.OutboundTimeSlots = request.OutboundTimeSlots;
            }

            if (!string.IsNullOrWhiteSpace(request.InboundTimeSlots))
            {
                mappedRequest.InboundTimeSlots = request.InboundTimeSlots;
            }
            if (request is RecommendedSearchRequest)
            {
                mappedRequest.SmartSeerRequestSize = GetThresholdPageId(mappedRequest.StartDate, mappedRequest.EndDate);
            }
            if (!string.IsNullOrWhiteSpace(request.OutboundFlightNumber))
            {
                mappedRequest.OutboundFltNo = request.OutboundFlightNumber;
            }
            if (!string.IsNullOrWhiteSpace(request.InboundFlightNumber))
            {
                mappedRequest.InboundFltNo = request.InboundFlightNumber;
            }

            mappedRequest.SetQueryString(searchQueryTemplate);

            return mappedRequest;
        }

        /// <summary>
        /// Map search request to Atcom request
        /// </summary>
        /// <param name="request"></param>
        /// <param name="searchQueryTemplate">Query template</param>
        /// <returns></returns>
        public SearchAvailablePackagesRequest MapRoomVariants(RoomVariantsSearchRequest request, string searchQueryTemplate)
        {
            var mappedRequest = MapBaseSearchRequest(request);
            mappedRequest.BoardTypes = request.BoardType;
            mappedRequest.AccommodationId = request.AccommodationId;
            if (!string.IsNullOrEmpty(mappedRequest.AccommodationId))
            {
                mappedRequest.AccomCodesNumber = 1;
            }
            mappedRequest.OutboundRouteId = request.OutboundRouteId;
            mappedRequest.InboundRouteId = request.InboundRouteId;
            mappedRequest.PackageId = request.PackageId;
            mappedRequest.DepartureAirports = request.Departure?.ToUpperInvariant()?.Split(',');
            mappedRequest.Departure = null; // Atcom doesn't support multiple departure filter(but documentation says it should)

            mappedRequest.SetQueryString(searchQueryTemplate);

            return mappedRequest;
        }

        /// <summary>
        /// Map search request to Atcom request
        /// </summary>
        /// <param name="request">Request model to map</param>
        /// <returns></returns>
        public SearchAvailablePackagesRequest MapAlternativeFlights(AlternativeFlightsSearchRequest request, string searchQueryTemplate)
        {
            var mappedRequest = MapBaseSearchRequest(request);

            mappedRequest.AccommodationId = request.AccommodationId;
            mappedRequest.BoardTypes = request.BoardType;

            mappedRequest.SetQueryString(searchQueryTemplate);

            return mappedRequest;
        }

        /// <summary>
        /// Map search request to Atcom request
        /// </summary>
        /// <param name="request">Request model to map</param>
        /// <param name="searchQueryTemplate">Query template.</param>
        /// <param name="packageThemeType">Package theme.</param>
        /// <returns></returns>
        public SearchAvailablePackagesRequest MapAlternativeFlights(AmendFlightSearchRequest request,
            string searchQueryTemplate, PackageThemeType packageThemeType)
        {
            var mappedRequest = MapAlternativeFlights(request, searchQueryTemplate);

            //if Departure is not specified in AlternativeFlightsSearchRequest then get it from the base class (BaseSearchRequest)
            mappedRequest.Departure = string.IsNullOrWhiteSpace(request.Departure)
                ? mappedRequest.Departure
                : request.Departure?.ToUpperInvariant()?.Split(',');

            //TODO: Refactoring for css. Split to CSS
            mappedRequest.IncludedTransfer = TransfersServiceUtils.GetIncludedTransfer(request.Transfer, _atcomSettings?.Transfers?.Types, packageThemeType);
            mappedRequest.SetQueryString(searchQueryTemplate);

            return mappedRequest;
        }

        /// <summary>
        /// Map offer prices search
        /// </summary>
        /// <param name="request">Request model to map</param>
        /// <returns></returns>
        public virtual SearchAvailablePackagesRequest MapPriceGraph(PriceGraphBaseRequest request, string startDate, string endDate, string searchQueryTemplate)
        {
            var mappedRequest = MapBaseSearchRequest(request);
            mappedRequest.AccommodationId = request.AccommodationIds;
            mappedRequest.StartDate = startDate;
            mappedRequest.EndDate = endDate;
            mappedRequest.BoardTypes = request.BoardType;

            mappedRequest.SetQueryString(searchQueryTemplate);

            return mappedRequest;
        }

        /// <summary>
        /// Build search request to find date with offer for calendar.
        /// </summary>
        /// <param name="request"></param>
        /// <param name="searchQueryTemplate"></param>
        /// <returns></returns>
        public SearchAvailablePackagesRequest MapAmendDateInfo(AmendDateInfoRequest request, string searchQueryTemplate)
        {
            var mappedRequest = new SearchAvailablePackagesRequest
            {
                StartDate = DateFormatUtils.DateOnly(request.StartDate),
                EndDate = DateFormatUtils.DateOnly(request.EndDate),
                Duration = request.Duration.ToString(),
                Departure = request.Departure?.ToUpperInvariant()?.Split(','),
                Adults = request.Room.Sum(x => x.Adults),
                Children = request.Room.Sum(x => x.Children),
                Infants = request.Room.Sum(x => x.Infants),
                ChildAges = request.ChildAges?.Split(','),
                Rooms = request.Room.Count(),
                AccommodationId = request.AccommodationId
            };

            mappedRequest.AddQueryString(SearchQueryUtils.BuildRoomAllocationQuery(request.Room.ToList()));

            mappedRequest.SetQueryString(searchQueryTemplate);

            return mappedRequest;
        }

        /// <summary>
        /// Build a search request to find a package that fully matches the existing parameters.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public SearchAvailablePackagesRequest MapAmendDateSummaryInfo(AmendDatesSummaryRequest request, bool includeTransfer = true)
        {
            var searchRequest = new SearchAvailablePackagesRequest
            {
                StartDate = DateFormatUtils.DateOnly(request.SelectedDate),
                EndDate = DateFormatUtils.DateOnly(request.SelectedDate),
                Duration = request.Duration,
                Adults = request.Room.Sum(x => x.Adults),
                Children = request.Room.Sum(x => x.Children),
                Infants = request.Room.Sum(x => x.Infants),
                ChildAges = request.ChildAges?.Split(','),
                Rooms = request.Room.Count(),
                AccommodationId = request.AccomId,
                BoardTypes = request.BoardType,
                IncludedTransfer = includeTransfer
                    ? TransfersServiceUtils.GetIncludedTransfer(request.TransferCode, _atcomSettings.Transfers.Types)
                    : IncludedTransferType.Cheapest
            };

            searchRequest.AddQueryString(SearchQueryUtils.BuildRoomAllocationQuery(request.Room.ToList()));

            searchRequest.SetQueryString(_atcomSettings.EndpointTemplate.SearchAccomOffers);

            return searchRequest;
        }

        /// <summary>
        /// Build a search request to find a package that fully matches the existing parameters.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public SearchAvailablePackagesRequest MapNotFullyMatchedAmendDateSummaryInfo(AmendDatesSummaryRequest request)
        {
            var searchRequest = new SearchAvailablePackagesRequest
            {
                StartDate = DateFormatUtils.DateOnly(request.SelectedDate),
                EndDate = DateFormatUtils.DateOnly(request.SelectedDate),
                Duration = request.Duration,
                Adults = request.Room.Sum(x => x.Adults),
                Children = request.Room.Sum(x => x.Children),
                Infants = request.Room.Sum(x => x.Infants),
                ChildAges = request.ChildAges?.Split(','),
                Rooms = request.Room.Count(),
                AccommodationId = request.AccomId
            };
            searchRequest.SetQueryString(_atcomSettings.EndpointTemplate.SearchAccomOffers);

            return searchRequest;
        }

        /// <summary>
        /// Build search request to find the cheapest offer for selected accom, room composition and duration.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public SearchAvailablePackagesRequest MapCheapestPackageRequest(AmendDatesSummaryRequest request)
        {
            var searchRequest = new SearchAvailablePackagesRequest
            {
                StartDate = DateFormatUtils.DateOnly(request.SelectedDate),
                EndDate = DateFormatUtils.DateOnly(request.SelectedDate),
                Duration = request.Duration,
                Adults = request.Room.Sum(x => x.Adults),
                Children = request.Room.Sum(x => x.Children),
                Infants = request.Room.Sum(x => x.Infants),
                ChildAges = request.ChildAges?.Split(','),
                Rooms = request.Room.Count(),
                AccommodationId = request.AccomId
            };

            // We should remove RoomCode to find cheapest offer which not depend on this parameter
            searchRequest
                .AddQueryString(
                    SearchQueryUtils
                        .BuildRoomAllocationQuery(
                            request.Room
                                .Select(x => new RoomAllocation { Adults = x.Adults, Children = x.Children, Infants = x.Infants }).ToList()));

            searchRequest.SetQueryString(_atcomSettings.EndpointTemplate.SearchCheapestOffers);

            return searchRequest;
        }

        /// <summary>
        /// Map search type from request to atcom values.
        /// </summary>
        /// <param name="type">Type value from request</param>
        /// <returns></returns>
        private string MapSearchType(Holidays.Api.Domain.Data.PackageOffers.SearchType? type)
        {
            return _searchSettings.SerchTypes?.FirstOrDefault(x => x.Key == type?.ToString())?.Value;
        }

        /// <summary>
        /// Get treshold of page based on start and end date.
        /// </summary>
        /// <returns></returns>
        private string GetThresholdPageId(string startDate, string endDate)
        {
            TimeSpan duration = DateTime.Parse(endDate) - DateTime.Parse(startDate);
            if (duration.TotalDays >= _smartSeerSettings.ThresholdSettings.ExtendedThreshold.ThresholdDays)
            {
                return _smartSeerSettings.ThresholdSettings.ExtendedThreshold.ThresholdName;
            }
            else if (duration.TotalDays >= _smartSeerSettings.ThresholdSettings.LongThreshold.ThresholdDays)
            {
                return _smartSeerSettings.ThresholdSettings.LongThreshold.ThresholdName;
            }
            else if (duration.TotalDays >= _smartSeerSettings.ThresholdSettings.MediumThreshold.ThresholdDays)
            {
                return _smartSeerSettings.ThresholdSettings.MediumThreshold.ThresholdName;
            }
            else
            {
                return _smartSeerSettings.ThresholdSettings.ShortThreshold.ThresholdName;
            }
        }
    }
}
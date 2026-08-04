using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Seats;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Seats;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.B2B.Models.Seats;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using AircraftType = easyJet.Holidays.Api.Domain.Data.Seats.AircraftType;
using Benefit = easyJet.Holidays.External.B2B.Models.Seats.Benefit;
using CMSAircraftType = easyJet.Holidays.Api.Domain.Data.ReferenceData.AircraftType;
using CMSBenefit = easyJet.Holidays.Api.Domain.Data.ReferenceData.Benefit;
using Product = easyJet.Holidays.External.B2B.Models.Seats.Product;
using Seat = easyJet.Holidays.External.B2B.Models.Seats.Seat;

namespace easyJet.Holidays.External.B2B.Services
{
    public class SeatingService : ISeatingService
    {
        private const string LuxuryPromotionKey = "lux";
        private readonly IApiService _apiService;
        private readonly B2BSettings _b2bSettings;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IReferenceDataService _referenceDataService;
        private readonly IFlightSeatPlanCacheService _flightSeatPlanCacheService;
        private readonly ILogger<SeatingService> _logger;
        private readonly ILanguageService _languageService;

        public SeatingService(
            IApiService apiService,
            IOptions<B2BSettings> b2bSettings,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            IReferenceDataService referenceDataService,
            IFlightSeatPlanCacheService flightSeatPlanCacheService,
            ILogger<SeatingService> logger,
            ILanguageService languageService)
        {
            _b2bSettings = b2bSettings.Value ?? throw new ArgumentNullException(nameof(b2bSettings));
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
            _referenceDataService = referenceDataService;
            _flightSeatPlanCacheService = flightSeatPlanCacheService;
            _logger = logger;
            _languageService = languageService;
        }

        /// <inheritdoc />
        public async Task<GetSeatsMapResponse> GetSeatsMap(GetSeatsMapRequest request, bool includeOnlyProductCodes = false)
        {
            return await    GetSeatsMapInternal(request, includeOnlyProductCodes);
        }

        /// <inheritdoc />
        public async Task<List<Holidays.Api.Domain.Data.DynamoDB.Bookings.Seat>> GetCachedSeatsMap(Route route, string currencyCode)
        {
            return await GetCachedSeatsMap(new GetSeatsMapRequest(route, currencyCode));
        }

        /// <inheritdoc />
        public async Task<List<Holidays.Api.Domain.Data.DynamoDB.Bookings.Seat>> GetCachedSeatsMap(GetSeatsMapRequest request)
        {
            ArgumentNullException.ThrowIfNull(request);

            var flightId = FlightSeatPlanCacheService.GetFlightId(
                request.FlightNumber.ToString(CultureInfo.InvariantCulture),
                request.DepAirportCode,
                request.ArrAirportCode,
                DateTime.Parse(request.DepartureDate, CultureInfo.InvariantCulture),
                request.Promo);

            var cachedSeatMap = await _flightSeatPlanCacheService.GetFlightSeatPlan(flightId);
            if (cachedSeatMap != null)
            {
                foreach(var seat in cachedSeatMap)
                {
                    var price = await GetPrice(seat.Price, request.Promo, seat.PriceBand);
                    seat.Price = price;
                }
                return cachedSeatMap;
            }
                

            var seatMap = await GetSeatsMapInternal(request, false);

            return await _flightSeatPlanCacheService.CreateFlightSeatPlan(flightId, seatMap);
        }

        /// <inheritdoc />
        public async Task<SeatMap> GetCachedSeatsInfo(Route route, string currencyCode, IList<string> seatNumbers, string prom)
        {
            if (route == null || !route.DepDate.HasValue || string.IsNullOrWhiteSpace(route.FlightNumberWithoutCar) ||
                string.IsNullOrWhiteSpace(route.DepPt) || string.IsNullOrWhiteSpace(route.ArrPt) || seatNumbers.IsNullOrEmpty())
            {
                return null;
            }

            List<Holidays.Api.Domain.Data.DynamoDB.Bookings.Seat> b2BSeatsMap;
            try
            {
                var request = new GetSeatsMapRequest(route, currencyCode);
                request.Promo = prom;
                b2BSeatsMap = await GetCachedSeatsMap(request);
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Couldn't get seats information for flight {route.FlightNumberWithoutCar}");
                return null;
            }

            var result = new SeatMap
            {
                FlightNumber = route.FlightNumberWithoutCar,
                Seats = new List<Holidays.Api.Domain.Data.Booking.Seat>()
            };

            foreach (var seatNumber in seatNumbers.Where(seatNumber => !string.IsNullOrWhiteSpace(seatNumber)))
            {
                var b2BSeat = b2BSeatsMap?.SingleOrDefault(s => s.Number == seatNumber);
                if (b2BSeat == null)
                {
                    continue;
                }

                result.Seats.Add(new Holidays.Api.Domain.Data.Booking.Seat
                {
                    SeatNumber = seatNumber,
                    Price = b2BSeat.Price,
                    PriceBand = b2BSeat.PriceBand,
                    Products = b2BSeat.Products.Select(product =>
                        new Holidays.Api.Domain.Data.Booking.Product
                        {
                            Id = product.Id,
                            Name = product.Name,
                            Description = product.Description,
                            Icon = product.Icon
                        }).ToList()
                });
            }

            return result;
        }

        /// <inheritdoc />
        public async Task EnrichWithCachedSeatsInfo(List<Offer> offers, List<string> outboundSeatNumbers, List<string> inboundSeatNumbers)
        {
            if (offers.IsNullOrEmpty() || outboundSeatNumbers.IsNullOrEmpty() && inboundSeatNumbers.IsNullOrEmpty())
            {
                return;
            }

            foreach (var offer in offers)
            {
                var outboundRoute = offer?.Transport?.Routes?.FirstOrDefault(route => route.Direction == Direction.Outbound);
                var inboundRoute = offer?.Transport?.Routes?.FirstOrDefault(route => route.Direction == Direction.Inbound);

                if (outboundRoute == null && inboundRoute == null)
                {
                    continue;
                }

                List<SeatMap> seatSelection = new List<SeatMap>
                {
                    await GetCachedSeatsInfo(outboundRoute, offer!.Currency.Code, outboundSeatNumbers, offer!.Accom.Prom),
                    await GetCachedSeatsInfo(inboundRoute, offer!.Currency.Code, inboundSeatNumbers, offer!.Accom.Prom)
                }
                .Where(seatMap => seatMap != null).ToList();

                if (seatSelection.Any())
                {
                    offer.SeatSelection = seatSelection;
                }
            }
        }

        private async Task<GetSeatsMapResponse> GetSeatsMapInternal(GetSeatsMapRequest request, bool includeOnlyProductCodes)
        {
            Func<CMSBenefit, Holidays.Api.Domain.Data.Seats.Product> mapBenefitToProductFunc =
                includeOnlyProductCodes ?
                benefit => new Holidays.Api.Domain.Data.Seats.Product
                {
                    Id = benefit.Code
                }
                :
                benefit => new Holidays.Api.Domain.Data.Seats.Product
                {
                    Id = benefit.Code,
                    Name = benefit.Name,
                    Description = benefit.Description,
                    Icon = benefit.Icon
                };

            var seatsPlan = await GetSeatsPlan(request);
            var benefitsDictionary = await GetBenefitsDictionary();
            var aircraftTypesDictionary = await GetAircraftTypesDictionary();

            return GetSeatsMapResponse(request.CurrencyCode, request.Promo, seatsPlan, benefitsDictionary, aircraftTypesDictionary, mapBenefitToProductFunc);
        }

        private async Task<Dictionary<string, string>> GetAircraftTypesDictionary()
        {
            var aircraftTypes = await _referenceDataService.GetAircraftTypes();
            var aircraftTypesDictionary = (aircraftTypes?.Children ?? new List<CMSAircraftType>())
                .ToDictionary(type => type.Code, type => type.Name);
            return aircraftTypesDictionary;
        }

        private async Task<Dictionary<string, CMSBenefit>> GetBenefitsDictionary()
        {
            var benefits = await _referenceDataService.GetBenefits();
            var benefitsDictionary = (benefits?.Children ?? new List<CMSBenefit>())
                .ToDictionary(b => b.Code, b => b);
            return benefitsDictionary;
        }

        private async Task<GetSeatsPlanResponse> GetSeatsPlan(GetSeatsMapRequest request)
        {
            var getSeatsPlanRequest = new GetSeatsPlanRequest();
            var getSeatsPlanRequestBody = new GetSeatsPlanRequestBody(_b2bSettings)
            {
                LanguageCode = LanguageParseUtils.MapToLanguageCode(_languageService.GetCurrentLanguage()),
                ArrAirportCode = request.ArrAirportCode,
                DepAirportCode = request.DepAirportCode,
                DepartureDate = request.DepartureDate,
                FlightNumber = request.FlightNumber,
                CurrencyCode = request.CurrencyCode,
                BaseCurrencyCode = request.CurrencyCode,
                FareClass = request.FareClass ?? B2BConstants.Yes,
                HasejPlusCard = request.HaseEjPlusCard ?? B2BConstants.No,
                Disability = request.Disability ?? B2BConstants.No,
                Child = request.Child ?? B2BConstants.No,
                Fragile = request.Fragile ?? B2BConstants.No,
                InfantOnLap = request.InfantOnLap ?? B2BConstants.No,
                PhysicalDisorder = request.PhysicalDisorder ?? B2BConstants.No,
                Pregnant = request.Pregnant ?? B2BConstants.No,
                ShowOffers = B2BConstants.Yes
            };

            getSeatsPlanRequest.Payload.Body = getSeatsPlanRequestBody;
            getSeatsPlanRequest.Endpoint = _endpointsProvider.GetEndpoint
            (
                B2BEndpoint.BasicService,
                _httpContextAccessor.HttpContext?.Request?.Cookies
            );

            var seatsPlan = await _apiService.GetResponseContentAsyncWithErrorMapping<GetSeatsPlanRequest, GetSeatsPlanResponse>
                (getSeatsPlanRequest, ApiExceptionCodes.GetSeatsPlanError);
            return seatsPlan;
        }

        private GetSeatsMapResponse GetSeatsMapResponse(
            string currencyCode,
            string promo,
            GetSeatsPlanResponse seatsPlan,
            Dictionary<string, CMSBenefit> benefitsDictionary,
            Dictionary<string, string> aircraftTypes,
            Func<CMSBenefit, Holidays.Api.Domain.Data.Seats.Product> mapBenefitToProductFunc)
        {
            var response = new GetSeatsMapResponse();

            if (seatsPlan?.Payload?.Body == null || seatsPlan.Payload?.Body.Success != 1)
            {
                return response;
            }

            var productDictionary = GetProductDictionary(seatsPlan);
            var fareBenefits = seatsPlan.Payload.Body?.DataListRoot?.Offers?.Fare?.Benefits ?? Enumerable.Empty<Benefit>();

            response.AircraftType = GetAircraftType(seatsPlan.Payload.Body.DataListRoot?.SeatPlanResponse?.AircraftType, aircraftTypes);
            response.CurrencyCode = seatsPlan.Payload.Body.DataListRoot?.SeatPlanResponse?.CurrencyCode;
            response.IsWrapped = seatsPlan.Payload.Body.DataListRoot?.SeatPlanResponse?.IsWrapped;
            response.Rows = seatsPlan.Payload?.Body
                .DataListRoot?.SeatPlanResponse?.Rows?.Select(r =>
                    MapSeatMapRow(currencyCode, promo, benefitsDictionary, r, productDictionary, fareBenefits, mapBenefitToProductFunc)).ToList();
            response.VisibleProducts = benefitsDictionary.Values
                .Where(benefit => benefit.IsVisibleOnSeatMapPlan)
                .Select(benefit => new Holidays.Api.Domain.Data.Seats.Product
                {
                    Id = benefit.Code,
                    Name = benefit.Name,
                    Description = benefit.Description,
                    Icon = benefit.Icon
                }).ToList();

            return response;
        }

        private static Dictionary<int, Product> GetProductDictionary(GetSeatsPlanResponse seatsPlan)
        {
            var products = seatsPlan.Payload.Body?.DataListRoot?.Offers?.AncillaryOffers?
                                           .Where(product => !string.IsNullOrWhiteSpace(product.ChargeCode))
                                           .DistinctBy(product => product.ChargeCode)
                                       ?? Enumerable.Empty<Product>();
            var productDictionary = products.ToDictionary(p => int.Parse(p.ChargeCodeId), p => p);
            return productDictionary;
        }

        private SeatMapRow MapSeatMapRow(
            string currencyCode,
            string promo,
            Dictionary<string, CMSBenefit> benefitsDictionary,
            Row r,
            Dictionary<int, Product> productDictionary,
            IEnumerable<Benefit> fareBenefits,
            Func<CMSBenefit, Holidays.Api.Domain.Data.Seats.Product> mapBenefitToProductFunc)
        {
            return new SeatMapRow
            {
                IsExitRow = r.IsExitRow,
                IsOverWing = r.IsOverWing,
                PriceBandName = r.PriceBandName,
                RowNumber = r.RowNumber,
                Blocks = r.Blocks?.Select(b =>
                    MapSeatMapRowBlock(currencyCode, promo, benefitsDictionary, b, productDictionary, fareBenefits, mapBenefitToProductFunc)).ToList()
            };
        }

        private SeatMapRowBlock MapSeatMapRowBlock(
            string currencyCode,
            string promo, Dictionary<string, CMSBenefit> benefitsDictionary,
            Block b,
            Dictionary<int, Product> productDictionary,
            IEnumerable<Benefit> fareBenefits,
            Func<CMSBenefit, Holidays.Api.Domain.Data.Seats.Product> mapBenefitToProductFunc)
        {
            return new SeatMapRowBlock
            {
                Seats = b.Seats
                    ?.Select(s => MapSeatMapSeat(currencyCode, promo, benefitsDictionary, s, productDictionary, fareBenefits, mapBenefitToProductFunc))
                    .Select(s => s.Result).ToList()
            };
        }

        private async Task<SeatMapSeat> MapSeatMapSeat(
            string currencyCode,
            string promo, 
            Dictionary<string, CMSBenefit> benefitsDictionary,
            Seat s,
            Dictionary<int, Product> productDictionary,
            IEnumerable<Benefit> fareBenefits,
            Func<CMSBenefit, Holidays.Api.Domain.Data.Seats.Product> mapBenefitToProductFunc)
        {
            var seatMapSeat = new SeatMapSeat
            {
                IsAvailable = s.IsAvailable,
                IsAisleSeat = s.IsAisleSeat,
                IsAvailableForChild = s.IsAvailableForChild,
                IsAvailableForInfant = s.IsAvailableForInfant,
                IsExitRow = s.IsExitRow,
                IsMiddleSeat = s.IsMiddleSeat,
                IsWindowSeat = s.IsWindowSeat,
                IsBulkheadSeat = bool.Parse(s.IsBulkheadSeat.ToLowerInvariant()),
                IsOccupiedByInfant = bool.Parse(s.IsOccupiedByInfant.ToLowerInvariant()),
                Number = s.Number,
                Price = await GetPrice(s.Price, promo, s.PriceBand),
                PriceBand = s.PriceBand,
                PriceBandId = s.PriceBandId,
                PriceWithCreditCardFee = s.PriceWithCreditCardFee,
                SeatAccess = s.SeatAccess,
                Currency = currencyCode,
                IsPremiumSeat = _b2bSettings.PremiumSeatChargeCodeIds.Contains(s.ChargeCodeId),
                ChargeCodeId = s.ChargeCodeId,
                Products = GetProducts(s.ChargeCodeId, productDictionary, fareBenefits, benefitsDictionary, mapBenefitToProductFunc)
            };

            return seatMapSeat;
        }

        private async Task<decimal> GetPrice(decimal price, string promo, string priceBand)
        {
            var promotionCollections =  await _referenceDataService.GetPromotionCollections();

            if (string.IsNullOrWhiteSpace(promo)
                || promotionCollections == null
                || promotionCollections.Promotions == null
                || promotionCollections.Promotions.Count == 0)
            {
                return price;
            }

            var promotionCollection = promotionCollections.Promotions.FirstOrDefault(p => 
                p.PromotionCodes.Contains(promo, StringComparison.Ordinal) && p.Key.Equals(LuxuryPromotionKey, StringComparison.Ordinal));

            if (promotionCollection is null)
            {
                return price;
            
            }
            return promotionCollection.PromotionCodes.Split(",").Any(pc => pc.Equals(promo, StringComparison.Ordinal)) && (string.IsNullOrEmpty(priceBand) || priceBand.Length == string.Empty.Length || priceBand == "Rear Standard") ? 0 : price;
        }

        private static AircraftType GetAircraftType(string code, Dictionary<string, string> aircraftTypes)
        {
            if (string.IsNullOrEmpty(code) || aircraftTypes == null)
            {
                return null;
            }

            aircraftTypes.TryGetValue(code, out var name);
            var aircraftType = new AircraftType()
            {
                Code = code,
                Name = name
            };
            return aircraftType;
        }

        private static List<Holidays.Api.Domain.Data.Seats.Product> GetProducts(
            int chargeCodeId,
            Dictionary<int, Product> productDictionary,
            IEnumerable<Benefit> fareBenefits,
            Dictionary<string, CMSBenefit> benefitsDictionary,
            Func<CMSBenefit, Holidays.Api.Domain.Data.Seats.Product> mapBenefitToProductFunc)
        {
            productDictionary.TryGetValue(chargeCodeId, out var product);
            var visibleBenefits = benefitsDictionary.Values
                .Where(benefit => benefit.IsVisibleOnSeatMapPlan)
                .Select(benefit => benefit.Code);

            var products = fareBenefits
                .Union(product?.Benefits ?? Enumerable.Empty<Benefit>())
                .IntersectBy(visibleBenefits, benefit => benefit.Key)
                .Select(b =>
                {
                    benefitsDictionary.TryGetValue(b.Key, out var benefit);
                    return mapBenefitToProductFunc(benefit);
                })
                .ToList();

            return products;
        }
    }
}

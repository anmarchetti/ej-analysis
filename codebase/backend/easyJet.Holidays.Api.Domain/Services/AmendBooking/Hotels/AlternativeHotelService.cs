using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers.Interfaces;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using System.Globalization;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.Hotels;

/// <inheritdoc />
public class AlternativeHotelService : IAlternativeHotelService
{
    private const string RequestDateTimeFormat = "yyyy-MM-dd:HHmm";
    private const string RequestDateFormat = "yyyy-MM-dd";

    private readonly IHotelsService _hotelsService;
    private readonly IOffersAggregator _offersAggregator;
    private readonly IValidateBookingResponseMapper _validateBookingResponseMapper;
    private readonly IPricesService _pricesService;
    private readonly IReferenceDataService _referenceDataService;

    /// <summary>
    /// Initializes a new instance of the <see cref="AlternativeHotelService"/> class.
    /// </summary>
    /// <param name="hotelsService">Service for handling hotel-related operations.</param>
    /// <param name="offersAggregator">Service for aggregating offers.</param>
    /// <param name="validateBookingResponseMapper">Mapper for validating booking responses.</param>
    /// <param name="pricesService">Service for handling price-related operations.</param>
    /// <param name="referenceDataService">Sitecore data service</param>
    public AlternativeHotelService(
        IHotelsService hotelsService,
        IOffersAggregator offersAggregator,
        IValidateBookingResponseMapper validateBookingResponseMapper,
        IPricesService pricesService,
        IReferenceDataService referenceDataService)
    {
        _hotelsService = hotelsService;
        _offersAggregator = offersAggregator;
        _validateBookingResponseMapper = validateBookingResponseMapper;
        _pricesService = pricesService;
        _referenceDataService = referenceDataService;
    }

    /// <inheritdoc />
    public async Task EnrichHotelsInformation(SearchOffersResponse searchOffersResponse)
    {
        ArgumentNullException.ThrowIfNull(searchOffersResponse);

        var offerIds = searchOffersResponse.Offers.Select(x => x.Accom.Code).ToArray();
        var hotels = await _hotelsService.Search(offerIds);

        await _offersAggregator.Combine(searchOffersResponse, hotels);
    }

    /// <inheritdoc />
    public GetAmendHotelListResponse BuildAmendHotelListResponse(BookingResponse booking, SearchOffersResponse alternativeHotelList)
    {
        ArgumentNullException.ThrowIfNull(booking);
        ArgumentNullException.ThrowIfNull(alternativeHotelList);

        var amendHotelOffers = alternativeHotelList.Offers.Select(offer => MapToAmendHotelOffer(booking, offer));

        var result = new GetAmendHotelListResponse
        {
            BookingRef = booking.BookingReference,
            AmendHotelOffers = amendHotelOffers,
            Filters = alternativeHotelList.Filters,
            Status = BuildStatusInformation(booking, alternativeHotelList)
        };

        return result;
    }

    /// <summary>
    /// Calculates min and max full amendment charges amount for unfiltered by price offers
    /// </summary>
    /// <param name="booking" cref="BookingResponse">Original booking information.</param>
    /// <param name="alternativeHotelList" cref="SearchOffersResponse">Atcom cache response with available options.</param>
    /// <returns cref="Status">Return status information for amend hotel list.</returns>
    private Status BuildStatusInformation(BookingResponse booking, SearchOffersResponse alternativeHotelList)
    {
        var calculateMinPrices = _validateBookingResponseMapper.CalculatePrices(booking, alternativeHotelList.Status.MinPrice);
        var calculateMaxPrices = _validateBookingResponseMapper.CalculatePrices(booking, alternativeHotelList.Status.MaxPrice);

        var minAmendmentCharges =
            CalculateFullAmendmentCharges(calculateMinPrices.FullOfferPrice, booking.PaymentInfo.BookingPriceEx);

        var maxAmendmentCharges =
            CalculateFullAmendmentCharges(calculateMaxPrices.FullOfferPrice, booking.PaymentInfo.BookingPriceEx);

        var statuesInfo = new Status
        {
            Total = alternativeHotelList.Status.Total,
            MinPrice = _pricesService.RoundPrice(minAmendmentCharges),
            MaxPrice = _pricesService.RoundPrice(maxAmendmentCharges),
            Upsell = _pricesService.RoundPrice(alternativeHotelList.Status.Upsell)
        };
        return statuesInfo;
    }

    /// <inheritdoc />
    public AlternativeHotelsSearchRequest CreateAlternativeHotelsSearchRequest(BookingResponse bookingResponse)
    {
        ArgumentNullException.ThrowIfNull(bookingResponse);

        var request = CreateAmendHotelBaseSearchRequest<AlternativeHotelsSearchRequest>(bookingResponse);
        request!.AccomCode = bookingResponse.Package.Accom.Code;
        request.BookingStartDate = bookingResponse.Package!.Transport!.OutboundFlight!.DepDate!.Value.ToString(RequestDateFormat, CultureInfo.InvariantCulture);
        request.Duration = bookingResponse.Package.Accom.CalculateDuration();
        request.RouteTotalPrice = bookingResponse.Package.Transport.Routes.Sum(x => x.TotalPrice);
        return request;
    }

    /// <inheritdoc />
    public AlternativeHotelRoomsSearchRequest CreateAlternativeHotelRoomsSearchRequest(BookingResponse bookingResponse, AmendHotelOffer amendHotelOffer)
    {
        ArgumentNullException.ThrowIfNull(bookingResponse);
        ArgumentNullException.ThrowIfNull(amendHotelOffer);

        var request = CreateAmendHotelBaseSearchRequest<AlternativeHotelRoomsSearchRequest>(bookingResponse);
        request!.PkgId = amendHotelOffer.Accom.PackageId;

        return request;
    }

    /// <inheritdoc />
    public async Task<AmendHotelResponse> BuildAmendHotel(
        BookingResponse bookingResponse,
        ValidateAmendBookingResponse validateAmendBookingResponse,
        AmendHotelOffer alternativePackage,
        AmendHotelOffer requestAmendHotelOffer)
    {
        ArgumentNullException.ThrowIfNull(bookingResponse);
        ArgumentNullException.ThrowIfNull(alternativePackage);

        if (validateAmendBookingResponse is null)
            return null;

        var result = new AmendHotelResponse
        {
            AmendHotelOffer = await _validateBookingResponseMapper.MapToAmendmentHotelOffer(validateAmendBookingResponse, bookingResponse, requestAmendHotelOffer),
            BookingReference = bookingResponse.BookingReference
        };

        result.AmendHotelOffer.Accom.PackageId = alternativePackage.Accom.PackageId;

        await EnrichHotelsInformation(result.AmendHotelOffer);

        return result;
    }

    /// <inheritdoc />
    public async Task<PackagesSearchRequest> BuildPackageSearchRequest(SearchParameters parameters, BookingResponse booking)
    {
        ArgumentNullException.ThrowIfNull(booking);

        if(parameters is null)
            return new PackagesSearchRequest { MarketCode = booking.MarketCode };

        var orderBy = parameters.SortingBy switch
        {
            SortParameter.TripAdvisorDesc => OrderByField.TripAdvisorWithoutSmartSeer,
            _ => OrderByField.Price,
        };

        var orderDirection = parameters.SortingBy switch
        {
            SortParameter.PriceAsc => OrderByDirection.Asc,
            SortParameter.PriceDesc => OrderByDirection.Desc,
            _ => OrderByDirection.Asc //doesn't matter
        };

        var searchRequest = new PackagesSearchRequest
        {
            BoardType = parameters.BoardType,
            Facilities = parameters.Facilities,
            IsPricePP = false,
            MarketCode = booking.MarketCode,
            OrderBy = orderBy,
            OrderDirection = orderDirection,
            PriceFrom = ConvertAmendmentPriceToOfferPrice(parameters.PriceFrom, booking),
            PriceTo = ConvertAmendmentPriceToOfferPrice(parameters.PriceTo, booking),
            Page = parameters.Page,
            StarRating = parameters.StarRating,
            Take = (byte)parameters.PageSize,
            Themes = parameters.PackageTheme,
            TripAdvisorRating = parameters.TripAdvisorRating,
        };

        var amendSettings = await _referenceDataService.GetAmendBookingSetting();
        if(amendSettings.AmendHotelUpsellLimit is not null)
        {
            var upsellFrom = ConvertAmendmentPriceToOfferPrice(0, booking);
            searchRequest.UpsellFrom = upsellFrom;
            searchRequest.UpsellTo = upsellFrom + amendSettings.AmendHotelUpsellLimit;
        }

        return searchRequest;
    }

    /// <summary>
    /// Converts relative amendment price (for example +150 to the price of booking that costs 800 of which 30 are extras) to an absolute offer price (920)
    /// </summary>
    private decimal ConvertAmendmentPriceToOfferPrice(decimal? price, BookingResponse booking)
    {
        if (price is null)
            return 0;

        //when offerPrice is 0, fullOfferPrice = extraLuggagePrice + seatsPrice + discountAmount
        var bookingPrices = _validateBookingResponseMapper.CalculatePrices(booking, 0);
        var offerPrice = booking.PaymentInfo.BookingPriceEx + price.Value - bookingPrices.FullOfferPrice;
        return offerPrice;
    }

    private static T CreateAmendHotelBaseSearchRequest<T>(BookingResponse bookingResponse) where T : AmendHotelBaseSearchRequest, new()
    {
        var rooms = new Dictionary<int, string>();
        for (var index = 0; index < bookingResponse.Package.Accom.Rooms.Count; index++)
        {
            var unit = bookingResponse.Package.Accom.Rooms[index];
            rooms[index + 1] = string.Join(',', unit.Occupation.PaxIds);
        }

        var result = new T
        {
            RoomComposition = rooms,
            Adults = bookingResponse.Guests.Count(x => x.Type == PersonType.Adult),
            Children = bookingResponse.Guests.Count(x => x.Type == PersonType.Child),
            Infants = bookingResponse.Guests.Count(x => x.Type == PersonType.Infant),
            ChildAges = bookingResponse.Guests.Where(x => x.Type == PersonType.Child).Select(x => x.Age.ToString(CultureInfo.InvariantCulture)).ToArray(),
            DepartureAirportCode = bookingResponse.Package.Transport.OutboundFlight.DepPt,
            ArrivalAirportCode = bookingResponse.Package.Transport.OutboundFlight.ArrPt,
            OutboundDepartureDate = bookingResponse.Package!.Transport!.OutboundFlight!.DepDate!.Value.ToString(RequestDateTimeFormat, CultureInfo.InvariantCulture),
            OutboundArrivalDate = bookingResponse.Package!.Transport!.OutboundFlight!.ArrDate!.Value.ToString(RequestDateTimeFormat, CultureInfo.InvariantCulture),
            OutboundFlightNumber = $"{bookingResponse.Package.Transport.OutboundFlight.Car}{bookingResponse.Package.Transport.OutboundFlight.FlightNumberWithoutCar}",
            InboundDepartureDate = bookingResponse.Package!.Transport!.ReturnFlight!.DepDate!.Value.ToString(RequestDateTimeFormat, CultureInfo.InvariantCulture),
            InboundArrivalDate = bookingResponse.Package!.Transport!.ReturnFlight!.ArrDate!.Value.ToString(RequestDateTimeFormat, CultureInfo.InvariantCulture),
            InboundFlightNumber = $"{bookingResponse.Package.Transport.ReturnFlight.Car}{bookingResponse.Package.Transport.ReturnFlight.FlightNumberWithoutCar}",
            MarketCode = bookingResponse.MarketCode
        };

        return result;
    }

    private AmendHotelOffer MapToAmendHotelOffer(BookingResponse booking, Offer offer)
    {
        var result = new AmendHotelOffer
        {
            Accom = offer.Accom,
            Hotel = offer.Hotel,
            Transfers = offer.Transfers,
            AmendmentChargesInfo = MapToAmendmentChargesInfo(booking, offer)
        };

        return result;
    }

    private AmendmentChargesInfo MapToAmendmentChargesInfo(BookingResponse booking, Offer offer)
    {
        var prices = _validateBookingResponseMapper.CalculatePrices(booking, offer.Price);
        
        return new AmendmentChargesInfo
        {
            BookingPrice = booking.PaymentInfo.BookingPriceEx,
            OfferPrice = offer.Price,
            FullOfferPrice = prices.FullOfferPrice,
            SeatsPrice = prices.SeatsPrice,
            ExtraLuggagePrice = prices.ExtraLuggagePrice,
            FullAmendmentCharges = CalculateFullAmendmentCharges(prices.FullOfferPrice, booking.PaymentInfo.BookingPriceEx)
        };
    }

    private static decimal CalculateFullAmendmentCharges(decimal fullOfferPrice, decimal bookingPriceEx)
    {
        return fullOfferPrice - bookingPriceEx;
    }

    private async Task EnrichHotelsInformation(AmendHotelOffer amendHotelOffer)
    {
        var hotels = await _hotelsService.Search(new[] {amendHotelOffer.Accom.Code});

        var hotelInfo = await _offersAggregator.EnrichAccomWithHotelInfo(amendHotelOffer.Accom, hotels);
        amendHotelOffer.Hotel = hotelInfo;
    }
    
    
}
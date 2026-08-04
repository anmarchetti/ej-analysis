using System.Globalization;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Factories.PromoCodeBreakDownFactory;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers.Interfaces;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.RoomAndBoard;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers;

/// <summary>
/// Maps ValidateAmendBookingResponse to variety of models
/// </summary>
public class ValidateBookingResponseMapper : IValidateBookingResponseMapper
{
    private readonly IPromoCodeBreakDownFactory _promoCodeBreakDownFactory;
    private readonly ISettingsService _settingsService;
    private readonly IHotelOfferService _hotelOfferService;
    private readonly IAmendmentChargesService _amendmentChargesService;
    private readonly IHotelThemeService _hotelThemeService;
    private readonly AtcomSettings _atcomSettings;

    /// <summary>
    /// ctor
    /// </summary>
    public ValidateBookingResponseMapper(
        IPromoCodeBreakDownFactory promoCodeBreakDownFacotry,
        ISettingsService settingsService,
        IHotelThemeService hotelThemeService,
        IHotelOfferService hotelOfferService,
        IAmendmentChargesService amendmentChargesService,
        IOptions<AtcomSettings> atcomSettings)
    {
        ArgumentNullException.ThrowIfNull(atcomSettings);
        ArgumentNullException.ThrowIfNull(atcomSettings.Value);

        _promoCodeBreakDownFactory = promoCodeBreakDownFacotry;
        _hotelThemeService = hotelThemeService;
        _settingsService = settingsService;
        _hotelOfferService = hotelOfferService;
        _amendmentChargesService = amendmentChargesService;
        _atcomSettings = atcomSettings.Value;
    }

    /// <inheritdoc />
    public async Task<AmendDatesOffer> MapToAmendDatesOffer(ValidateAmendBookingResponse validateAmendBookingResponse, BookingResponse bookingResponse,
        AmendDatesOffer requestOffer = null)
    {
        var settings = await _settingsService.GetSeatMapSettings();
        var result = await MapToAmendDatesOffer(validateAmendBookingResponse, bookingResponse);
        result.Offer = await _hotelOfferService.EnrichOfferWithCmsHotelData(result.Offer);

        if (requestOffer is not null)
        {
            result.AmendmentFlowCharges = validateAmendBookingResponse.PaymentInfo.TotalPrice - requestOffer.OfferPrice;
            result.Offer.Transport = requestOffer.Offer.Transport;
        }

        result.SeatsChangeEnabled = settings.EnableSeatMapDateChange;

        return result;
    }

    /// <inheritdoc />
    public AmendRoomVariant MapToRoomVariant(ValidateAmendBookingResponse validatedResponse, BookingResponse originalBooking, AmendRoomValidationRequest request)
    {
        var prices = CalculatePricesForRoomAmendment(validatedResponse, originalBooking, request);
        var amendmentPaymentInfo = _amendmentChargesService.CalculateAmendmentPaymentInfo(originalBooking, validatedResponse);

        var roomVariant = new AmendRoomVariant
        {
            Units = validatedResponse.Accom.Rooms,
            RoomType = validatedResponse.Accom.Rooms.First().Code,
            BoardType = validatedResponse.Accom.Rooms.First().Board,
            BookingPrice = originalBooking.PaymentInfo.TotalPrice,
            OfferPrice = prices.offerPrice,
            SeatsPrice = prices.seatsPrice,
            FullAmendmentCharges = prices.fullAmendmentsCharges,
            AmendmentCharges = prices.amendmentCharges,
            PromoCodeBreakDown = prices.promocodeBreakDown,
            AmendmentPaymentInfo = amendmentPaymentInfo,
            TaxesAndFees = validatedResponse.TaxesAndFees
        };

        return roomVariant;
    }

    /// <inheritdoc />
    public async Task<Offer> MapToOffer(ValidateAmendBookingResponse validateAmendBookingResponse)
    {
        var offer = new Offer
        {
            Accom = await MapBookingAccomToAccom(validateAmendBookingResponse),
            Transport = validateAmendBookingResponse.Transport,
            Transfers = validateAmendBookingResponse.Transfers,
            Date = ParseDateTime(validateAmendBookingResponse.Accom.StartDate),
            Price = validateAmendBookingResponse.PaymentInfo.BookingPriceEx,
            PricePP = validateAmendBookingResponse.PaymentInfo.BookingPriceEx / validateAmendBookingResponse.Guests?.Count ?? 1,
            Stay = CalculateDuration(validateAmendBookingResponse.Accom.StartDate, validateAmendBookingResponse.Accom.EndDate),
            SeatSelection = validateAmendBookingResponse.SeatSelection,
            Currency = validateAmendBookingResponse.Currency,
            ExtraLuggageInfo = validateAmendBookingResponse.ExtraLuggageInfo
        };

        return offer;
    }

    /// <inheritdoc />
    public async Task<AmendHotelOffer> MapToAmendmentHotelOffer(
        ValidateAmendBookingResponse validateAmendBookingResponse,
        BookingResponse bookingResponse,
        AmendHotelOffer requestAmendHotelOffer)
    {
        ArgumentNullException.ThrowIfNull(bookingResponse);
        ArgumentNullException.ThrowIfNull(validateAmendBookingResponse);

        var amendmentPaymentInfo = _amendmentChargesService.CalculateAmendmentPaymentInfo(bookingResponse, validateAmendBookingResponse);
        var prices = CalculatePrices(bookingResponse, validateAmendBookingResponse.PaymentInfo.TotalPrice);

        var result = new AmendHotelOffer
        {
            Accom = await MapBookingAccomToAccom(validateAmendBookingResponse),
            Transfers = validateAmendBookingResponse.Transfers,
            AmendmentChargesInfo = new AmendmentChargesInfo
            {
                AmendmentCharges = validateAmendBookingResponse.PaymentInfo.AmendmentCharges - (requestAmendHotelOffer?.AmendmentChargesInfo?.FullAmendmentCharges ?? 0),
                FullAmendmentCharges = validateAmendBookingResponse.PaymentInfo.AmendmentCharges,
                PromoCodeBreakDown = _promoCodeBreakDownFactory.Create(validateAmendBookingResponse, bookingResponse),
                OfferPrice = validateAmendBookingResponse.PaymentInfo.TotalPrice,
                BookingPrice = bookingResponse.PaymentInfo.TotalPrice,
                FullOfferPrice = prices.FullOfferPrice,
                SeatsPrice = prices.SeatsPrice,
                ExtraLuggagePrice = prices.ExtraLuggagePrice,
            },
            AmendmentPaymentInfo = amendmentPaymentInfo,
            TaxesAndFees = validateAmendBookingResponse.TaxesAndFees
        };

        return result;
    }

    /// <inheritdoc />
    public AmendTransferItem MapToAmendTransferItem(BookingResponse bookingResponse, TransferItem item, ValidateAmendBookingResponse amendBookingInfo)
    {
        var amendmentPaymentInfo = _amendmentChargesService.CalculateAmendmentPaymentInfo(bookingResponse, amendBookingInfo);

        return new AmendTransferItem()
        {
            Transfer = item,
            AmendmentCharges = amendBookingInfo?.PaymentInfo?.AmendmentCharges,
            Currency = amendBookingInfo?.Currency,
            PromoCodeBreakDown = _promoCodeBreakDownFactory.Create(amendBookingInfo, bookingResponse),
            AmendmentPaymentInfo = amendmentPaymentInfo
        };
    }

    /// <inheritdoc/>
    public (decimal SeatsPrice, decimal ExtraLuggagePrice, decimal DiscountAmount, decimal FullOfferPrice)
        CalculatePrices(BookingResponse booking, decimal offerPrice)
    {
        ArgumentNullException.ThrowIfNull(booking);

        var seatsPrice = booking.SeatSelection?.Sum(x => x.Seats?.Sum(y => y.Price)) ?? 0;
        var extraLuggagePrice = (decimal)(booking.ExtraLuggageInfo?.Items?.Where(x => !x.IsComplimentary).Sum(x => x.Price) ?? 0);
        var discountAmount = booking.PriceBreakdown?.Where(x => x.Code == _atcomSettings.PromotionsCodeName).Sum(x => x.Amount) ?? 0;
        var fullOfferPrice = offerPrice + extraLuggagePrice + seatsPrice + discountAmount;
        return (seatsPrice, extraLuggagePrice, discountAmount, fullOfferPrice);
    }

    private async Task<AmendDatesOffer> MapToAmendDatesOffer(ValidateAmendBookingResponse validateAmendBookingResponse, BookingResponse bookingResponse)
    {
        var responseOffer = await MapToOffer(validateAmendBookingResponse);
        var amendmentPaymentInfo = _amendmentChargesService.CalculateAmendmentPaymentInfo(bookingResponse, validateAmendBookingResponse);

        var result = new AmendDatesOffer
        {
            Offer = responseOffer,
            BookingRef = bookingResponse.BookingReference,
            BookingPrice = bookingResponse.PaymentInfo.TotalPrice,
            OfferPrice = validateAmendBookingResponse.PaymentInfo.TotalPrice,
            AmendmentDatesCharges = validateAmendBookingResponse.PaymentInfo.TotalPrice - bookingResponse.PaymentInfo.TotalPrice,
            PromoCodeBreakDown = _promoCodeBreakDownFactory.Create(validateAmendBookingResponse, bookingResponse),
            AllowPayBalanceDueDate = validateAmendBookingResponse.PaymentInfo.BalanceDueDate,
            MarketCode = bookingResponse.MarketCode,
            AmendmentPaymentInfo = amendmentPaymentInfo,
            TaxesAndFees = validateAmendBookingResponse.TaxesAndFees
        };

        return result;
    }

    private async Task<Accom> MapBookingAccomToAccom(ValidateAmendBookingResponse validateAmendBookingResponse)
    {
        var (theme, type) = await _hotelThemeService.GetTheme(validateAmendBookingResponse.Accom.Prom);

        var result = new Accom
        {
            Date = ParseDateTime(validateAmendBookingResponse.Accom.StartDate),
            Stay = CalculateDuration(validateAmendBookingResponse.Accom.StartDate, validateAmendBookingResponse.Accom.EndDate),
            Id = validateAmendBookingResponse.Accom.Id,
            Code = validateAmendBookingResponse.Accom.Code,
            Unit = validateAmendBookingResponse.Accom.Rooms,
            Prom = validateAmendBookingResponse.Accom.Prom,
            IsExternal = validateAmendBookingResponse.Accom.IsExt,
            Theme = theme,
            Type = type
        };

        return result;
    }

    private static byte CalculateDuration(string startDate, string endDate)
    {
        var startDateTime = DateFormatUtils.Parse(startDate);
        var endDateTime = DateFormatUtils.Parse(endDate);
        var result = (endDateTime - startDateTime).Days;

        return (byte)result;
    }

    private DateTime ParseDateTime(string bookingDate)
    {
        var date = DateTime.TryParse(bookingDate, CultureInfo.InvariantCulture, out var startDate)
            ? startDate
            : throw new ArgumentException(nameof(bookingDate));

        return date;
    }

    /// <summary>
    /// Calculate prices for amendment.
    /// If we don`t pass discount code in request we should not validate package with discount code.
    /// We subtract the seat prices from the offer for right promo code tier calculation.
    /// </summary>
    /// <param name="validatedResponse">Validate amend booking response.</param>
    /// <param name="originalBooking">Current booking.</param>
    /// <param name="request">Selected room variant</param>
    /// <returns>Amendment prices</returns>
    private (
        decimal offerPrice,
        decimal fullAmendmentsCharges,
        decimal amendmentCharges,
        PromoCodeBreakDown promocodeBreakDown,
        decimal seatsPrice
        ) CalculatePricesForRoomAmendment(ValidateAmendBookingResponse validatedResponse, BookingResponse originalBooking, AmendRoomValidationRequest request)
    {
        var seatsPrice = validatedResponse?.SeatSelection?.Sum(x => x?.Seats?.Sum(y => y.Price) ?? 0m) ?? 0m;
        var offerPrice = validatedResponse.PaymentInfo.TotalPrice;

        var fullAmendmentsCharges = validatedResponse.PaymentInfo.TotalPrice - originalBooking.PaymentInfo.TotalPrice;

        var amendmentCharges = validatedResponse.PaymentInfo.TotalPrice - request.SelectedRoomVariant.OfferPrice;

        var promocodeBreakDown = _promoCodeBreakDownFactory.Create(validatedResponse, originalBooking);

        return (offerPrice, fullAmendmentsCharges, amendmentCharges, promocodeBreakDown, seatsPrice);
    }
}

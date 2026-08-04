using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Utils;

namespace easyJet.Holidays.Api.Domain.Services.Offers;

public class OfferPriceService : IOfferPriceService
{
    private readonly IReferenceDataService _referenceDataService;

    public OfferPriceService(IReferenceDataService referenceDataService)
    {
        _referenceDataService = referenceDataService;
    }

    /// <inheritdoc />
    public decimal GetOfferPriceWithoutExtras(PriceInfo priceInfo, ValidateBookingResponse validateBookingResponse)
    {
        var totalPrice = priceInfo?.TotalPrice ?? 0m;

        if (SeatsUtils.HasSelectedSeats(validateBookingResponse?.SeatSelection))
        {
            totalPrice -= SeatsUtils.GetSeatsPrice(validateBookingResponse?.SeatSelection);
        }

        totalPrice -= LuggageUtils.GetLuggagePrice(validateBookingResponse?.ExtraLuggageInfo);
        totalPrice -= GetTransferSurcharge(validateBookingResponse);
        totalPrice -= GetAirportParkingPrice(validateBookingResponse?.AirportParking);

        return totalPrice;
    }

    /// <inheritdoc />
    public async Task<decimal> GetOfferPricePerPersonWithoutExtras(PriceInfo priceInfo, ValidateBookingResponse validateBookingResponse)
    {
        var totalPricePerPerson = priceInfo?.PricePP ?? 0m;

        if (SeatsUtils.HasSelectedSeats(validateBookingResponse?.SeatSelection))
        {
            totalPricePerPerson -= SeatsUtils.GetSeatsPricePerPerson(validateBookingResponse?.SeatSelection, validateBookingResponse?.Guests);
        }

        totalPricePerPerson -= LuggageUtils.GetLuggagePricePerPerson(validateBookingResponse?.ExtraLuggageInfo, validateBookingResponse?.Guests);

        totalPricePerPerson -= GetTransferSurcharge(validateBookingResponse) / Math.Max(1, GuestUtils.GetNonInfantsCount(validateBookingResponse?.Guests));

        totalPricePerPerson -= GetAirportParkingPrice(validateBookingResponse?.AirportParking) / Math.Max(1, GuestUtils.GetNonInfantsCount(validateBookingResponse?.Guests));

        return totalPricePerPerson;
    }

    /// <inheritdoc />
    public async Task<decimal> GetOfferPrice(ValidateBookingResponse validateBooking)
    {
        var offerPrice = validateBooking?.PaymentInfo?.TotalPrice ?? 0M;

        return await GetOfferPrice(offerPrice, validateBooking?.SeatSelection);
    }

    /// <inheritdoc />
    public async Task<decimal> GetOfferPricePerPerson(ValidateBookingResponse validateBooking)
    {
        var offerPricePerPerson = validateBooking?.PaymentInfo?.PricePP ?? 0M;

        return await GetOfferPricePerPerson(offerPricePerPerson, validateBooking?.SeatSelection, validateBooking?.Guests);
    }

    private async Task<decimal> GetOfferPrice(decimal offerPriceWithSeats, IList<SeatMap> seatSelection)
    {
        if (await IsSeatsCalculationIncluded())
        {
            return offerPriceWithSeats;
        }

        if (!SeatsUtils.HasSelectedSeats(seatSelection))
        {
            return offerPriceWithSeats;
        }

        return offerPriceWithSeats - SeatsUtils.GetSeatsPrice(seatSelection);
    }

    private async Task<decimal> GetOfferPricePerPerson(decimal offerPricePerPersonWithSeats, IList<SeatMap> seatSelection, IList<PersonWithDetails> guests)
    {
        if (await IsSeatsCalculationIncluded())
        {
            return offerPricePerPersonWithSeats;
        }

        if (!SeatsUtils.HasSelectedSeats(seatSelection))
        {
            return offerPricePerPersonWithSeats;
        }

        return offerPricePerPersonWithSeats - SeatsUtils.GetSeatsPricePerPerson(seatSelection, guests);
    }

    private async Task<bool> IsSeatsCalculationIncluded()
    {
        var promoCodeSettings = await _referenceDataService.GetPromoCodeSetting();

        return promoCodeSettings.IsPromoCodeEnabled && promoCodeSettings.IsSeatsCalculationIncluded;
    }

    private decimal GetTransferSurcharge(ValidateBookingResponse validateBookingResponse)
    {
        var sharedTransfer = validateBookingResponse?.Transfers?.FirstOrDefault(t => t.Type == TransferItemType.Shared);
        return (sharedTransfer?.SmallSeSurcharge ?? 0) * (sharedTransfer?.SmallSeSurchargeQuantity ?? 0) +
               (sharedTransfer?.LargeSeSurcharge ?? 0) * (sharedTransfer?.LargeSeSurchargeQuantity ?? 0);
    }

    private static decimal GetAirportParkingPrice(AirportParkingItem airportParkingItem)
    {
        return airportParkingItem?.BookingDetails?.TotalPrice ?? 0m;
    }
}
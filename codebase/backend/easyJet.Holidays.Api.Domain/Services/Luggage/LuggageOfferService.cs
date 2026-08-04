using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Utils;

namespace easyJet.Holidays.Api.Domain.Services.Luggage;

/// <inheritdoc />
public class LuggageOfferService : ILuggageOfferService
{
    private readonly ILuggageValidatorService _luggageValidator;
    private readonly ILuggageService _luggageService;

    /// <summary>
    /// Creates instance with all dependencies resolved
    /// </summary>
    public LuggageOfferService(
        ILuggageValidatorService luggageValidator,
        ILuggageService luggageService)
    {
        _luggageValidator = luggageValidator;
        _luggageService = luggageService;
    }

    /// <inheritdoc />
    public async Task EnrichOffersWithLuggage(IEnumerable<Offer> offers, AccommodationOfferRequest request)
    {
        if (offers is null)
            throw new ArgumentNullException(nameof(offers));
        if (request is null)
            throw new ArgumentNullException(nameof(request));

        foreach (var offer in offers)
        {
            // Argument validation, checking basic conditions to build luggage
            if (string.IsNullOrEmpty(offer.Accom.Prom))
                throw new ArgumentException("Accommodation promotion code not found", nameof(offer.Accom.Prom));
            if (offer.Transport.Routes.IsNullOrEmpty())
                throw new ArgumentException("Transport routes not found", nameof(offer.Transport.Routes));
            if (offer.BuildGuests().IsNullOrEmpty())
                throw new ArgumentException("Guests not found", nameof(request));

            offer.ExtraLuggageInfo ??= new ExtraLuggageInfo();
            offer.ExtraLuggageInfo.Items ??= new List<ExtraLuggageItem>();

            var complimentaryLuggage = await _luggageService.GetComplimentaryLuggage(offer);
            offer.ExtraLuggageInfo.Items.AddRange(complimentaryLuggage);

            var holdLuggage = await _luggageService.GetHoldLuggageOffer(offer, request);
            offer.ExtraLuggageInfo.Items.AddRange(holdLuggage);

            var lcbLuggage = await _luggageService.GetLargeCabinBagLuggageOffer(offer, request);
            offer.ExtraLuggageInfo.Items.AddRange(lcbLuggage);

            await _luggageValidator.ValidateAccommodationOffer(offer);
        }
    }

    /// <inheritdoc />
    public async Task EnrichOffersWithComplimentaryLuggage(IEnumerable<Offer> offers)
    {
        if (offers is null)
            throw new ArgumentNullException(nameof(offers));

        foreach (var offer in offers)
        {
            // Argument validation, checking basic conditions to build luggage
            if (string.IsNullOrEmpty(offer.Accom.Prom)
                || offer.Transport.Routes.IsNullOrEmpty()
                || offer.BuildGuests().IsNullOrEmpty())
                continue;

            var complimentaryLuggage = await _luggageService.GetComplimentaryLuggage(offer);

            offer.ExtraLuggageInfo ??= new ExtraLuggageInfo();
            offer.ExtraLuggageInfo.Items ??= new List<ExtraLuggageItem>();
            offer.ExtraLuggageInfo.Items.AddRange(complimentaryLuggage);
        }
    }
}
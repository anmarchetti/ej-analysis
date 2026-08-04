using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.Atcom.Services.TouristTax;

internal interface IRoomCalculator
{
    /// <summary>
    /// Calculates and updates the relevant offer details with tourist tax based on the provided rule
    /// and associated hotel information.
    /// </summary>
    /// <param name="offer">The offer object containing data for package and pricing details.</param>
    /// <param name="touristTaxRule">The tourist tax rule applicable for the calculation, containing the logic
    /// and parameters for the tax.</param>
    Task<OfferTax> Calculate(TouristTaxOffer offer, TouristTaxRule touristTaxRule);
}

internal sealed class RoomBased : CalculatorBase, IRoomCalculator
{
    // Number of room  * Charge for hotel OR  Cap  
    // infants do not pay tax
    private readonly ILogger<RoomBased> _logger;

#pragma warning disable S6672
    public RoomBased(ILogger<RoomBased> logger, ILogger<CalculatorBase> baseLogger, IErrorBasedCalculator errorCalculator,
        ITouristTaxRepository  touristTaxRepository) : base(baseLogger, errorCalculator, touristTaxRepository)
#pragma warning restore S6672
    {
        ArgumentNullException.ThrowIfNull(logger);

        _logger = logger;
    }

    public async Task<OfferTax> Calculate(TouristTaxOffer offer, TouristTaxRule touristTaxRule)
    {
        var chargeColumnName = $"RoomRate{offer.StarRating}Star";
        var chargePerRoom = GetPropertyValue(touristTaxRule, chargeColumnName);

        if (!chargePerRoom.HasValue || string.IsNullOrEmpty(touristTaxRule.PerNightOrPerStay))
        {
            _logger.LogError("Parameters required for {Calculator} calculation not present in config file for geography {Geography}", nameof(RoomBased), offer.Geography);
            return _errorBasedCalculator.Calculate(offer.OfferId);
        }


        var duration = offer.Duration;
        if (touristTaxRule.MaximumNightsCap.HasValue && offer.Duration > touristTaxRule.MaximumNightsCap)
        {
            duration = touristTaxRule.MaximumNightsCap.Value;
        }

        if (touristTaxRule.PerNightOrPerStay != PerStay && touristTaxRule.PerNightOrPerStay != PerNight)
        {
            _logger.LogError("Invalid PerNightOrPerStay value '{Value}' for {Calculator} in geography {Geography}. Expected 'PS' or 'PN'", touristTaxRule.PerNightOrPerStay, nameof(RoomBased), offer.Geography);
            return _errorBasedCalculator.Calculate(offer.OfferId);
        }

        var numberOfOccupants = offer.AdultPaxes.Count + offer.ChildPaxes.Count;
        var totalTaxLocal = offer.NumberOfRooms * chargePerRoom.Value;

        if(touristTaxRule.PerNightOrPerStay == PerNight)
        {
            totalTaxLocal *= duration;
        }

        var offerTax = new OfferTax(offer.OfferId);

        var error = await HydrateExchangeRateInfo(offerTax, touristTaxRule.Currency);

        if(error is not null && error.Currency == "err")
        {
            return error;
        }

        offerTax.TouristTaxLocal = Round2(totalTaxLocal);

        ApplyCapToLocalTax(touristTaxRule, offerTax);
        
        offerTax.TouristTax = Round2(offerTax.TouristTaxLocal / offerTax.ExchangeRate);
        offerTax.TouristTaxPP = GetTouristTaxPerPerson(offerTax.TouristTax, numberOfOccupants);
        offerTax.TouristTaxPPLocal = GetTouristTaxPerPerson(offerTax.TouristTaxLocal, numberOfOccupants);

        var isError = ValidateOrError(totalTaxLocal, offer.OfferId);

        if(isError is not null)
        {
            return isError;
        }

        return offerTax;
    }
}

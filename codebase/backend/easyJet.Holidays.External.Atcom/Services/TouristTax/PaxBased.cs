using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.Atcom.Services.TouristTax;

internal interface IPaxCalculator
{
    /// <summary>
    /// Calculates and returns taxes for the offer based on the provided rule
    /// and associated hotel information.
    /// </summary>
    /// <param name="offer">The offer object containing data for package and pricing details.</param>
    /// <param name="touristTaxRule">The tourist tax rule applicable for the calculation, containing the logic and parameters for the tax.</param>
    /// <returns>An OfferTax object containing the calculated tax details for the offer.</returns>
    Task<OfferTax> Calculate(TouristTaxOffer offer, TouristTaxRule touristTaxRule);
}

internal sealed class PaxBased : CalculatorBase, IPaxCalculator
{
    private readonly ILogger<PaxBased> _logger;

#pragma warning disable S6672
    public PaxBased(ILogger<PaxBased> logger, ILogger<CalculatorBase> baseLogger, IErrorBasedCalculator errorCalculator, ITouristTaxRepository touristTaxRepository) : base(baseLogger, errorCalculator, touristTaxRepository)
#pragma warning restore S6672
    {
        ArgumentNullException.ThrowIfNull(logger);

        _logger = logger;
    }

    public async Task<OfferTax> Calculate(TouristTaxOffer offer, TouristTaxRule touristTaxRule)
    {
        var adultChargeColumnName = $"PaxRateAdult{offer.StarRating}Star";
        var childChargeColumnName = $"PaxRateChild{offer.StarRating}Star";
        var childAgeInclusiveColumnName = $"ChildAgeInclusive";
        var adultCharge = GetPropertyValue(touristTaxRule, adultChargeColumnName);
        var childCharge = GetPropertyValue(touristTaxRule, childChargeColumnName);
        var childAgeInclusive = GetPropertyValue(touristTaxRule, childAgeInclusiveColumnName);

        if (!adultCharge.HasValue || !childCharge.HasValue || string.IsNullOrEmpty(touristTaxRule.PerNightOrPerStay))
        {
            _logger.LogError("Parameters required for {Calculator} calculation not present in config file for geography {Geography}", nameof(PaxBased), offer.Geography);
            return _errorBasedCalculator.Calculate(offer.OfferId);
        }

        var duration = offer.Duration;
        if (touristTaxRule.MaximumNightsCap.HasValue && offer.Duration > touristTaxRule.MaximumNightsCap)
        {
            duration = touristTaxRule.MaximumNightsCap.Value;
        }

        if (touristTaxRule.PerNightOrPerStay != PerStay && touristTaxRule.PerNightOrPerStay != PerNight)
        {
            _logger.LogError("Invalid PerNightOrPerStay value '{Value}' for {Calculator} in geography {Geography}. Expected 'PS' or 'PN'", touristTaxRule.PerNightOrPerStay, nameof(PaxBased), offer.Geography);
            return _errorBasedCalculator.Calculate(offer.OfferId);
        }

        var totalLocalTouristTax = CalculateTouristTax(offer, touristTaxRule, adultCharge.Value, childCharge.Value, duration, childAgeInclusive);

        var offerTax = new OfferTax(offer.OfferId);

        var error = await HydrateExchangeRateInfo(offerTax, touristTaxRule.Currency);

        if (error is not null && error.Currency == "err")
        {
            return error;
        }

        offerTax.TouristTaxLocal = Round2(totalLocalTouristTax);

        ApplyCapToLocalTax(touristTaxRule, offerTax);

        offerTax.TouristTax = Round2(offerTax.TouristTaxLocal / offerTax.ExchangeRate);
        offerTax.TouristTaxPP = GetTouristTaxPerPerson(offerTax.TouristTax, offer.AdultPaxes.Count + offer.ChildPaxes.Count);
        offerTax.TouristTaxPPLocal = GetTouristTaxPerPerson(offerTax.TouristTaxLocal, offer.AdultPaxes.Count + offer.ChildPaxes.Count);

        var isError = ValidateOrError(totalLocalTouristTax, offer.OfferId);

        if (isError is not null)
        {
            return isError;
        }

        return offerTax;
    }

    private static decimal CalculateTouristTax(TouristTaxOffer offer, TouristTaxRule touristTaxRule, decimal adultCharge, decimal childCharge, int duration, decimal? childAgeInclusive)
    {
        var totalLocalTouristTax = 0m;

        int numberOfAdults = offer.AdultPaxes.Count, numberOfChildren = offer.ChildPaxes.Count;

        if (childAgeInclusive.HasValue)
        {
            numberOfAdults = offer.AdultPaxes.Count + offer.ChildPaxes.Count(cp => cp.Age.HasValue && cp.Age.Value > childAgeInclusive.Value);
            numberOfChildren = offer.ChildPaxes.Count(cp => !cp.Age.HasValue || cp.Age.Value <= childAgeInclusive.Value);
        }
        
        if (touristTaxRule.PerNightOrPerStay == PerStay)
        {
            totalLocalTouristTax = (numberOfAdults * adultCharge) + (numberOfChildren * childCharge);
        }
        if (touristTaxRule.PerNightOrPerStay == PerNight)
        {
            totalLocalTouristTax = (numberOfAdults * adultCharge * duration) + (numberOfChildren * childCharge * duration);
        }

        return totalLocalTouristTax;
    }
}

using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.Atcom.Services.TouristTax;

internal interface IPercentageCalculator
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

internal sealed class PercentageBased : CalculatorBase, IPercentageCalculator
{
    // Accomodation Amount  * Percentage Rate  OR  Cap  
    private readonly ILogger<PercentageBased> _logger;

#pragma warning disable S6672
    public PercentageBased(ILogger<PercentageBased> logger, ILogger<CalculatorBase> baseLogger, IErrorBasedCalculator errorCalculator, ITouristTaxRepository touristTaxRepository) : 
        base(baseLogger, errorCalculator, touristTaxRepository)
#pragma warning restore S6672
    {
        _logger = logger;
    }

    public async Task<OfferTax> Calculate(TouristTaxOffer offer, TouristTaxRule touristTaxRule)
    {
        var chargeColumnName = $"PercentageRate{offer.StarRating}Star";
        var percentageRate = GetPropertyValue(touristTaxRule, chargeColumnName);

        if(!percentageRate.HasValue)
        {
            _logger.LogError("Parameters required for {Calculator} calculation not present in config file for geography {Geography}", nameof(PercentageBased), offer.Geography);
            return _errorBasedCalculator.Calculate(offer.OfferId);
        }
        var offerTax = new OfferTax(offer.OfferId);

        var error = await HydrateExchangeRateInfo(offerTax, touristTaxRule.Currency);

        if (error is not null && error.Currency == "err")
        {
            return error;
        }

        offerTax.TouristTaxLocal = Round2((offer.AccommodationAmount * offerTax.ExchangeRate) * (percentageRate.Value / 100));

        ApplyCapToLocalTax(touristTaxRule, offerTax);
        offerTax.TouristTax = Round2(offerTax.TouristTaxLocal / offerTax.ExchangeRate);
        offerTax.TouristTaxPP = GetTouristTaxPerPerson(offerTax.TouristTax, offer.AdultPaxes.Count + offer.ChildPaxes.Count);
        offerTax.TouristTaxPPLocal= GetTouristTaxPerPerson(offerTax.TouristTaxLocal, offer.AdultPaxes.Count + offer.ChildPaxes.Count);

        var isError = ValidateOrError(offerTax.TouristTax, offer.OfferId);

        if (isError is not null)
        {
            return isError;
        }

        return offerTax;
    }
}
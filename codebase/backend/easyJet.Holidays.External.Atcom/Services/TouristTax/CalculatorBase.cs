using Microsoft.Extensions.Logging;
using System.Globalization;
using System.Reflection;

namespace easyJet.Holidays.External.Atcom.Services.TouristTax;

internal abstract class CalculatorBase
{
    private readonly ILogger<CalculatorBase> _logger;
    protected readonly IErrorBasedCalculator _errorBasedCalculator;
    private readonly ITouristTaxRepository _touristTaxRepository;
    protected const string PerNight = "PN";
    protected const string PerStay = "PS";


    protected CalculatorBase(ILogger<CalculatorBase> logger, IErrorBasedCalculator errorCalculator, ITouristTaxRepository touristTaxRepository)
    {
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(errorCalculator);
        ArgumentNullException.ThrowIfNull(touristTaxRepository);

        _logger = logger;
        _errorBasedCalculator = errorCalculator;
        _touristTaxRepository = touristTaxRepository;
    }

    protected static decimal? GetPropertyValue(TouristTaxRule rule, string propertyName)
    {
        var prop = typeof(TouristTaxRule).GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);
        if (prop == null)
        {
            return null;
        }

        var value = prop.GetValue(rule);
        if (value is decimal d)
            return d;
        if(decimal.TryParse(value?.ToString(), NumberStyles.Number, CultureInfo.InvariantCulture, out var result))
            return result;
        return null;
    }

    protected OfferTax ValidateOrError(decimal touristTax, string offerId)
    {
        if (touristTax < 0)
        {
            _logger.LogError("Tourist tax is less than zero {TouristTax}", touristTax);
            return _errorBasedCalculator.Calculate(offerId);
        }
        return null;
    }

    protected virtual decimal GetTouristTaxPerPerson(decimal totalTax, int totalPaxes) =>
        totalPaxes > 0 ? Round2(totalTax / totalPaxes) : totalTax;

    protected async virtual Task<OfferTax> HydrateExchangeRateInfo(OfferTax offerTax, string ruleCurrency)
    {
        var rates = await _touristTaxRepository.GetExchangeRates();
        var match = rates.FirstOrDefault(r => string.Equals(r.HotelCurrency, ruleCurrency, StringComparison.OrdinalIgnoreCase));

        if (match is null)
        {
            _logger.LogError("No exchange rate found for currency {Currency}", ruleCurrency);
            return _errorBasedCalculator.Calculate(offerTax.OfferId);
        }

        offerTax.ExchangeRate = match.ExchangeRate;
        offerTax.Currency = match.HotelCurrency;
        return offerTax;
    }

    protected static decimal Round2(decimal value) =>
        Math.Round(value, 2, MidpointRounding.AwayFromZero);

    protected static void ApplyCapToLocalTax(TouristTaxRule rule, OfferTax offerTax)
    {
        if (rule.MaximumValueCap.HasValue)
        {
            offerTax.TouristTaxLocal = offerTax.TouristTaxLocal > rule.MaximumValueCap.Value ? rule.MaximumValueCap.Value : offerTax.TouristTaxLocal;
        }
        if (rule.MinimumValueCap.HasValue)
        {
            offerTax.TouristTaxLocal = offerTax.TouristTaxLocal < rule.MinimumValueCap.Value ? rule.MinimumValueCap.Value : offerTax.TouristTaxLocal;
        }
    }
}

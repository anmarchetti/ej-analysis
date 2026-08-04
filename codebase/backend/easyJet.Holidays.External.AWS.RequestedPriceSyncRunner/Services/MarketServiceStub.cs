using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Market;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Services;

/// <summary>  
/// Stub implementation of the IMarketService interface.  
/// </summary>
[ExcludeFromCodeCoverage]
public class MarketServiceStub : IMarketService
{
    /// <inheritdoc/>
    public string GetCurrencyFromMarketCode(string marketCode)
    {
        throw new NotImplementedException();
    }

    /// <inheritdoc/>
    public MarketSettings GetCurrentMarket()
    {
        throw new NotImplementedException();
    }

    /// <inheritdoc/>
    public MarketSettings GetMarket(string marketCode)
    {
        throw new NotImplementedException();
    }

    /// <inheritdoc/>
    public MarketSettings GetMarketByLanguageCode(string languageCode)
    {
        throw new NotImplementedException();
    }

    /// <inheritdoc/> 
    public bool IsValidCurrency(string currencyCode)
    {
        throw new NotImplementedException();
    }
}

using System.Collections.ObjectModel;

namespace easyJet.Holidays.External.Atcom.Services.TouristTax;

/// <summary>
/// Tourist tax response model
/// </summary>
/// <param name="OfferId">The unique identifier for the offer associated with the tourist tax calculation.</param>
public sealed record OfferTax(string OfferId)
{
    /// <summary>
    /// The total tourist tax amount.
    /// </summary>
    public decimal TouristTax { get; set; }

    /// <summary>
    /// The tourist tax per person.
    /// </summary>
    public decimal TouristTaxPP { get; set; }

    /// <summary>
    /// The total tourist tax amount in local currency.
    /// </summary>
    public decimal TouristTaxLocal { get; set; }

    /// <summary>
    /// The tourist tax per person in local currency.
    /// </summary>
    public decimal TouristTaxPPLocal { get; set; }

    /// <summary>
    /// The exchange rate used for currency conversion.
    /// </summary>
    public decimal ExchangeRate { get; set; }

    /// <summary>
    /// Gets or sets the ISO currency code.
    /// </summary>
    public string Currency { get; set; }
}

/// <summary>
/// Represents the response containing tourist tax information for one or more offers.
/// </summary>
/// <param name="OfferTaxes">A read-only collection of offer tax details included in the response. Cannot be null.</param>
public sealed record TouristTaxResponse(ReadOnlyCollection<OfferTax> OfferTaxes);

using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using System.Data;
using System.Globalization;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.Atcom.Models.Internal.Search;

public partial class AvCacheResultOffersOffer
{
    public string GiataCode { get; set; }
    public List<AlternativeAccommodation> AlternativeAccommodations { get; set; }
    public List<Board> AllBoards { get; set; }

    /// <summary>
    /// Gets or sets the tourist tax amount.
    /// </summary>
    public decimal TouristTax { get; set; }

    /// <summary>
    /// Gets or sets the tourist tax amount per person.
    /// </summary>
    public decimal TouristTaxPP { get; set; }

    /// <summary>
    /// The tourist tax amount in local currency
    /// </summary>
    public decimal TouristTaxLocal { get; set; }

    /// <summary>
    /// Gets the amount of local tourist tax per person.
    /// </summary>
    public decimal TouristTaxPPLocal { get; set; }

    /// <summary>
    /// Gets or sets the exchange rate used for currency conversion operations.
    /// </summary>
    public decimal ExchangeRate { get; set; }

    /// <summary>
    /// Gets the currency of local tourist tax per person.
    /// </summary>
    public string TouristTaxCurrency { get; set; }

    /// <summary>
    /// Offer Price Excluding Taxes and Fees
    /// </summary>
    public decimal? PriceExcludingTouristTax { get; set; }

    /// <summary>
    /// Offer Price Excluding Taxes and Fees
    /// </summary>
    public decimal? PricePPExcludingTouristTax { get; set; }

    /// <summary>
    /// Dictionary of taxes and fees
    /// </summary>
    public IReadOnlyDictionary<string, TaxesAndFeesSummary> TaxesAndFees => Accom?
        .SelectMany(accommodation => accommodation?.Unit ?? [])
        .Where(unit => unit is not null && unit.PriceDetail is not null && unit.PriceDetail.PriceElement is not null && unit.PriceDetail.PriceElement.Length > 0)
        .SelectMany(unit => unit.PriceDetail.PriceElement)
        .Where(priceElement => priceElement.PriceCur is not null)
        .GroupBy(priceElement => priceElement.PriceCur)
        .ToDictionary(
            group => group.Key,
            group =>
            {
                var totalLocalPrice = group.Sum(priceElement => priceElement.PricePP * priceElement.Qty);
                var payingCustomersCount = AvCacheResultOffersOfferExtendedHelpers.PayingCustomersCount(this);

                return new TaxesAndFeesSummary
                {
                    TotalLocalPrice = totalLocalPrice,
                    TotalLocalPricePP = payingCustomersCount > 0 ?
                        Math.Round(totalLocalPrice / payingCustomersCount, 2, MidpointRounding.AwayFromZero) :
                        group.Sum(priceElement => priceElement.PricePP),
                    ExchRt = group.Select(priceElement => priceElement.ExchRt).FirstOrDefault(),
                    Currency = group.Select(priceElement => priceElement.PriceCur).FirstOrDefault()
                };
            })
        ?? [];
}

/// <summary>
/// Taxes and fees summary
/// </summary>
public sealed class TaxesAndFeesSummary
{
    /// <summary>
    /// Total Local Prioce PP
    /// </summary>
    public decimal TotalLocalPricePP { get; init; }

    /// <summary>
    /// Exchange rate used
    /// </summary>
    public decimal ExchRt { get; init; }

    /// <summary>
    /// The local currency
    /// </summary>
    public string Currency { get; internal set; }

    /// <summary>
    /// Total local taxes and fees
    /// </summary>
    public decimal TotalLocalPrice { get; internal set; }
}

public partial class AvCacheResultOffersOfferAccomUnit
{
    public string RequireBoardAlteration { get; set; }
}

public partial class AvCacheResultOffersOfferBoard
{
    public string AccommodationId { get; set; }

    public string PackageId { get; set; }

    public string System { get; set; }

    public bool IsExternal { get; set; }
}

public class AlternativeAccommodation
{
    public string Code { get; set; }
    public string PackageId { get; set; }
}

public record Board
{
    public string Code { get; init; }
    public decimal Price { get; init; }
}
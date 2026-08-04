using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Promotion;
using easyJet.Holidays.Api.Domain.Data.Settings;
using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.LivePrice
{
    public class GeogPricesModel
    {
        public IEnumerable<LivePriceSummaryModel> Summaries { get; set; }
        public IEnumerable<LivePriceModel> NamedSearchPrices { get; set; }
    }

    /// <summary>
    /// Base class for LivePriceModels
    /// </summary>
    public class LivePriceModelBase
    {
        /// <summary>
        /// Package Id
        /// </summary>
        public string PackageId { get; set; }

        /// <summary>
        /// Outbound airport
        /// </summary>
        public string OutboundAirport { get; set; }

        /// <summary>
        /// Inbound airport
        /// </summary>
        public string InboundAirport { get; set; }

        /// <summary>
        /// Outbound flight id
        /// </summary>
        public string OutboundRouteId { get; set; }

        /// <summary>
        /// Inbound flight id
        /// </summary>
        public string InboundRouteId { get; set; }

        /// <summary>
        /// Unit code
        /// </summary>
        public string UnitCode { get; set; }

        /// <summary>
        /// Board code
        /// </summary>
        public string BoardCode { get; set; }

        /// <summary>
        /// Geography code
        /// </summary>
        public string Geog { get; set; }

        /// <summary>
        /// Search criteria
        /// </summary>
        public SearchCriteria SearchCriteria { get; set; }

        /// <summary>
        /// Total price
        /// </summary>
        public decimal Price { get; set; }

        /// <summary>
        /// Gets or sets the amount of tourist tax to be applied.
        /// </summary>
        public decimal TouristTax { get; set; } = 0;

        /// <summary>
        /// Price per person
        /// </summary>
        public decimal PricePP { get; set; }

        /// <summary>
        /// Gets or sets the tourist tax amount per person.
        /// </summary>
        public decimal TouristTaxPP { get; set; } = 0;

        /// <summary>
        /// Currency
        /// </summary>
        public string Currency { get; set; }

        /// <summary>
        /// Price excluding tourist tax
        /// </summary>
        public decimal PriceExcludingTouristTax { get; set; } = 0;
        
        /// <summary>
        /// 
        /// </summary>
        public decimal PricePPExcludingTouristTax { get; set; } = 0;

        /// <summary>
        /// Gets or sets the taxes and fees associated with the offer
        /// </summary>
        public IReadOnlyDictionary<string, TaxesAndFeesSummary> TaxesAndFees { get; set; }

        /// <summary>
        /// Market
        /// </summary>
        public string Market { get; set; }

        /// <summary>
        /// Language
        /// </summary>
        public string Language { get; set; }

        /// <summary>
        /// Accomodation code
        /// </summary>
        public string AccomCode { get; set; }

        /// <summary>
        /// Search date
        /// </summary>
        public DateTimeOffset SearchDate { get; set; }

        /// <summary>
        /// List of transfers
        /// </summary>
        public IList<TransferItem> Transfers { get; set; }

        /// <summary>
        /// Promotion Collections
        /// </summary>
        [JsonProperty(PropertyName = "promoCollections")]
        public IList<string> PromotionCollections { get; init; }

        /// <summary>
        /// Promotion for offer
        /// </summary>
        public string Prom { get; set; }
    }

    /// <summary>
    /// Live price model
    /// </summary>
    public class LivePriceModel : LivePriceModelBase
    {
        /// <summary>
        /// ExtraLuggageInfo for this offer
        /// </summary>
        public ExtraLuggageInfo ExtraLuggageInfo { get; set; }
    }


    /// <summary>
    /// Live price summary model
    /// </summary>
    public class LivePriceSummaryModel : LivePriceModel
    {
        /// <summary>
        /// Price values for each search criteria in summary
        /// </summary>
        public Dictionary<string, decimal> NamedSearches { get; set; }

        /// <summary>
        /// Info about promotion
        /// </summary>
        public SinglePromotionInfo Promotion { get; set; }
    }

    public class SearchCriteria : NamedSearch
    {
        /// <summary>
        /// Dates range
        /// </summary>
        public DateRange Range { get; set; }
        public DateTimeOffset? Date { get; set; }

        /// <summary>
        /// Departure airport
        /// </summary>
        public string DepPt { get; set; }

        /// <summary>
        /// Build clone with specified search date range
        /// </summary>
        /// <param name="source">Source named search</param>
        /// <param name="range"></param>
        /// <param name="Date">Offer date</param>
        /// <param name="DepPt">Departure airport code</param>
        /// <returns></returns>
        public static SearchCriteria WithOfferDetails(NamedSearch source, DateRange range, DateTimeOffset? Date, string DepPt)
        {
            return new SearchCriteria
            {
                Name = source.Name,
                Language = source.Language,
                Adults = source.Adults,
                Children = source.Children,
                Infants = source.Infants,
                ChildAges = source.ChildAges,
                Duration = source.Duration,
                ThemeTypesCodes = source.ThemeTypesCodes,

                Range = range,
                Date = Date,
                DepPt = DepPt
            };
        }
    }
}

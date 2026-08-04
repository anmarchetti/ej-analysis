using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Promotion;
using easyJet.Holidays.Api.Domain.Data.Settings;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.RequestedPrice
{
    public class PricesModel
    {
        public RequestedPriceSummaryModel Summary { get; set; }
        public List<RequestedPriceModel> NamedSearchPrices { get; set; }
    }

    public class RequestedPriceModelBase
    {
        public string Geog { get; set; }
        public SearchCriteria SearchCriteria { get; set; }
        public Dictionary<RequestedPriceMathFunctionType, RequestedPriceByMathFunctions> RequestedPriceByMathFunctions { get; set; }
        public DateTimeOffset SearchDate { get; set; }
        public string Currency { get; set; }

        /// <summary>
        /// in format MarketCode|Lang UK|en or CH|fr-CH
        /// </summary>
        public string MarketCodeAndLanguage { get; set; }
        public List<TransferItem> Transfers { get; set; }
    }

    public class RequestedPriceByMathFunctions
    {
        public decimal Price { get; set; }
        public decimal PricePP { get; set; }

        /// <summary>
        /// Gets or sets the amount of tourist tax to be applied (in converted currency).
        /// </summary>
        public decimal TouristTax { get; set; } = 0;

        /// <summary>
        /// Gets or sets the tourist tax amount per person (in converted currency).
        /// </summary>
        public decimal TouristTaxPP { get; set; } = 0;
    }

    public class RequestedPriceModel : RequestedPriceModelBase
    {
    }

    public class RequestedPriceSummaryModel : RequestedPriceModel
    {
        public Dictionary<string, decimal> NamedSearches { get; set; }
        public SinglePromotionInfo Promotion { get; set; }
    }

    public class SearchCriteria : RequestedPriceNamedSearch
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
        public static SearchCriteria WithOfferDetails(RequestedPriceNamedSearch source, DateRange range, DateTimeOffset? Date, string DepPt)
        {
            return new SearchCriteria
            {
                Id = source.Id,
                Adults = source.Adults,
                Children = source.Children,
                Infants = source.Infants,
                ChildAges = source.ChildAges,
                Duration = source.Duration,
                ThemeTypesCodes = source.ThemeTypesCodes,
                Destinations = source.Destinations,
                Origin = source.Origin,
                StartDate = source.StartDate,
                EndDate = source.EndDate,
                Url = source.Url,
                StarRating = source.StarRating,
                BoardTypes = source.BoardTypes,
                DiscountAmountMax = source.DiscountAmountMax,
                DiscountAmountMin = source.DiscountAmountMin,
                TripAdvisorRating = source.TripAdvisorRating,
                DiscountOnly = source.DiscountOnly,
                DiscountPercentsMax = source.DiscountPercentsMax,
                DiscountPercentsMin = source.DiscountPercentsMin,
                FacilityTypes = source.FacilityTypes,
                IsFlexibleDatesRange = source.IsFlexibleDatesRange,
                MaxPPPrice = source.MaxPPPrice,
                MaxTotalPrice = source.MaxTotalPrice,
                MinPPPrice = source.MinPPPrice,
                MinTotalPrice = source.MinTotalPrice,
                FreeForKidsOnly = source.FreeForKidsOnly,
                Range = range,
                Date = Date,
                DepPt = DepPt,
                PromoCollections = source.PromoCollections
            };
        }
    }

    public enum RequestedPriceMathFunctionType
    {
        [EnumMember(Value = "cheapest")]
        Cheapest = 0,

        [EnumMember(Value = "average")]
        Average = 1,

        [EnumMember(Value = "highestinlowerquartile")]
        HighestInLowerQuartile = 2,

        [EnumMember(Value = "averageinlowerquartile")]
        AverageInLowerQuartile = 3,

        [EnumMember(Value = "medium")]
        Medium = 4,

        [EnumMember(Value = "mostexpensive")]
        MostExpensive = 5
    }
}

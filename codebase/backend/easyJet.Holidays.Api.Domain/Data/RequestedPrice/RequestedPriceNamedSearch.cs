namespace easyJet.Holidays.Api.Domain.Data.RequestedPrice
{
    public class RequestedPriceNamedSearch
    {
        public string Id { get; set; }
        public int Adults { get; set; }
        public int Children { get; set; }
        public int Infants { get; set; }
        public int Duration { get; set; }
        public IEnumerable<string> ChildAges { get; set; }
        public IEnumerable<string> ThemeTypesCodes { get; set; }
        public IEnumerable<string> Origin { get; set; }
        public IEnumerable<string> Destinations { get; set; }
        public IEnumerable<string> AccomCodes { get; set; }
        public string Url { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int InitialSearchDays { get; set; }
        public IEnumerable<string> BoardTypes { get; set; }
        public IEnumerable<string> FacilityTypes { get; set; }
        public IEnumerable<string> StarRating { get; set; }
        public double TripAdvisorRating { get; set; }
        public string Currency { get; set; }
        public string MarketCode { get; set; }
        public string MarketLanguage { get; set; }
        public decimal MinPPPrice { get; set; }
        public decimal MaxPPPrice { get; set; }
        public decimal MinTotalPrice { get; set; }
        public decimal MaxTotalPrice { get; set; }
        public decimal DiscountPercentsMin { get; set; }
        public decimal DiscountPercentsMax { get; set; }
        public decimal DiscountAmountMin { get; set; }
        public decimal DiscountAmountMax { get; set; }
        public bool DiscountOnly { get; set; }
        public bool IsFlexibleDatesRange { get; set; }
        public bool FreeForKidsOnly { get; set; }

        /// <summary>
        /// Gets the market code and language in the format "MarketCode|MarketLanguage".
        /// </summary>
        public string MarketCodeAndLanguage => $"{MarketCode}|{MarketLanguage}";
        
        /// <summary>
        /// Gets or sets the promo collections.
        /// </summary>
        public IEnumerable<string> PromoCollections { get; set; }

        public override bool Equals(object obj)
        {
            return obj is RequestedPriceNamedSearch search &&
                   Id == search.Id && MarketCode == search.MarketCode;
        }

        public override int GetHashCode()
        {
            return 2108858624 + EqualityComparer<string>.Default.GetHashCode(Id);
        }
    }
}

using easyJet.Holidays.Api.Domain.Utils;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers
{
    /// <summary>
    /// Search for offers request
    /// </summary>
    public class PackagesSearchRequest : BaseSearchRequest, IValidatableObject
    {
        /// <summary>
        /// End date. If it's specified search uses date range from start to end and ignores flexible/duration property
        /// </summary>
        public string EndDate { get; set; }

        /// <summary>
        /// Whether get only offers with DIstressed flights
        /// </summary>
        public bool? DistressedFlightsOnly { get; set; }

        /// <summary>
        /// This field allows a search based on geography instead of by sending a candidate list of accommodation codes.
        /// 
        /// There are three levels of geography:
        /// - Country eg.CA
        /// - Location eg. LAX
        /// - Resort eg.LAXLA
        /// 
        /// Only a single code of each geographic  level can be defined, and if using a  Location or Resort code the 'higher' level code must also be defined
        /// eg. if doing a  search for Location LAX the country code US must also be defined ie. <code>geog=US,LAX</code>
        /// </summary>        
        public string Geography { get; set; }

        /// <summary>
        /// This field indicates initial geography search based without applied filters
        /// 
        /// There are three levels of geography:
        /// - Country eg.CA
        /// - Location eg. LAX
        /// - Resort eg.LAXLA
        /// 
        /// Only a single code of each geographic  level can be defined, and if using a  Location or Resort code the 'higher' level code must also be defined
        /// eg. if doing a  search for Location LAX the country code US must also be defined ie. <code>geog=US,LAX</code>
        /// </summary>        
        public string OriginalGeography { get; set; }

        /// <summary>
        /// Used only by SmartSeer to send Virtual Region codes instead of normal ones if user selec
        /// </summary>
        public string[] Destinations { get; set; }

        /// <summary>
        /// Comma separated list of Accommodation codes. This field shouldn't be used if doing a geography-based search.
        /// Geography value will be ignored if AccomCodes is specified.
        /// </summary>
        public string AccomCodes { get; set; }

        /// <summary>
        /// This allows a search within a geographic area bounded by a set of decimal coordinates.
        /// poly=lat_1,long_1|lat_2,long_2|…lat_n,long_n (n > 3)
        /// When polygon is provided geography will be ignored
        /// </summary>
        public string Polygon { get; set; }

        /// <summary>
        /// which page of pagination are we showing
        /// </summary>
        public int Page { get; set; }

        /// <summary>
        /// number of items to take for pagination
        /// </summary>
        public byte Take { get; set; }

        /// <summary>
        /// Field to Order By
        /// </summary>
        public OrderByField OrderBy { get; set; }

        /// <summary>
        /// order by direction
        /// </summary>
        public OrderByDirection OrderDirection { get; set; }

        /// <summary>
        /// Whether automatic room allocation should be used for guests in first room. Other rooms will be ignored
        /// </summary>        
        public bool AutomaticAllocation { get; set; }

        /// <summary>
        /// Outbound flight id
        /// </summary>
        public string OutboundRouteId { get; set; }

        /// <summary>
        /// Outbound flight number
        /// </summary>
        public string OutboundFlightNumber { get; set; }

        /// <summary>
        /// Inbound flight id
        /// </summary>
        public string InboundRouteId { get; set; }

        /// <summary>
        /// Inbound flight number
        /// </summary>
        public string InboundFlightNumber { get; set; }

        /// <summary>
        /// Minimum discount ammount
        /// </summary>
        public decimal MinDisc { get; set; }

        /// <summary>
        /// Maximum discount ammount
        /// </summary>
        public decimal MaxDisc { get; set; }

        /// <summary>
        /// Minimum discount percentage
        /// </summary>
        public decimal MinDiscP { get; set; }

        /// <summary>
        /// Maximum discount percentage
        /// </summary>
        public decimal MaxDiscP { get; set; }

        /// <summary>
        /// Return offers only with discount
        /// </summary>
        public bool? DiscountOnly { get; set; }

        /// <summary>
        /// Search results placement ID
        /// </summary>
        public string PlacementId { get; set; }

        /// <summary>
        /// Is promo page search
        /// </summary>
        public bool? IsPromo { get; set; }

        /// <summary>
        /// Promo page ID(GUID)
        /// </summary>
        public string PromoPageId { get; set; }

        /// <summary>
        /// Minimum temperature to filter by
        /// </summary>
        public decimal? MinTemp { get; set; }

        /// <summary>
        /// Maximum temperature to filter by
        /// </summary>
        public decimal? MaxTemp { get; set; }

        /// <summary>
        /// Offer price for upsell base
        /// </summary>
        public decimal? UpsellFrom { get; set; }

        /// <summary>
        /// Max offer price for upsell
        /// </summary>
        public decimal? UpsellTo { get; set; }

        /// <summary>
        /// Promotion Collection Key to filter by.
        /// </summary>
        public string Promc { get; set; }

        /// <summary>
        /// Minimum transfer duration to filter by
        /// </summary>
        public int? MinTransferDuration { get; set; }

        /// <summary>
        /// Maximum transfer duration to filter by
        /// </summary>
        public int? MaxTransferDuration { get; set; }

        /// <summary>
        /// Indicates the type of the device making the request, such as desktop, mobile, or tablet.
        /// This property can be used for filtering offers based on device-specific criteria.
        /// </summary>
        public string DeviceType { get; set; }

        /// <summary>
        /// Validates whether one of Gegraphy or AccomCode values is specified.
        /// </summary>
        /// <param name="validationContext">Context</param>
        /// <returns>Collection of errors</returns>
        public new IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var baseResults = base.Validate(validationContext);

            // Ignore Duration field validation (wilbe overridden later)
            var baseResultsWithoutDuration = baseResults.Where(res => res.MemberNames?.Contains(nameof(Duration)) != true);
            foreach (var res in baseResultsWithoutDuration)
            {
                yield return res;
            }

            var noGeographyAndAccomFilter = string.IsNullOrWhiteSpace(Geography) && string.IsNullOrWhiteSpace(AccomCodes);
            if (noGeographyAndAccomFilter && !IsPromo.HasValue)
            {
                yield return new ValidationResult("Geography or AccomCode should be specified");
            }

            var durations = Duration ?? new List<int>();
            var durationNotSpecified = !durations.Any() || durations.Any(x => x <= 0); // empty  or has negative numbers
            if (durationNotSpecified && string.IsNullOrWhiteSpace(EndDate))
            {
                yield return new ValidationResult("Duration should be specified");
            }

            //To be sure that's promo
            if (IsPromo.HasValue)
            {
                var promoSpecified = !string.IsNullOrWhiteSpace(PromoPageId);
                if (!promoSpecified && noGeographyAndAccomFilter)
                {
                    yield return new ValidationResult("PromoPageId or Geography or AccomCodes should be specified for promo requests");
                }

                //If PromoPageId is specified, than PromoPage should be valid GUID
                if (promoSpecified && !Guid.TryParse(PromoPageId, out _))
                {
                    yield return new ValidationResult("PromoPageId should be valid GUID");
                }
            }
        }

        /// <summary>
        /// Returns if this search request contains children or infants
        /// </summary>
        public bool IncludesChildrenOrInfants => !string.IsNullOrEmpty(ChildAges) || (Room is not null && Room.Exists(r => r.Children > 0 || r.Infants > 0));

        /// <summary>  
        /// Promo code used for filtering offers.  
        /// </summary>  
        public string PromoCode { get; set; }

        /// <summary>
        /// Returns a list of AccomIds in this request.
        /// Search request contain accomId if viewing a hotel 
        /// </summary>
        /// <returns></returns>
        public IList<string> DistinctAccomIds()
        {
            List<string> accomIds = [];

            if (string.IsNullOrEmpty(AccomCodes) && (Destinations is null || Destinations.Length == 0))
            {
                return accomIds;
            }

            if (!string.IsNullOrEmpty(AccomCodes))
            {
                accomIds.AddRange(AccomCodes.Split(","));
            }

            if (Destinations is not null && Destinations.Any(d => d.Contains("hotel:", StringComparison.InvariantCulture)))
            {
                var hotelCodes = Destinations.Where(d => d.Contains("hotel:", StringComparison.InvariantCulture)).Select(d => d.Split(":")[1]);
                accomIds.AddRange(hotelCodes.Where(d => !accomIds.Contains(d)));
            }

            return accomIds;
        }

        /// <summary>
        /// Based on <see cref="PackagesSearchRequest"/> parameters derive the start date of the search request
        /// </summary>
        /// <returns>StartDate DateTime</returns>
        public DateTime DeriveStartDate() => DateFormatUtils.Parse(StartDate).AddDays(FlexibleDays * -1).Date;
        
        /// <summary>
        /// Based on <see cref="PackagesSearchRequest"/> parameters derive the end date of the search request
        /// </summary>
        /// <returns>EndDate</returns>
        public DateTime DeriveEndDate()
        {
            var startDateTime = DateFormatUtils.Parse(StartDate);
            return string.IsNullOrEmpty(EndDate) ? startDateTime.AddDays(Duration[0]).Date : DateFormatUtils.Parse(EndDate).AddDays(Duration[0]).Date;
        }
    }
}

using easyJet.Holidays.Api.Domain.Data.Analytics;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers
{
    /// <summary>
    /// Base Search request model
    /// </summary>
    public class BaseSearchRequest : UrchinTrackingModule, IValidatableObject
    {
        /// <summary>
        /// The earliest accommodation start date to be searched. Use ISO Format yyyy-MM-dd
        /// </summary>
        [Required]
        public string StartDate { get; set; }

        /// <summary>
        /// Stay duration 
        /// </summary>        
        public List<int> Duration { get; set; }

        /// <summary>
        /// Whether use flexible start dates(+/- x days)
        /// </summary>
        public int FlexibleDays { get; set; }

        /// <summary>
        /// Departure point. Multiple values can be specified as a comma separated list
        /// </summary>
        [Required]
        public string Departure { get; set; }

        /// <summary>
        /// Comma separated list of child ages (ages between 2 and 18)
        /// </summary>
        public string ChildAges { get; set; }

        /// <summary>
        /// Room guests allocation object. Optional but should be consistent with Rooms if specified
        /// </summary>        
        public virtual List<RoomAllocation> Room { get; set; }

        /// <summary>
        /// Special flag to all search requests to signify the purpose of the search to ATCom. This will be used to route traffic to the right search appliances in their network so we can seperate promo page traffic from normal search traffic.
        /// </summary>
        public SearchType? SearchType { get; set; }

        #region filters

        /// <summary>
        /// Optional comma separated list of board types to filter the results
        /// </summary>
        public string BoardType { get; set; }

        /// <summary>
        /// Optional comma separated list of facilities to filter the results
        /// </summary>
        public string Facilities { get; set; }

        /// <summary>
        /// Optional comma separated list of facilities to filter the results
        /// </summary>
        public string StarRating { get; set; }

        /// <summary>
        /// Optional TripAdvisor rating filter
        /// </summary>
        public int TripAdvisorRating { get; set; }

        /// <summary>
        /// Starting price filter
        /// </summary>
        public decimal PriceFrom { get; set; }

        /// <summary>
        /// End price filter
        /// </summary>
        public decimal PriceTo { get; set; }

        /// <summary>
        /// Is price filter on PP basis
        /// </summary>
        public bool IsPricePP { get; set; }

        /// <summary>
        /// PricePP as min value of range which need to be filtered before all other filters
        /// </summary>
        public decimal? InitialPricePPFrom { get; set; }

        /// <summary>
        /// PricePP as max value of range which need to be filtered before all other filters
        /// </summary>
        public decimal? InitialPricePPTo { get; set; }

        /// <summary>
        /// Price total as min value of range which need to be filtered before all other filters
        /// </summary>
        public decimal? InitialTotalPriceFrom { get; set; }

        /// <summary>
        /// Price total as max value of range which need to be filtered before all other filters
        /// </summary>
        public decimal? InitialTotalPriceTo { get; set; }

        /// <summary>
        /// Comma separated package themes filter (based on atcom prom code)
        /// </summary>
        public string Themes { get; set; }

        /// <summary>
        /// Comma separated package themes filter. (based on atcom prom code)
        /// Result set will be prefiltered by specified values before calculating results number foreach filter
        /// </summary>
        public string InitialThemes { get; set; }

        /// <summary>
        /// Comma separated list of hotel type filters (based on sitecore facility matrix)
        /// </summary>
        public string HotelTypes { get; set; }

        /// <summary>
        /// Optional comma separated list of departure airports to filter the results
        /// </summary>
        public string DepartureAirport { get; set; }

        /// <summary>
        /// Optional comma separated list of outbound time slots to filter the results
        /// </summary>
        public string OutboundTimeSlots { get; set; }

        /// <summary>
        /// Optional comma separated list of inbound time slots to filter the results
        /// </summary>
        public string InboundTimeSlots { get; set; }

        /// <summary>
        /// Min flight duration in minutes
        /// </summary>
        public int? FlightDurationFrom { get; set; }

        /// <summary>
        /// Max flight duration in minutes
        /// </summary>
        public int? FlightDurationTo { get; set; }

        /// <summary>
        /// Comma separated list of offer filters - free for kids, holidays with up to X discount, holidays with over X discount
        /// </summary>
        public string Offers { get; set; }

        #endregion

        #region calculated properties

        /// <summary>
        /// The number of adult passengers (between 1 and 16)
        /// </summary>
        public int Adults()
        {
            return Room?.Sum(x => x.Adults) ?? 0;
        }

        /// <summary>
        /// The number of adult passengers (between 0 and 16)
        /// </summary>
        public int Children()
        {
            return Room?.Sum(x => x.Children) ?? 0;
        }

        /// <summary>
        /// The number of infants passengers (between 0 and 16)
        /// </summary>
        public int Infants()
        {
            return Room?.Sum(x => x.Infants) ?? 0;
        }

        /// <summary>
        /// The number of adults + children
        /// </summary>
        public int TotalGuests()
        {
            return Adults() + Children();
        }
        #endregion

        /// <summary>
        /// Filter by outbound departure time
        /// </summary>
        public IEnumerable<TimePeriod> OutboundDepartureTime { get; set; }

        /// <summary>
        /// Filter by inbound Departure time
        /// </summary>
        public IEnumerable<TimePeriod> InboundDepartureTime { get; set; }

        /// <summary>
        /// Used to navigate throught markets
        /// </summary>
        public string MarketCode { get; set; }

        /// <summary>
        /// Gets the ECP (Experience Context Provider) value.
        /// Flag indicator of the funnel, e.g. FPH for flight plus hotel funnel
        /// </summary>
        public string Ecp { get; init; }

        /// <summary>
        /// Maximum number of guests total is 16 (atcore restriction, should ideally be configurable in code)
        /// Maximum number of Infant guests is 7 (easyjet restriction, no expectation that this will change)
        /// Maximum of 1 Infant guest per Adult guest(easyjet restriction, no expectation that this will change)
        /// Maximum of 10 Child guests per Adult guest(easyjet restriction, no expectation that this will change)
        /// 
        /// </summary>
        /// <param name="validationContext">additional information, such as the model instance created by model binding</param>
        /// <returns>validation results</returns>
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var searchSettingsOptions = validationContext.GetService(typeof(IOptions<SearchSettings>)) as IOptions<SearchSettings>;
            var searchSettings = searchSettingsOptions.Value;

            // Manual validation because we might want to override it in inherited classes
            if (Duration == null || !Duration.Any())
            {
                yield return new ValidationResult($"At least one duration should be presented.", new[] { nameof(Duration) });
            }

            if ((Duration ?? new List<int>()).Any(x => x <= 0))
            {
                yield return new ValidationResult($"All durations should be positive.", new[] { nameof(Duration) });
            }

            if (Room == null || !Room.Any())
            {
                yield return new ValidationResult($"At least one room should be presented.");
                yield break; // We don't want to do any further validation because there is no information about guests
            }

            if (Room.Select(x => x.Adults).Any(x => x <= 0))
            {
                yield return new ValidationResult($"At least one adult should be presented in room.");
            }

            if (Room.Select(x => x.Children).Any(x => x < 0))
            {
                yield return new ValidationResult($"Number of Children should be non-negative.");
            }

            if (Room.Select(x => x.Infants).Any(x => x < 0))
            {
                yield return new ValidationResult($"Number of Infants should be non-negative.");
            }

            var adults = Adults();
            var children = Children();
            var infants = Infants();

            if (adults + children + infants > searchSettings.MaxNumberOfGuests)
            {
                yield return new ValidationResult($"Total number of guests should not exceed {searchSettings.MaxNumberOfGuests}.");
            }

            if (infants > searchSettings.MaxNumberOfInfants)
            {
                yield return new ValidationResult($"Number of infants should not exceed {searchSettings.MaxNumberOfInfants}.");
            }

            if (((double)infants / adults) > searchSettings.MaxNumberOfInfantsPerAdult)
            {
                yield return new ValidationResult($"Number of infants per adult should not exceed {searchSettings.MaxNumberOfInfantsPerAdult}.");
            }

            if (((double)children / adults) > searchSettings.MaxNumberOfChildrenPerAdult)
            {
                yield return new ValidationResult($"Number of children per adult should not exceed {searchSettings.MaxNumberOfChildrenPerAdult}.");
            }

            //validate OutboundDepartureTime correct format
            if (!OutboundDepartureTime.IsNullOrEmpty())
            {
                var canNotParseDepartureTime = OutboundDepartureTime.Any(period =>
                    !(DateTime.TryParseExact(period.Start, TimePeriod.TimePeriodFormat,
                        System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None,
                        out _)) || !(DateTime.TryParseExact(period.End, TimePeriod.TimePeriodFormat,
                        System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None,
                        out _)));

                if (canNotParseDepartureTime)
                {
                    yield return new ValidationResult($"One of the {nameof(OutboundDepartureTime)} values has incorrect format");
                }

            }

            //validate InboundDepartureTime correct format
            if (!InboundDepartureTime.IsNullOrEmpty())
            {
                var canNotParseArrivalTime = InboundDepartureTime.Any(period =>
                    !(DateTime.TryParseExact(period.Start, TimePeriod.TimePeriodFormat,
                        System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None,
                        out _)) || !(DateTime.TryParseExact(period.End, TimePeriod.TimePeriodFormat,
                        System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None,
                        out _)));

                if (canNotParseArrivalTime)
                {
                    yield return new ValidationResult($"One of the {nameof(InboundDepartureTime)} values has incorrect format");
                }
            }

            // validate time slot for correctness
            if (!string.IsNullOrWhiteSpace(OutboundTimeSlots))
            {
                var slots = OutboundTimeSlots.Split(',');
                if (slots.Any(string.IsNullOrWhiteSpace))
                {
                    yield return new ValidationResult($"One time slot of the {nameof(OutboundTimeSlots)} values is empty");
                }

                if (slots.Any(x => x.ToUpperInvariant() != x))
                {
                    yield return new ValidationResult($"One time slot of the {nameof(OutboundTimeSlots)} values is in low register");
                }
            }

            if (!string.IsNullOrWhiteSpace(InboundTimeSlots))
            {
                var slots = InboundTimeSlots.Split(',');
                if (slots.Any(string.IsNullOrWhiteSpace))
                {
                    yield return new ValidationResult($"One time slot of the {nameof(InboundTimeSlots)} values is empty");
                }

                if (slots.Any(x => x.ToUpperInvariant() != x))
                {
                    yield return new ValidationResult($"One time slot of the {nameof(InboundTimeSlots)} values is in low register");
                }
            }
        }
    }

    /// <summary>
    /// Rooms allocation data
    /// </summary>
    public class RoomAllocation
    {
        /// <summary>
        /// Number of adults
        /// </summary>
        [Range(1, int.MaxValue)]
        public int Adults { get; set; }

        /// <summary>
        /// Number of childern
        /// </summary>
        public int Children { get; set; }

        /// <summary>
        /// Number of infants
        /// </summary>
        public int Infants { get; set; }

        /// <summary>
        /// Prefered room code (optional)
        /// </summary>
        public string RoomCode { get; set; }
    }

    /// <summary>
    /// Order direction enum
    /// </summary>
    public enum OrderByField
    {
        /// <summary>
        /// SmartSeer/chosen for you, also used by default if order not specified explicitly
        /// </summary>
        [EnumMember(Value = "default")]
        SmartSeer,

        /// <summary>
        /// order by total package Price
        /// </summary>
        [EnumMember(Value = "price")]
        Price,

        /// <summary>
        /// order by total package discount
        /// </summary>
        [EnumMember(Value = "discPercent")]
        DiscPercent,

        /// <summary>
        /// order by total package discount
        /// </summary>
        [EnumMember(Value = "discAmount")]
        DiscAmount,

        /// <summary>
        /// order by trip advisor rating, orders with same TA rating are ordered by smartseer
        /// </summary>
        [EnumMember(Value = "tripAdvisor")]
        TripAdvisor,

        /// <summary>
        /// order by trip advisor rating, orders with same TA rating are ordered by atcom commercial priority
        /// </summary>
        [EnumMember(Value = "tripAdvisorWithoutSmartSeer")]
        TripAdvisorWithoutSmartSeer,

        /// <summary>
        /// random order
        /// </summary>
        [EnumMember(Value = "random")]
        Random
    }

    /// <summary>
    /// Order direction enum
    /// </summary>
    public enum OrderByDirection
    {
        /// <summary>
        /// order ascendingly
        /// </summary>
        [EnumMember(Value = "asc")]
        Asc,

        /// <summary>
        /// order descendingly
        /// </summary>
        [EnumMember(Value = "desc")]
        Desc
    }

    /// <summary>
    /// Order direction enum
    /// </summary>
    public enum SearchType
    {
        /// <summary>
        /// order by total package Price
        /// </summary>
        [EnumMember(Value = "none")]
        None,
        /// <summary>
        /// order by total package Price
        /// </summary>
        [EnumMember(Value = "normal")]
        Normal,
        /// <summary>
        /// order by total package Price
        /// </summary>
        [EnumMember(Value = "promo")]
        Promo,
        /// <summary>
        /// order by total package discount
        /// </summary>
        [EnumMember(Value = "report")]
        Report
    }

    /// <summary>
    /// Time period model
    /// </summary>
    [Serializable]
    [DataContract]
    public class TimePeriod
    {
        /// <summary>
        /// TimePeriod format
        /// </summary>
        public static readonly string TimePeriodFormat = "HHmm";

        /// <summary>
        /// Start time
        /// </summary>
        [DataMember(Name = "start")]
        public string Start { get; set; }

        /// <summary>
        /// End time
        /// </summary>
        [DataMember(Name = "end")]
        public string End { get; set; }
    }
}
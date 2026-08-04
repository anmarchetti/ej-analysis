using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers
{
    /// <summary>
    /// Filter class, containing code, name and options
    /// </summary>
    [Serializable]
    [DataContract]
    public class Filter
    {
        /// <summary>
        /// Filter code, e.g. "boardType"
        /// </summary>
        [DataMember(Name = "code")]
        public AvailableFilters Code { get; set; }

        /// <summary>
        /// Filter name, e.g. "destination" or "region"
        /// </summary>
        [DataMember(Name = "name")]
        public string Name { get; set; }

        /// <summary>
        /// filter options - e.g. "Bed and Breakfast", "Full Board"
        /// </summary>
        [DataMember(Name = "options")]
        public List<FilterOption> Options { get; set; }
    }
    public class FilterOptions
    {
        /// <summary>
        /// Filter name, e.g. "destination" or "region"
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// filter options - e.g. "Bed and Breakfast", "Full Board"
        /// </summary>
        public List<FilterOption> Options { get; set; }

        /// <summary>
        /// Returns instance with empty list of options
        /// </summary>
        public static FilterOptions Empty => new() { Options = new List<FilterOption>() };
    }

    /// <summary>
    /// Filter option, containing code, name and count of items
    /// </summary>
    [Serializable]
    [DataContract]
    public class FilterOption
    {
        /// <summary>
        /// Filter code, e.g. boardType (used for recommended filters)
        /// </summary>
        [DataMember(Name = "filterCode")]
        public AvailableFilters? FilterCode { get; set; }

        /// <summary>
        /// Filter option code, e.g. BB
        /// </summary>
        [DataMember(Name = "code")]
        public string Code { get; set; }

        /// <summary>
        /// filter option Title, e.g. "Bed and Breakfast"
        /// </summary>
        [DataMember(Name = "name")]
        public string Name { get; set; }

        /// <summary>
        /// Filter option tracking id, english translation of the name
        /// </summary>
        [DataMember(Name = "trackingId")]
        public string TrackingId { get; set; }

        /// <summary>
        /// Filter option Full Name, e.g. "4+ TripAdvisor rating" (used for filter pills)
        /// </summary>
        [DataMember(Name = "fullName")]
        public string FullName { get; set; }

        /// <summary>
        /// number of results available if that filter is applied
        /// </summary>
        [DataMember(Name = "count")]
        public int Count { get; set; }

        /// <summary>
        /// Filter icon which will be shown on frontend
        /// </summary>
        [DataMember(Name = "icon")]
        public string Icon { get; set; }

        /// <summary>
        /// Filter option sub level
        /// </summary>
        [DataMember(Name = "children")]
        public List<FilterOption> Children { get; set; }

        /// <summary>
        /// Board group of board type
        /// </summary>
        [DataMember(Name = "boardGroup")]
        public BoardGroup BoardGroup { get; set; }

        /// <summary>
        /// Filter group
        /// </summary>
        [DataMember(Name = "facilityFilterGroup")]
        public FacilityFilterGroup FacilityFilterGroup { get; set; }

        /// <summary>
        /// Destination information
        /// </summary>
        [DataMember(Name = "destinationInfo")]
        public DestinationFilterInfo DestinationInfo { get; set; }

        /// <summary>
        /// Time slot start time
        /// </summary>
        [DataMember(Name = "startTime")]
        public DateTime? StartTime { get; set; }
        /// <summary>
        /// Time slot start time
        /// </summary>
        [DataMember(Name = "endTime")]
        public DateTime? EndTime { get; set; }
        /// <summary>
        /// Time slot atcom code
        /// </summary>
        [DataMember(Name = "atcomCode")]
        public string AtcomCode { get; set; }

        /// <summary>
        /// Tooltip text
        /// </summary>
        [DataMember(Name = "tooltipText")]
        public string TooltipText { get; set; }

        /// <summary>
        /// Is filter option exclusive in its group (can be select just one exclusive option)
        /// </summary>
        [DataMember(Name = "isExclusive")]
        public bool? IsExclusive { get; set; }

        /// <summary>
        /// Maximum temperature on the weather filter slider
        /// </summary>
        [DataMember(Name = "maxTemp")]
        public int? MaxTemp { get; set; }

        /// <summary>
        /// Minimum temperature on the weather filter slider
        /// </summary>
        [DataMember(Name = "minTemp")]
        public int? MinTemp { get; set; }

        /// <summary>
        /// Minimum transfer duration on the transfer duration filter slider
        /// </summary>
        [DataMember(Name = "minTransferDuration")]
        public int? MinTransferDuration { get; set; }

        /// <summary>
        /// Maximum transfer duration on the transfer duration filter slider
        /// </summary>
        [DataMember(Name = "maxTransferDuration")]
        public int? MaxTransferDuration { get; set; }

        /// <summary>
        /// Indicates whether the "New" label should be shown for this filter option.
        /// </summary>
        [DataMember(Name = "showNewLabel")]
        public bool? ShowNewLabel { get; set; }
    }

    [Serializable]
    [DataContract]
    public class DestinationFilterInfo
    {
        /// <summary>
        /// Country parent
        /// </summary>
        [DataMember(Name = "parent")]
        public string Parent { get; set; }

        /// <summary>
        /// Related regions
        /// </summary>
        [DataMember(Name = "relatedRegions")]
        public IReadOnlyCollection<string> RelatedRegions { get; set; }

        /// <summary>
        /// Related resorts
        /// </summary>
        [DataMember(Name = "relatedResorts")]
        public IReadOnlyCollection<string> RelatedResorts { get; set; }

        /// <summary> 
        /// Destination type
        /// </summary>
        [DataMember(Name = "type")]
        public DestinationItemType? Type { get; set; }
    }
}

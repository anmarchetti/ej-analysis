namespace easyJet.Holidays.Api.Domain.Data.Filters
{
    /// <summary>
    /// Facility Matrix Configuration Model.
    /// </summary>
    public class HotelTypeFilterConfiguration
    {
        /// <summary>
        /// Gets matrix code.
        /// </summary>
        public string Code { get; init; }

        /// <summary>
        /// Gets matrix name.
        /// </summary>
        public string Name { get; init; }

        /// <summary>
        /// Gets tracking id.
        /// </summary>
        public string TrackingId { get; init; }

        /// <summary>
        /// Gets matrix item name.
        /// </summary>
        public string ItemName { get; init; }

        /// <summary>
        /// Gets matrix type title.
        /// </summary>
        public string TypeTitle { get; init; }

        /// <summary>
        /// Gets matrix description.
        /// </summary>
        public string Description { get; init; }

        /// <summary>
        /// Gets matrix icon url.
        /// </summary>
        public string Icon { get; init; }

        /// <summary>
        /// Gets matrix filled icon url.
        /// </summary>
        public string FilledIcon { get; init; }

        /// <summary>
        /// Gets matrix tooltip text.
        /// </summary>
        public string TooltipText { get; init; }

        /// <summary>
        /// Indicates whether matrix is exclusive.
        /// </summary>
        public bool IsExclusive { get; set; }
    }
}

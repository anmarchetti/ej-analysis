using easyJet.Holidays.Api.Domain.Data.Filters;

namespace easyJet.Holidays.Api.Domain.Data.ReferenceData
{
    /// <summary>
    /// Filter pill option.
    /// </summary>
    [Serializable]
    public class FilterPillOption
    {
        /// <summary>
        /// Source filter this filter pill points to.
        /// </summary>
        public AvailableFilters FilterCode { get; set; }

        /// <summary>
        /// Source option code (or composite code for special cases).
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Display name for the filter pill.
        /// </summary>
        public string Name { get; set; }
    }
}
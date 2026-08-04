using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// Extension methods for filter pills configuration lookups.
    /// </summary>
    internal static class FilterPillsConfigExtensions
    {
        /// <summary>
        /// Returns the display name configured for a specific filter option code.
        /// </summary>
        /// <param name="filterPillsConfig">Filter pills configuration source.</param>
        /// <param name="filter">Filter type to match.</param>
        /// <param name="filterOptionCode">Option code to match.</param>
        /// <returns>The configured option name, or <c>null</c> when not found.</returns>
        public static string GetFilterPillFullName(this FilterPillsConfig filterPillsConfig, AvailableFilters filter, string filterOptionCode)
        {
            return filterPillsConfig?.Options?
                .FirstOrDefault(x =>
                    x.FilterCode == filter &&
                    x.Code == filterOptionCode)
                ?.Name;
        }
    }
}

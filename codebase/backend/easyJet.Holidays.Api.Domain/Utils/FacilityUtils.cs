using easyJet.Holidays.Api.Domain.Data.Hotels;

namespace easyJet.Holidays.Api.Domain.Utils
{
    /// <summary>
    /// Utils for facility/facilities
    /// </summary>
    public class FacilityUtils
    {
        /// <summary>
        /// Group facilities by facility filter group
        /// </summary>
        /// <param name="facilities">Facilities collection</param>
        /// <returns>Grouped facilities or empty collection</returns>
        public static IEnumerable<Facility> GroupFacility(List<Facility> facilities)
        {
            if (facilities == null || !facilities.Any())
            {
                return Enumerable.Empty<Facility>();
            }

            var groupedFacilities = facilities
                .GroupBy(facility => string.IsNullOrWhiteSpace(facility?.FacilityFilterGroup?.Code)
                    ? facility?.Code
                    : facility.FacilityFilterGroup?.Code)
                .Select(grouping => new Facility()
                {
                    Code = grouping.Key,
                    Name = grouping.FirstOrDefault()?.FacilityFilterGroup?.Name ?? grouping.FirstOrDefault()?.Name,
                    TrackingId = grouping.FirstOrDefault()?.FacilityFilterGroup?.TrackingId ?? grouping.FirstOrDefault()?.TrackingId,
                    FacilityFilterGroup = grouping.FirstOrDefault()?.FacilityFilterGroup,
                    Tooltip = grouping.FirstOrDefault()?.FacilityFilterGroup?.Tooltip ?? grouping.FirstOrDefault()?.Tooltip
                });

            return groupedFacilities;
        }

        /// <summary>
        /// Extract unique facility codes in uppercase from groups
        /// </summary>
        /// <param name="groups"></param>
        /// <returns></returns>
        public static List<string> GetFacilityCodes(IEnumerable<FacilityGroup> groups)
        {
            return groups?.SelectMany(f => f.FacilityFilteredTypes.Select(x => x.Code.ToUpperInvariant()))?.Distinct()?.ToList();
        }
    }
}
using System.Collections.Generic;
using System.Linq;

namespace easyJet.Foundation.Destinations.Models.Domain.Muzement
{
    public class MuzementRegionData
    {
        public MuzementRegionData(IGrouping<string, DestinationMappingRow> resortData)
        {
            RegionName = resortData.Key;
            RegionChildCode = resortData.First().ResortCode;
            var regionId = resortData.FirstOrDefault()?.RegionId;
            RegionMuzementCode = !string.IsNullOrEmpty(regionId) && !regionId.Equals("0") ? regionId : null;
            ResortDataByCodes = resortData.Where(r => !string.IsNullOrEmpty(r.ResortId) && !r.ResortId.Equals("0")).ToDictionary(x => x.ResortCode, x => (x.Resort, x.ResortId));
        }

        public string RegionName { get; set; }

        public string RegionChildCode { get; set; }

        public string RegionMuzementCode { get; set; }

        public Dictionary<string, (string name, string musementId)> ResortDataByCodes { get; set; }

        public string[] Codes => ResortDataByCodes.Any() ? ResortDataByCodes.Keys.ToArray() : new[] { RegionChildCode };

        public string[] ResortMuzementCodes => ResortDataByCodes.Values.Select(x => x.musementId).ToArray();

        public string GetRegionMusement() => string.IsNullOrEmpty(RegionMuzementCode) ? string.Join(",", ResortMuzementCodes) : RegionMuzementCode;
    }
}
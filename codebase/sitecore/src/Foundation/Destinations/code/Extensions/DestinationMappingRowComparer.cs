using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Extensions
{
    public class DestinationMappingRowComparer : IEqualityComparer<DestinationMappingRow>
    {
        public bool Equals(DestinationMappingRow x, DestinationMappingRow y)
        {
            if (ReferenceEquals(x, y))
            {
                return true;
            }

            if (ReferenceEquals(x, null))
            {
                return false;
            }

            if (ReferenceEquals(y, null))
            {
                return false;
            }

            if (x.GetType() != y.GetType())
            {
                return false;
            }

            return x.Country == y.Country && x.Region == y.Region && x.Resort == y.Resort && x.ResortCode == y.ResortCode;
        }

        public int GetHashCode(DestinationMappingRow obj)
        {
            var hashCode = obj.Country != null ? obj.Country.GetHashCode() : 0;
            hashCode = (hashCode * 397) ^ (obj.Region != null ? obj.Region.GetHashCode() : 0);
            hashCode = (hashCode * 397) ^ (obj.Resort != null ? obj.Resort.GetHashCode() : 0);
            hashCode = (hashCode * 397) ^ (obj.ResortCode != null ? obj.ResortCode.GetHashCode() : 0);
            return hashCode;
        }
    }
}
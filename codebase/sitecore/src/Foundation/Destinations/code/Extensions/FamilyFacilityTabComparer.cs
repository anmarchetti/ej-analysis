using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Extensions
{
    public class FamilyFacilityTabComparer : IEqualityComparer<FamilyFacilityTabRow>
    {
        public bool Equals(FamilyFacilityTabRow x, FamilyFacilityTabRow y)
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

            return x.GiataCode == y.GiataCode;
        }

        public int GetHashCode(FamilyFacilityTabRow obj)
        {
            var hashCode = obj.GiataCode != null ? obj.GiataCode.GetHashCode() : 0;
            return hashCode;
        }
    }
}

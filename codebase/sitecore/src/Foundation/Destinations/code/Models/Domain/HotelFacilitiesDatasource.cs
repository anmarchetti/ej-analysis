using System.Collections.Generic;
using System.Web.Script.Serialization;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    /// <summary>
    /// Hotels Facilities Datasource object.
    /// </summary>
    public class HotelFacilitiesDatasource
    {
        public FacilityMatrix[] FacilityMatrix { get; set; }

        [ScriptIgnore(ApplyToOverrides = false)]
        public virtual IEnumerable<AccommodationFacilityVirtualGroup> Facilities { get; set; }

        [ScriptIgnore]
        public IEnumerable<FacilityFilteredType> FacilitiesFiltered { get; set; }

        [ScriptIgnore]
        public bool IsMatrixOverriden { get; set; }

        [ScriptIgnore]
        public string[] MatrixOverride { get; set; }
    }
}

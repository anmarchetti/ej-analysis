using System.Collections.Generic;

namespace easyJet.Foundation.Atcom.Models.Domain
{
    public class RoomTypeFacilities : DataObject
    {
        public RoomTypeFacilities(string code, string name)
            : base(code, name)
        {
        }

        /// <summary>
        /// Gets or sets seasonal facilities.
        /// </summary>
        public List<SeasonalFacilities> SesonalFacilities { get; set; }
    }
}
using CsvHelper.Configuration.Attributes;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class RoomTypeFacilityReorderRow
    {
        public RoomTypeFacilityReorderRow()
        {
        }

        public RoomTypeFacilityReorderRow(string code, string name, string order)
        {
            Code = code;
            Name = name;
            Order = order;
        }

        /// <summary>
        /// Gets or Sets code.
        /// </summary>
        [Index(0)]
        public string Code { get; set; }

        /// <summary>
        /// Gets or Sets name.
        /// </summary>
        [Index(1)]
        public string Name { get; set; }

        /// <summary>
        /// Gets or Sets order.
        /// </summary>
        [Index(2)]
        public string Order { get; set; }
    }
}
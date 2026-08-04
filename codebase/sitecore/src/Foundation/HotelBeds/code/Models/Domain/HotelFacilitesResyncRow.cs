using CsvHelper.Configuration.Attributes;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class HotelFacilitesResyncRow
    {
        public HotelFacilitesResyncRow()
        {
        }

        public HotelFacilitesResyncRow(string code, string name)
        {
            GiataCode = code;
            Name = name;
        }

        /// <summary>
        /// Gets or Sets giata code.
        /// </summary>
        [Index(0)]
        public string GiataCode { get; set; }

        /// <summary>
        /// Gets or Sets Hotel Name.
        /// </summary>
        [Index(1)]
        public string Name { get; set; }
    }
}
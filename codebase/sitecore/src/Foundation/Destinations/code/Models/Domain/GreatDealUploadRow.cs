using CsvHelper.Configuration.Attributes;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class GreatDealUploadRow
    {
        public GreatDealUploadRow()
        {
        }

        public GreatDealUploadRow(string code, string hotelName)
        {
            GiataCode = code;
            HotelName = hotelName;
        }

        /// <summary>
        /// Gets or Sets Giata code.
        /// </summary>
        [Index(0)]
        public string GiataCode { get; set; }

        /// <summary>
        /// Gets or Sets Hotel Name.
        /// </summary>
        [Index(1)]
        public string HotelName { get; set; }
    }
}
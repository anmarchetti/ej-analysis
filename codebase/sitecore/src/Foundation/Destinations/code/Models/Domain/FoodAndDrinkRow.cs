using CsvHelper.Configuration.Attributes;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class FoodAndDrinkRow
    {
        public FoodAndDrinkRow()
        {
        }

        public FoodAndDrinkRow(string hotelCode, string hotelName)
        {
            HotelCode = hotelCode;
            HotelName = hotelName;
        }

        /// <summary>
        /// Gets or sets hotel name.
        /// </summary>
        [Index(0)]
        public string HotelName { get; set; }

        /// <summary>
        /// Gets or sets hotel code.
        /// </summary>
        [Index(4)]
        public string HotelCode { get; set; }

        /// <summary>
        /// Gets or sets food and drink description.
        /// </summary>
        [Index(13)]
        public string Description { get; set; }
    }
}

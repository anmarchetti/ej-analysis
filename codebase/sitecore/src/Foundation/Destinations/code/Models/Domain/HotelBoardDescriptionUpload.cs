using CsvHelper.Configuration.Attributes;
using easyJet.Foundation.SitecoreExtensions.Attributes;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class HotelBoardDescriptionUpload
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="HotelBoardDescriptionUpload"/> class.
        /// This ctor needs for deserialization.
        /// </summary>
        public HotelBoardDescriptionUpload()
        {
        }

        public HotelBoardDescriptionUpload(string hotelCode, string hotelName, string boardCode, string boardName)
        {
            GiataCode = hotelCode;
            HotelName = hotelName;
            BoardCode = boardCode;
            BoardName = boardName;
        }

        public HotelBoardDescriptionUpload(string hotelCode, string hotelName, string boardCode, string boardName, string boardDescription)
            : this(hotelCode, hotelName, boardCode, boardName)
        {
            BoardDescription = boardDescription;
        }

        /// <summary>
        /// Gets or sets hotel code.
        /// </summary>
        [Index(0)]
        public string GiataCode { get; set; }

        /// <summary>
        /// Gets or sets hotel name.
        /// </summary>
        public string HotelName { get; set; }

        /// <summary>
        /// Gets or sets board name.
        /// </summary>
        [Index(1)]
        public string BoardName { get; set; }

        /// <summary>
        /// Gets or sets board code.
        /// </summary>
        [Index(2)]
        public string BoardCode { get; set; }

        /// <summary>
        /// Gets or sets board description.
        /// </summary>
        [Index(3)]
        public string BoardDescription { get; set; }
    }
}
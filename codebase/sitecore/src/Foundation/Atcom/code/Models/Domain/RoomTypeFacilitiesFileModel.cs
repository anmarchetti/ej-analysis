using System.Collections.Generic;
using CsvHelper.Configuration.Attributes;
using easyJet.Foundation.Atcom.Converter;

namespace easyJet.Foundation.Atcom.Models.Domain
{
    public class RoomTypeFacilitiesFileModel
    {
        /// <summary>
        /// Gets or sets accom code.
        /// </summary>
        [Index(0)]
        public string AccomCode { get; set; }

        /// <summary>
        /// Gets or sets hotel name.
        /// </summary>
        [Index(1)]
        public string HotelName { get; set; }

        /// <summary>
        /// Gets or sets room type code.
        /// </summary>
        [Index(2)]
        public string RoomTypeCode { get; set; }

        /// <summary>
        /// Gets or sets room type name.
        /// </summary>
        [Index(7)]
        public string RoomTypeName { get; set; }

        /// <summary>
        /// Gets or sets seasonal facilities.
        /// </summary>
        [TypeConverter(typeof(SeasonalFacilitiesArrayConverter))]
        public List<RoomSeasonalFacilitiesFileModel> SeasonalFacilities { get; set; }
    }
}
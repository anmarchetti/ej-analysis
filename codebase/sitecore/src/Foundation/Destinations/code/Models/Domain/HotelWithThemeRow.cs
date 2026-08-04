using System.Linq;
using CsvHelper.Configuration.Attributes;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class HotelWithThemeRow
    {
        public HotelWithThemeRow()
        {
        }

        public HotelWithThemeRow(string hotelCode, string hotelName, string hotelTheme, string hotelThemeCode, string hotelType, string hotelTypeCode)
        {
            HotelCode = hotelCode;
            HotelName = hotelName;
            HotelThemeName = hotelTheme;
            HotelThemeCode = hotelThemeCode;
            HotelTypeName = hotelType;
            HotelTypeCode = hotelTypeCode;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="HotelWithThemeRow"/> class.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        public HotelWithThemeRow(Item item)
        {
            if (item == null)
            {
                return;
            }

            CountryCode = item.Parent.Parent.Parent[Constants.Fields.DatasourceItem.Code];
            CountryName = item.Parent.Parent.Parent[Constants.Fields.DatasourceItem.Name];
            RegionCode = item.Parent.Parent[Constants.Fields.DatasourceItem.Code];
            RegionName = item.Parent.Parent[Constants.Fields.DatasourceItem.Name];
            ResortCode = item.Parent[Constants.Fields.DatasourceItem.Code];
            ResortName = item.Parent[Constants.Fields.DatasourceItem.Name];
            HotelCode = item[Constants.Fields.AccommodationItem.GiataCode];
            HotelName = item[Constants.Fields.DatasourceItem.Name];
            var hotelTheme = item.GetTargetItem(Constants.Fields.AccommodationItem.HotelTheme);
            if (hotelTheme != null)
            {
                HotelThemeCode = hotelTheme[Constants.Fields.DatasourceItem.Code];
                HotelThemeName = hotelTheme[Constants.Fields.DatasourceItem.Name];
            }

            var hotelThemeType = item.GetItems(Constants.Fields.AccommodationItem.Types).FirstOrDefault();
            if (hotelThemeType != null)
            {
                HotelTypeCode = hotelThemeType[Constants.Fields.DatasourceItem.Code];
                HotelTypeName = hotelThemeType[Constants.Fields.DatasourceItem.Name];
            }
        }

        /// <summary>
        /// Gets or sets country code.
        /// </summary>
        public string CountryCode { get; set; }

        /// <summary>
        /// Gets or sets country name.
        /// </summary>
        public string CountryName { get; set; }

        /// <summary>
        /// Gets or sets region code.
        /// </summary>
        public string RegionCode { get; set; }

        /// <summary>
        /// Gets or sets region code.
        /// </summary>
        public string RegionName { get; set; }

        /// <summary>
        /// Gets or sets resort code.
        /// </summary>
        public string ResortCode { get; set; }

        /// <summary>
        /// Gets or sets resort name.
        /// </summary>
        public string ResortName { get; set; }

        /// <summary>
        /// Gets or sets hotel code.
        /// </summary>
        [Index(6)]
        public string HotelCode { get; set; }

        /// <summary>
        /// Gets or sets hotel name.
        /// </summary>
        [Index(7)]
        public string HotelName { get; set; }

        /// <summary>
        /// Gets or sets hotel theme name.
        /// </summary>
        [Index(8)]
        public string HotelThemeName { get; set; }

        /// <summary>
        /// Gets or sets hotel theme code.
        /// </summary>
        [Index(9)]
        public string HotelThemeCode { get; set; }

        /// <summary>
        /// Gets or sets hotel type name.
        /// </summary>
        [Index(10)]
        public string HotelTypeName { get; set; }

        /// <summary>
        /// Gets or sets hotel type code.
        /// </summary>
        [Index(11)]
        public string HotelTypeCode { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether item is published.
        /// </summary>
        public bool Published { get; set; }
    }
}
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class HotelThemeResponseItem : HotelTheme
    {
        public HotelThemeResponseItem()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="HotelThemeResponseItem"/> class.
        /// Fill object props by values from hotelThemeItem item.
        /// </summary>
        /// <param name="hotelThemeItem">Hotel Theme Item.</param>
        public HotelThemeResponseItem(Item hotelThemeItem)
            : base(hotelThemeItem)
        {
            Id = hotelThemeItem.ID;
            Description = hotelThemeItem?.Fields[Constants.Fields.DatasourceItem.Description]?.Value;
            TrackingId = ItemUtils.GetTrackingId(hotelThemeItem);
            Icon = hotelThemeItem?.GetMediaUrl(Constants.Fields.HotelThemeItem.Icon);
            Types = hotelThemeItem?.GetChildren().Select(hotelThemeType => new Type(hotelThemeType));

            var packageIconsGroups = ((MultilistField)hotelThemeItem.Fields[Constants.Fields.HotelThemeItem.PackageIcons])?.GetItems();
            PackageIcons = packageIconsGroups?.Select(pi => new PackageIcon(pi));
        }

        public ID Id { get; set; }

        public string Description { get; set; }

        public string TrackingId { get; set; }

        public string Icon { get; set; }

        public IEnumerable<Type> Types { get; set; }

        public IEnumerable<PackageIcon> PackageIcons { get; set; }
    }
}
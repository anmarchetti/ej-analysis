using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class PackageIcon
    {
        public PackageIcon()
        {
        }

        public PackageIcon(Item item)
        {
            if (item == null)
            {
                return;
            }

            Key = item[Constants.Fields.PackageThemeIcon.Type];
            IconUrl = item.GetMediaUrl(Constants.Fields.AccommodationReferenceItem.Icon);
            Name = item[Constants.Fields.DatasourceItem.Name];

            ReferenceField bagType = item.Fields[Constants.Fields.PackageThemeIcon.BagType];
            if (bagType?.TargetItem != null)
            {
                LuggageCode = bagType.TargetItem[Constants.Fields.LuggageItem.Code];
            }
        }

        public string Key { get; set; }

        public string IconUrl { get; set; }

        public string Name { get; set; }

        public string LuggageCode { get; set; }
    }
}
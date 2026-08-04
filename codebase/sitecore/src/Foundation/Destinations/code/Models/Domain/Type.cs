using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class Type : DatasourceObject
    {
        // Required for serialization
        public Type()
        {
        }

        public Type(Item item)
            : base(item)
        {
            if (item == null)
            {
                return;
            }

            Id = item.ID;
            Description = item.Fields[Constants.Fields.TypeItem.Description]?.Value;
            TrackingId = ItemUtils.GetTrackingId(item);
            Icon = item.GetMediaUrl(Constants.Fields.TypeItem.Icon);
            FilledIcon = item.GetMediaUrl(Constants.Fields.TypeItem.FilledIcon);
            TypeAndThemeTitle = item.Fields[Constants.Fields.TypeItem.TypeAndThemeTitle]?.Value;
        }

        public ID Id { get; set; }

        public string Description { get; set; }

        public string TrackingId { get; set; }

        public string Icon { get; set; }

        public string FilledIcon { get; set; }

        public string TypeAndThemeTitle { get; set; }
    }
}
using System.Collections.Generic;
using easyJet.Foundation.Destinations.Utilities;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class POIs : BaseItinenary
    {
        // Requires for deserialization
        public POIs()
        {
        }

        public POIs(Item item)
            : base(item)
        {
            if (item == null)
            {
                return;
            }

            Subtitle = item.Fields[Constants.Fields.POIs.Subtitle]?.Value;
            ActiveIconUrl = item.GetMediaUrl(Constants.Fields.POIs.ActiveIcon);
            NonActiveIconUrl = item.GetMediaUrl(Constants.Fields.POIs.NonActiveIcon);
            Longitude = item.Fields[Constants.Fields.POIs.Longitude]?.Value;
            Latitude = item.Fields[Constants.Fields.POIs.Longitude]?.Value;
            Images = new ImageUtils().GetChildImages(item);
        }

        public string Subtitle { get; set; }

        public string ActiveIconUrl { get; set; }

        public string NonActiveIconUrl { get; set; }

        public string Longitude { get; set; }

        public string Latitude { get; set; }

        public IEnumerable<ImageData> Images { get; set; }
    }
}
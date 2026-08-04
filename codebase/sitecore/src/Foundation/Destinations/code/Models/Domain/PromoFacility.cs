using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Links;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class PromoFacility
    {
        // Constructor for JSON deserialize.
        public PromoFacility()
        {
        }

        public PromoFacility(Item item)
        {
            if (item == null)
            {
                return;
            }

            Title = item[Constants.Fields.PromoBlock.Title];
            Description = item[Constants.Fields.PromoBlock.Description];
            Image = item.GetMediaUrl(Constants.Fields.PromoBlock.Image);
            ExternalImage = new ImageData()
            {
                Small = item[Constants.Fields.ExternalImageItem.Small],
                Medium = item[Constants.Fields.ExternalImageItem.Medium],
                Large = item[Constants.Fields.ExternalImageItem.Large]
            };
        }

        public string Title { get; set; }

        public string Description { get; set; }

        public string Image { get; set; }

        public Link Link { get; set; }

        public ImageData ExternalImage { get; set; }
    }
}
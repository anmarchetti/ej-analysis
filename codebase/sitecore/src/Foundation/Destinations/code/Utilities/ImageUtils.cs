using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Utilities
{
    public class ImageUtils
    {
        /// <summary>
        /// Build collection of Sitecore/HotelBeds images
        /// taken from child Images Folder.
        /// </summary>
        /// <param name="item">Sitecore Item.</param>
        /// <returns>Collection of ImageData objects.</returns>
        public IEnumerable<ImageData> GetChildImages(Item item)
        {
            var imageFolder = item.Children.FirstOrDefault(x => x.TemplateID == Constants.TemplateIds.ImagesFolder);

            // Get images urls from items where ShowOnSite is checked
            var images = imageFolder?.Children
            .Where(x => x[Constants.Fields.BaseAppearance.ShowOnSite] == Constants.Common.CheckboxTrueValue)
            .Select(x =>
            {
                ImageData imgData = null;
                if (x.TemplateID == Constants.TemplateIds.ExternalImage)
                {
                    imgData = new ImageData
                    {
                        Id = x.ID.Guid,
                        Small = x[Constants.Fields.ExternalImageItem.Small],
                        Medium = x[Constants.Fields.ExternalImageItem.Medium],
                        Large = x[Constants.Fields.ExternalImageItem.Large],
                        Description = x[Constants.Fields.DatasourceItem.Description],
                    };
                }
                else if (x.TemplateID == Constants.TemplateIds.SitecoreImage)
                {
                    ImageField imageField = x.Fields[Constants.Fields.SitecoreImageItem.Image];
                    if (imageField?.MediaItem != null)
                    {
                        var image = new MediaItem(imageField.MediaItem);

                        // Get image urls for small, medium and large size. Sizes configured in settings
                        imgData = new ImageData()
                        {
                            Id = x.ID.Guid,
                            Small = image.GetSmallImageUrl(),
                            Medium = image.GetMediumImageUrl(),
                            Large = image.GetLargeImageUrl()
                        };
                    }
                }

                return imgData;
            })
            .Where(x => x != null);

            return images;
        }
    }
}
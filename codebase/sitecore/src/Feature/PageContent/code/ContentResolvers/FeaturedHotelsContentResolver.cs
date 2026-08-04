using System;
using System.Linq;
using easyJet.Feature.PageContent.Models;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Models;
using Newtonsoft.Json.Linq;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Feature.PageContent.ContentResolvers
{
    public class FeaturedHotelsContentResolver : RenderingContentsResolver, IRenderingContentsResolver
    {
        /// <summary>
        /// Resolve content for featured hotels.
        /// </summary>
        /// <param name="rendering">Sitecore rendering.</param>
        /// <param name="renderingConfig">Rendering configuration.</param>
        /// <returns>Resolved content.</returns>
        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            try
            {
                var item = GetContextItem(rendering, renderingConfig);

                if (item == null)
                {
                    return null;
                }

                var result = ProcessItem(item, rendering, renderingConfig);

                result["FeaturedHotels"] = JArray.FromObject(((MultilistField)item.Fields[Constants.Fields.FeaturedHotelsItem.FeaturedHotels])
                    .GetItems()
                    .Select(x => new
                    {
                        GiataCode = x[DestinationsConstants.Fields.AccommodationItem.GiataCode],
                        Url = x.GetItemUrl(),
                        Image = GetImage(x),
                        Name = x[DestinationsConstants.Fields.DatasourceItem.Name],
                        BookFrom = GetIsoDate(x, DestinationsConstants.Fields.AccommodationItem.FeaturedHotelDate),
                        BookFromText = x[DestinationsConstants.Fields.AccommodationItem.FeaturedHotelDateText],
                        BookFromTitle = x[DestinationsConstants.Fields.AccommodationItem.FeaturedHotelBookFromTitle],
                        StarRating = x[DestinationsConstants.Fields.AccommodationItem.StarRating],
                        Region = x.Parent?.Parent[DestinationsConstants.Fields.DatasourceItem.Name],
                        Country = x.Parent?.Parent?.Parent[DestinationsConstants.Fields.DatasourceItem.Name]
                    }));

                return result;
            }
            catch (Exception exc)
            {
                Log.Error($"{nameof(FeaturedHotelsContentResolver)} cannot resolve content", exc, this);
                return null;
            }
        }

        /// <summary>
        /// Get date in ISO format.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Field name.</param>
        /// <returns>Date in ISO format.</returns>
        private string GetIsoDate(Item item, string fieldName)
        {
            var date = ((DateField)item.Fields[fieldName])?.DateTime;
            return date.HasValue && date.Value != DateTime.MinValue ? DateUtil.ToServerTime(date.Value).ToString("o") : string.Empty;
        }

        /// <summary>
        /// Get sitecore image field.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>Sitecore image field.</returns>
        private SitecoreField<Image> GetImage(Item item)
        {
            var featuredHotelIamge = new SitecoreField<Image>(new Image(item.Fields[DestinationsConstants.Fields.AccommodationItem.FeaturedHotelImage], ImageSize.Large));
            if (!string.IsNullOrWhiteSpace(featuredHotelIamge.Value.Src))
            {
                return featuredHotelIamge;
            }
            else
            {
                var imageItem = item.Database.SelectSingleItem($"{item.QuerySafePath()}/*[@@templateId='{DestinationsConstants.TemplateIds.ImagesFolder}']")?.Children.FirstOrDefault();

                if (imageItem != null)
                {
                    if (imageItem.TemplateID.Equals(DestinationsConstants.TemplateIds.ExternalImage))
                    {
                        return new SitecoreField<Image>(new Image() { Src = imageItem[DestinationsConstants.Fields.ExternalImageItem.Large] });
                    }
                    else if (imageItem.TemplateID.Equals(DestinationsConstants.TemplateIds.SitecoreImage))
                    {
                        var imageField = new SitecoreField<Image>(new Image(imageItem.Fields[DestinationsConstants.Fields.SitecoreImageItem.Image], ImageSize.Large));

                        if (!string.IsNullOrWhiteSpace(imageField.Value.Src))
                        {
                            return imageField;
                        }
                    }
                }
            }

            return null;
        }
    }
}
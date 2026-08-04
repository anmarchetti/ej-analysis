using System;
using System.Linq;
using Sitecore.Data.Items;
using Sitecore.JavaScriptServices.Configuration;
using Sitecore.JavaScriptServices.ViewEngine.LayoutService.Pipelines.GetLayoutServiceContext;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;

namespace easyJet.Foundation.Destinations.Pipelines.GetLayoutServiceContext
{
    public class ExtendAccommodationForGoogleStructuredData : JssGetLayoutServiceContextProcessor
    {
        public ExtendAccommodationForGoogleStructuredData(IConfigurationResolver configurationResolver)
            : base(configurationResolver)
        {
        }

        protected override void DoProcess(GetLayoutServiceContextArgs args, AppConfiguration application)
        {
            if (args?.RenderedItem == null)
            {
                return;
            }

            var item = args.RenderedItem;

            if (!item.TemplateID.Equals(Constants.TemplateIds.Accommodation))
            {
                return;
            }

            var countryName = item.Axes?
                .GetAncestors()?
                .FirstOrDefault(a => a != null && a.TemplateID.Equals(Constants.TemplateIds.Country))?
                .Name;

            var imagesFolder = item.Children?
                .FirstOrDefault(c => c != null && string.Equals(c.Name, "Images", StringComparison.OrdinalIgnoreCase));

            var firstImage = imagesFolder?.Children?.FirstOrDefault();

            var imageUrl = firstImage?[Constants.Fields.ExternalImageItem.Small] ?? string.Empty;

            args.ContextData.Add("countryName", countryName);
            args.ContextData.Add("imageUrl", imageUrl);
        }
    }
}

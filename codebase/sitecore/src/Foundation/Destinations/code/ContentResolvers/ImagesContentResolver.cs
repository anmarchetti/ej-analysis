using System;
using System.Linq;
using easyJet.Foundation.Destinations.Utilities;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Foundation.Destinations.ContentResolvers
{
    public class ImagesContentResolver : RenderingContentsResolver
    {
        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            try
            {
                if (!UseContextItem)
                {
                    Log.Warn($"{nameof(ImagesContentResolver)} has to use context item mode", this);
                    return null;
                }

                Item contextItem = GetContextItem(rendering, renderingConfig);

                if (contextItem == null)
                {
                    Log.Warn($"{nameof(ImagesContentResolver)} can not resolve context item", this);
                    return null;
                }

                var images = new ImageUtils().GetChildImages(contextItem);

                return new
                {
                    Id = contextItem.Children.FirstOrDefault(x => x.TemplateID == Constants.TemplateIds.ImagesFolder)?.ID,
                    Images = images
                };
            }
            catch (Exception e)
            {
                Log.Error($"{nameof(ImagesContentResolver)} cannot resolve content", e, this);
                return null;
            }
        }
    }
}
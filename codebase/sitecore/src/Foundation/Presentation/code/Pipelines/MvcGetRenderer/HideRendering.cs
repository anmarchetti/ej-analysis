using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Services;
using Sitecore;
using Sitecore.Mvc.Pipelines.Response.GetRenderer;
using Sitecore.Personalization.Mvc.Presentation;

namespace easyJet.Foundation.Presentation.Pipelines.MvcGetRenderer
{
    public class HideRendering : SiteSpecificProcessor
    {
        private readonly IRenderingService renderingService;
        private readonly IPresentationLogger logger;

        public HideRendering(IRenderingService renderingService, IPresentationLogger logger)
        {
            this.logger = logger;
            this.renderingService = renderingService;
        }

        /// <summary>
        /// Hide rendering accross all pages in the Site.
        /// </summary>
        /// <param name="args">GetRendererArgs arguments.</param>
        public override void HandleRequest(GetRendererArgs args)
        {
            if (Context.Site == null)
            {
                return;
            }

            var renderingItem = args.Rendering.RenderingItem?.InnerItem;
            if (args.Result == null || renderingItem == null)
            {
                return;
            }

            if (renderingService.ShouldRenderingBeHidden(renderingItem))
            {
                logger.Debug($"Hiding {renderingItem.Name} (ID: {renderingItem.ID}) rendering.", this);
                args.Result = new EmptyRenderer();
            }
        }
    }
}
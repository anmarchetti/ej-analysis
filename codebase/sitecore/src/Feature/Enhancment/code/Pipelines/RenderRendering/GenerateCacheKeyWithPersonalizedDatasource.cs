using System;
using System.Linq;
using Sitecore.Data;
using Sitecore.Layouts;
using Sitecore.Mvc.Pipelines.Response.RenderRendering;
using Sitecore.Mvc.Presentation;
using Sitecore.Rules.ConditionalRenderings;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.RenderRendering
{
    public class GenerateCacheKeyWithPersonalizedDatasource : GenerateCacheKey
    {
        public GenerateCacheKeyWithPersonalizedDatasource(RendererCache rendererCache)
            : base(rendererCache)
        {
        }

        protected override string GenerateKey(Rendering rendering, RenderRenderingArgs args)
        {
            var cacheKey = base.GenerateKey(rendering, args);

            if (rendering.RenderingItem.InnerItem["VaryByPersonalizedData"] != null && rendering.RenderingItem.InnerItem["VaryByPersonalizedData"] == "1")
            {
                var allReferences = GetRenderingsForControl().ToList();
                var renderingUniqueId = ID.Parse(rendering.UniqueId);
                var renderingReference = allReferences.FirstOrDefault(i => ID.Parse(i.UniqueId).Equals(renderingUniqueId) && i.Settings.Rules.Count > 0);
                if (renderingReference != null)
                {
                    var ruleContext = new ConditionalRenderingsRuleContext(allReferences, renderingReference);
                    renderingReference.Settings.Rules.RunFirstMatching(ruleContext);

                    var personalizedDatasource = ruleContext.Reference.Settings.DataSource;
                    cacheKey = string.Concat(cacheKey, string.Concat("_#personalizedData:", personalizedDatasource));
                }
            }

            return cacheKey;
        }

        private RenderingReference[] GetRenderingsForControl()
        {
            var item = Sitecore.Context.Item;
            if (item != null)
            {
                var device = Sitecore.Context.Device;
                var renderings = item.Visualization.GetRenderings(device, true);

                return renderings;
            }

            return Array.Empty<RenderingReference>();
        }
    }
}
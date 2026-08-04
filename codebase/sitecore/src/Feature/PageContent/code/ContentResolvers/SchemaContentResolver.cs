using System;
using easyJet.Feature.PageContent.Services;
using Sitecore;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Feature.PageContent.ContentResolvers
{
    public class SchemaContentResolver : RenderingContentsResolver, IRenderingContentsResolver
    {
        private readonly ISchemaFactory schemaFactory;

        public SchemaContentResolver(ISchemaFactory schemaFactory)
        {
            this.schemaFactory = schemaFactory;
        }

        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            try
            {
                if (!Context.PageMode.IsNormal)
                {
                    return null;
                }

                var item = GetContextItem(rendering, renderingConfig);

                if (item == null)
                {
                    return null;
                }

                var result = new
                {
                    Schema = schemaFactory.GetSchema(item).ToString()
                };

                return result;
            }
            catch (Exception exc)
            {
                Log.Error($"{nameof(SchemaContentResolver)} cannot resolve content", exc, this);
                return null;
            }
        }
    }
}
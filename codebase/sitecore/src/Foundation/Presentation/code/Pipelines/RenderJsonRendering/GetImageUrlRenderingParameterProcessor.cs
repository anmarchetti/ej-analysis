using System;
using System.Collections.Generic;
using easyJet.Foundation.Presentation.Logging;
using Sitecore.Abstractions;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Presentation.Pipelines.RenderJsonRendering;
using Sitecore.Xml;

namespace easyJet.Foundation.Presentation.Pipelines.RenderJsonRendering
{
    public class GetImageUrlRenderingParameterProcessor : IRenderJsonRenderingProcessor
    {
        private readonly BaseMediaManager mediaManager;
        private readonly IPresentationLogger logger;

        public GetImageUrlRenderingParameterProcessor(BaseMediaManager mediaManager, IPresentationLogger logger)
        {
            this.mediaManager = mediaManager;
            this.logger = logger;
        }

        /// <summary>
        /// Change image data to image url in rendering parameters.
        /// </summary>
        /// <param name="args">Rendering args.</param>
        public void Process(RenderJsonRenderingArgs args)
        {
            var renderingParams = new Dictionary<string, string>(args.Result.RenderingParams);
            foreach (var renderingParam in renderingParams)
            {
                // Assume that XML should starts with "<" and ends with ">". Otherwise - skip
                if (string.IsNullOrWhiteSpace(renderingParam.Value) || !(renderingParam.Value.StartsWith("<") && renderingParam.Value.EndsWith(">")))
                {
                    continue;
                }

                var imageId = XmlUtil.GetAttribute("mediaid", XmlUtil.LoadXml(renderingParam.Value));

                if (!string.IsNullOrWhiteSpace(imageId))
                {
                    try
                    {
                        MediaItem imageItem = Sitecore.Context.Database.GetItem(imageId);
                        args.Result.RenderingParams[renderingParam.Key] = mediaManager.GetMediaUrl(imageItem);
                    }
                    catch (Exception ex)
                    {
                        logger.Error($"Exception during setting imageItem url of imageItem with ID {imageId} to {renderingParam.Key} rendering parameter of rendering with ID {args.Rendering.RenderingItem.ID.ToString()} on item with ID {args.Rendering.Item.ID.ToString()}.", ex, this);
                    }
                }
            }
        }
    }
}
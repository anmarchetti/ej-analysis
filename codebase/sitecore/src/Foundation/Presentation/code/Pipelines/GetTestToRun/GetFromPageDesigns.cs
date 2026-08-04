using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml;
using easyJet.Foundation.Presentation.Extensions;
using easyJet.Foundation.Presentation.Logging;
using Sitecore.ContentTesting.Model.Data.Items;
using Sitecore.ContentTesting.Pipelines.GetTestToRun;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Globalization;
using Sitecore.Layouts;

namespace easyJet.Foundation.Presentation.Pipelines.GetTestToRun
{
    /// <summary>
    /// Get test definition from page designs.
    /// </summary>
    public class GetFromPageDesigns : GetTestToRunProcessor
    {
        private readonly IPresentationLogger logger;

        public GetFromPageDesigns(IPresentationLogger logger)
        {
            this.logger = logger;
        }

        /// <summary>
        /// Process pipeline which get test definition from page designs.
        /// And sets to <see cref="GetTestToRunArgs.TestDefinition"/> argument.
        /// </summary>
        /// <param name="args">GetTestToRunArgs arguments.</param>
        public override void Process(GetTestToRunArgs args)
        {
            try
            {
                Assert.ArgumentNotNull(args, nameof(args));
                Assert.ArgumentNotNull(args.HostItem, nameof(args.HostItem));

                var pageDesign = args.HostItem.GetMultivariantPageDesign();

                if (args.TestDefinition != null || pageDesign == null)
                {
                    return;
                }

                args.CustomData.Add(Constants.PageDesignArgsKey, pageDesign);

                IEnumerable<RenderingDefinition> renderings = GetRenderings(pageDesign, args.DeviceId);
                using (new LanguageSwitcher(args.HostItem.Language))
                {
                    foreach (RenderingDefinition renderingDefinition in renderings)
                    {
                        if (!string.IsNullOrEmpty(renderingDefinition.MultiVariateTest))
                        {
                            var item = args.HostItem.Database.GetItem(renderingDefinition.MultiVariateTest);
                            if (item != null)
                            {
                                TestDefinitionItem testDefinitionItem = new TestDefinitionItem(item.Parent);
                                if (!string.IsNullOrEmpty(testDefinitionItem.Language))
                                {
                                    if (testDefinitionItem.Language.Equals(args.HostItem.Language.Name))
                                    {
                                        args.TestDefinition = testDefinitionItem;
                                    }
                                }
                                else
                                {
                                    args.TestDefinition = testDefinitionItem;
                                }
                            }
                        }

                        if (args.TestDefinition != null)
                        {
                            break;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                logger.Error($"Something goes wrong during getting test from pade design. {ex.Message}", ex, this);
            }
        }

        /// <summary>
        /// Get renderings from Page Designs.
        /// </summary>
        /// <param name="pageDesign">Page design item.</param>
        /// <param name="deviceId">Device ID.</param>
        /// <returns>Collections of Rendering Definition.</returns>
        private IEnumerable<RenderingDefinition> GetRenderings(Item pageDesign, ID deviceId)
        {
            string xPathString = $"r/d[@id='{deviceId}']/r";

            var layoutField = new LayoutField(pageDesign);
            if (layoutField.InnerField == null)
            {
                return Enumerable.Empty<RenderingDefinition>();
            }

            var renderingDefinitions = new List<RenderingDefinition>();

            var renderings = layoutField.Data.SelectNodes(xPathString);
            foreach (XmlNode rendering in renderings)
            {
                var renderingDefinition = new RenderingDefinition().Parse(rendering.OuterXml);
                if (renderingDefinition != null)
                {
                    renderingDefinitions.Add(renderingDefinition);
                }
            }

            return renderingDefinitions;
        }
    }
}
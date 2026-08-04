using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Linq;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using PresentationConstants = easyJet.Foundation.Presentation.Constants;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    [Service(typeof(IRenderingIdExtractionService), Lifetime = Lifetime.Transient)]
    public class RenderingIdExtractionService : IRenderingIdExtractionService
    {
        private const int MaxTemplateInstancesToSample = 5;
        private const string DefaultDevicePath = "/sitecore/layout/Devices/Default";
        private readonly IDatabaseProvider databaseProvider;
        private readonly IFieldUtilsService fieldUtilsService;

        private readonly ISitecoreEnhancmentLogger logger;

        public RenderingIdExtractionService(ISitecoreEnhancmentLogger pLogger, IDatabaseProvider pDatabaseProvider, IFieldUtilsService pFieldUtilsService)
        {
            logger = pLogger;
            databaseProvider = pDatabaseProvider;
            fieldUtilsService = pFieldUtilsService;
        }

        public HashSet<ID> ExtractFromItemId(ID itemId)
        {
            var result = new HashSet<ID>();
            var items = GetItemsForPageId(itemId);
            foreach (var item in items)
            {
                result.UnionWith(ExtractFromItem(item));
            }

            if (result.Count == 0 && items.Count > 0)
            {
                ExtractFromItemVisualization(items[0], result);
            }

            return result;
        }

        /// <inheritdoc />
        public HashSet<ID> ExtractFromTemplateId(ID templateId)
        {
            var result = new HashSet<ID>();
            foreach (var item in GetItemsForTemplateId(templateId))
            {
                result.UnionWith(ExtractFromItem(item));
            }

            return result;
        }

        public IReadOnlyList<Item> GetItemsForPageId(ID pageItemId)
        {
            var result = new List<Item>();
            var page = databaseProvider.GetItem(pageItemId, DatabaseType.Master);
            if (page == null)
            {
                return result;
            }

            result.Add(page);
            var sv = page.Template?.StandardValues;
            if (sv != null)
            {
                result.Add(sv);
            }

            result.AddRange(GetPageDesignItemsForTemplate(page.TemplateID));
            return result;
        }

        public IReadOnlyList<Item> GetItemsForTemplateId(ID templateItemId)
        {
            var result = new List<Item>();
            var templateItem = databaseProvider.GetItem(templateItemId, DatabaseType.Master);
            if (templateItem != null)
            {
                var sv = new TemplateItem(templateItem).StandardValues;
                if (sv != null)
                {
                    result.Add(sv);
                }
            }

            // Sample a small number of real page instances so the UID dropdown shows
            // instance-level renderings (e.g. added via Final Layout), without scanning
            // the entire content tree. MaxTemplateInstancesToSample keeps this bounded.
            var instances = databaseProvider.SelectItems(
                $"fast://*[@@templateid='{templateItemId}']",
                DatabaseType.Master);
            if (instances != null)
            {
                foreach (var instance in instances.Take(MaxTemplateInstancesToSample))
                {
                    result.Add(instance);
                }
            }

            result.AddRange(GetPageDesignItemsForTemplate(templateItemId));
            return result;
        }

        public IReadOnlyList<Item> GetItemsForEcpRuleItem(Item ecpRuleItem)
        {
            if (ecpRuleItem == null)
            {
                return Array.Empty<Item>();
            }

            var pageFieldValue = ecpRuleItem[PresentationConstants.Fields.ExperienceContextProviderPage.Page];
            if (ID.TryParse(pageFieldValue, out var pageItemId))
            {
                return GetItemsForPageId(pageItemId);
            }

            var templateFieldValue = ecpRuleItem[PresentationConstants.Fields.ExperienceContextProviderPageTemplate.PageTemplate];
            if (ID.TryParse(templateFieldValue, out var templateItemId))
            {
                return GetItemsForTemplateId(templateItemId);
            }

            return Array.Empty<Item>();
        }

        /// <inheritdoc />
        public virtual HashSet<ID> ExtractFromItem(Item item)
        {
            var result = new HashSet<ID>();

            foreach (var fieldId in new[] { FieldIDs.LayoutField, FieldIDs.FinalLayoutField })
            {
                ExtractFromLayoutXml(fieldUtilsService.GetLayoutFieldValue(item.Fields[fieldId]), result);
            }

            return result;
        }

        public HashSet<ID> ExtractFromPageDesignsMatchingTemplate(ID templateId)
        {
            var result = new HashSet<ID>();

            foreach (var item in GetPageDesignItemsForTemplate(templateId))
            {
                result.UnionWith(ExtractFromItem(item));
            }

            return result;
        }

        public IReadOnlyList<Item> GetPageDesignItemsForTemplate(ID templateId)
        {
            var result = new List<Item>();
            var pageDesignsRoot = databaseProvider.GetItem(PresentationConstants.ItemIds.PageDesignsRoot, DatabaseType.Master);

            if (pageDesignsRoot == null || ID.IsNullOrEmpty(templateId))
            {
                return result;
            }

            foreach (Item pageDesign in pageDesignsRoot.Children)
            {
                if (!PageDesignAppliesToTemplate(pageDesign, templateId))
                {
                    continue;
                }

                result.Add(pageDesign);
                result.AddRange(GetPartialDesignItems(pageDesign));
            }

            return result;
        }

        /// <summary>
        ///     Extracts rendering definition IDs via <see cref="Sitecore.Data.Items.ItemVisualization.GetRenderings" />,
        ///     which assembles the full merged layout (base + delta). Used as a fallback when the raw
        ///     layout-field XML contains no <c>id</c> attributes (e.g. SXA delta format).
        /// </summary>
        protected virtual void ExtractFromItemVisualization(Item item, HashSet<ID> target)
        {
            try
            {
                var defaultDeviceItem = item.Database?.GetItem(DefaultDevicePath);
                if (defaultDeviceItem == null)
                {
                    return;
                }

                var device = new DeviceItem(defaultDeviceItem);
                var renderings = item.Visualization.GetRenderings(device, false);
                foreach (var rendering in renderings)
                {
                    if (!rendering.RenderingID.IsNull)
                    {
                        target.Add(rendering.RenderingID);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.Warn(
                    $"[RenderingIdExtraction] Failed to extract renderings via Visualization API: {ex.Message}",
                    GetType());
            }
        }

        private static bool PageDesignAppliesToTemplate(Item pageDesign, ID templateId)
        {
            var rawTemplates = pageDesign.Fields[PresentationConstants.Fields.PageDesign.PageTemplatesFieldId]?.Value;
            if (string.IsNullOrWhiteSpace(rawTemplates))
            {
                return false;
            }

            return rawTemplates
                .Split('|')
                .Any(t => ID.TryParse(t, out var parsedTemplateId) && parsedTemplateId == templateId);
        }

        private IEnumerable<Item> GetPartialDesignItems(Item pageDesign)
        {
            var rawPartials = pageDesign.Fields[PresentationConstants.Fields.PageDesign.PartialDesignsFieldId]?.Value;
            if (string.IsNullOrWhiteSpace(rawPartials))
            {
                yield break;
            }

            foreach (var idStr in rawPartials.Split('|'))
            {
                if (!ID.TryParse(idStr, out var partialId))
                {
                    continue;
                }

                var partialDesign = databaseProvider.GetItem(partialId, DatabaseType.Master);
                if (partialDesign != null)
                {
                    yield return partialDesign;
                }
            }
        }

        private void ExtractFromLayoutXml(string xml, HashSet<ID> target)
        {
            if (string.IsNullOrWhiteSpace(xml))
            {
                return;
            }

            try
            {
                var doc = XDocument.Parse(xml);

                foreach (var rElement in doc.Descendants("r"))
                {
                    var idAttr = rElement
                        .Attributes()
                        .FirstOrDefault(attribute => attribute.Name.LocalName == "id")
                        ?.Value;

                    if (ID.TryParse(idAttr, out var rendId))
                    {
                        target.Add(rendId);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.Warn(
                    $"[RenderingIdExtraction] Failed to parse layout XML: {ex.Message}",
                    GetType());
            }
        }
    }
}
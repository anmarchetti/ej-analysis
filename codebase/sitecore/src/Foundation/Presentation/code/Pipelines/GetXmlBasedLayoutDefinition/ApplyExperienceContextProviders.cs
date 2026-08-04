using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Xml.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Models;
using easyJet.Foundation.Presentation.Repositories;
using easyJet.Foundation.Presentation.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Mvc.Pipelines.Response.GetXmlBasedLayoutDefinition;

namespace easyJet.Foundation.Presentation.Pipelines.GetXmlBasedLayoutDefinition
{
    [Service(typeof(ApplyExperienceContextProviders), Lifetime = Lifetime.Singleton)]
    public class ApplyExperienceContextProviders : GetXmlBasedLayoutDefinitionProcessor
    {
        private readonly IHttpContextAccessor httpContextAccessor;
        private readonly IPresentationLogger logger;
        private readonly IRenderingReplacementService renderingReplacementService;
        private readonly IExperienceContextProviderRepository repository;
        private readonly ISitecoreContextProvider sitecoreContextProvider;

        public ApplyExperienceContextProviders(
            IHttpContextAccessor phttpContextAccessor,
            ISitecoreContextProvider psitecoreContextProvider,
            IPresentationLogger plogger,
            IExperienceContextProviderRepository prepository,
            IRenderingReplacementService pRenderingReplacementService)
        {
            repository = prepository;
            httpContextAccessor = phttpContextAccessor;
            sitecoreContextProvider = psitecoreContextProvider;
            logger = plogger;
            renderingReplacementService = pRenderingReplacementService;
        }

        /// <summary>
        ///     Processes the layout definition by applying active experience context provider configurations.
        /// </summary>
        /// <param name="args">The pipeline arguments containing the context item and layout XML.</param>
        public override void Process(GetXmlBasedLayoutDefinitionArgs args)
        {
            var stopwatch = Stopwatch.StartNew();

            if (args == null || args.Result == null)
            {
                return;
            }

            var contextItem = args.ContextItem ?? sitecoreContextProvider.Item;
            if (contextItem == null)
            {
                return;
            }

            var httpContext = httpContextAccessor.GetCurrent();
            if (httpContext?.Request == null)
            {
                return;
            }

            var queryValue = httpContext.Request.QueryString[Constants.QueryStringParams.ExperienceContextProvider];

            if (string.IsNullOrWhiteSpace(queryValue))
            {
                return;
            }

            var pageConfigurations = repository.GetActiveProviderPages(queryValue, contextItem.ID).ToList();

            if (!pageConfigurations.Any())
            {
                return;
            }

            var globalVerboseLogging = repository.IsVerboseLoggingEnabled();
            ApplyPageRule(args.Result, pageConfigurations, contextItem, stopwatch, globalVerboseLogging);
        }

        private void ApplyPageRule(XElement layoutXml, List<ExperienceContextProviderPageRule> pageRules, Item contextItem, Stopwatch stopwatch, bool shouldLogVerbose)
        {
            pageRules = pageRules.Where(i => i?.HasRules == true).ToList();
            if (!pageRules.Any())
            {
                return;
            }

            var layoutElement = layoutXml.Elements().FirstOrDefault();
            if (layoutElement == null)
            {
                return;
            }

            if (shouldLogVerbose)
            {
                logger.Info(
                    $"{nameof(ApplyExperienceContextProviders)}.Execute started for page {contextItem?.Name} ({contextItem?.ID})",
                    this);
            }

            var renderingElements = layoutElement.Elements().ToList();

            if (shouldLogVerbose)
            {
                var templateName = contextItem?.Template?.Name ?? "Unknown";
                var allRenderingIds = renderingElements
                    .Select(e => e.Attribute("id")?.Value)
                    .Where(v => !string.IsNullOrWhiteSpace(v))
                    .ToList();

                logger.Info(
                    $"Source renderings for page \"{templateName}\" ({Environment.NewLine + string.Join("|", allRenderingIds)})",
                    this);
            }

            var renderingToRemove = new HashSet<ID>();

            foreach (var renderingElement in renderingElements)
            {
                ProcessRenderingElement(renderingElement, pageRules, renderingToRemove, shouldLogVerbose);
            }

            TryRemoveRendering(renderingElements, renderingToRemove, shouldLogVerbose);

            if (shouldLogVerbose)
            {
                stopwatch.Stop();
                logger.Info(
                    $"{nameof(ApplyExperienceContextProviders)}.Execute completed",
                    this);
            }
        }

        private void ProcessRenderingElement(XElement renderingElement, List<ExperienceContextProviderPageRule> pageRules, HashSet<ID> renderingToRemove, bool shouldLogVerbose)
        {
            if (!ID.TryParse(renderingElement.Attribute("id")?.Value, out var renderingId))
            {
                return;
            }

            Guid.TryParse(renderingElement.Attribute("uid")?.Value, out var instanceUid);

            foreach (var pageRule in pageRules)
            {
                if (!pageRule.TryGetJustRemoveMapping(renderingId, instanceUid, out var justRemoveMapping))
                {
                    continue;
                }

                if (shouldLogVerbose)
                {
                    logger.Info($"Just Remove mapping found for rendering {renderingId}, removing", this);
                }

                if (justRemoveMapping.Uid != Guid.Empty)
                {
                    renderingElement.Remove();
                }
                else
                {
                    renderingToRemove.Add(renderingId);
                }

                return;
            }

            foreach (var pageRule in pageRules)
            {
                if (renderingReplacementService.TryApplyReplacement(renderingElement, renderingId, pageRule.RenderingReplacements))
                {
                    if (shouldLogVerbose)
                    {
                        logger.Info($"[ECP] Replaced rendering {renderingId}", this);
                    }

                    return;
                }

                if (!pageRule.RenderingReplacements[renderingId].Any(m => !m.IsJustRemove && m.Uid == Guid.Empty)
                    && !pageRule.ShouldRemoveByAllowedList(renderingId))
                {
                    continue;
                }

                if (shouldLogVerbose)
                {
                    logger.Info("Removing rendering", this);
                }

                renderingToRemove.Add(renderingId);
                return;
            }

            if (shouldLogVerbose)
            {
                logger.Info($"Keeping rendering {renderingId}. Reason=Allowed or replaced successfully", this);
            }
        }

        private void TryRemoveRendering(List<XElement> renderingElements, HashSet<ID> renderingToRemove, bool shouldLogVerbose)
        {
            try
            {
                if (renderingElements.Count == 0 || renderingToRemove.Count == 0)
                {
                    return;
                }

                for (var i = renderingElements.Count - 1; i >= 0; i--)
                {
                    var node = renderingElements[i];
                    var nodeId = node.Attribute("id");

                    if (nodeId == null || !ID.TryParse(nodeId.Value, out var id) || !renderingToRemove.Contains(id))
                    {
                        continue;
                    }

                    if (shouldLogVerbose)
                    {
                        logger.Info(
                            "Removing rendering element from layout",
                            this);
                    }

                    node.Remove();
                }
            }
            catch (Exception e)
            {
                logger.Error($"{nameof(TryRemoveRendering)} has thrown an exception in {nameof(ApplyExperienceContextProviders)}", e, this);
            }
        }
    }
}
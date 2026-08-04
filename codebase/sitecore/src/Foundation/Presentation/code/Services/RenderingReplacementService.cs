using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;

namespace easyJet.Foundation.Presentation.Services
{
    [Service(typeof(IRenderingReplacementService), Lifetime = Lifetime.Singleton)]
    public class RenderingReplacementService : IRenderingReplacementService
    {
        private static readonly HashSet<string> WellKnownKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Placeholder",
            "Data Source",
            "Caching",
        };

        private readonly IDatabaseProvider databaseProvider;
        private readonly IUrlDecodingService urlDecodingService;
        private readonly IPresentationLogger logger;

        public RenderingReplacementService(IUrlDecodingService pUrlDecodingService, IDatabaseProvider pDatabaseProvider, IPresentationLogger pLogger = null)
        {
            urlDecodingService = pUrlDecodingService;
            databaseProvider = pDatabaseProvider;
            logger = pLogger;
        }

        /// <inheritdoc/>
        public void ReplaceRendering(XElement renderingElement, RenderingMapping mapping)
        {
            var sourceUid = renderingElement.Attribute("uid")?.Value;
            if (string.IsNullOrWhiteSpace(sourceUid) || !Guid.TryParse(sourceUid, out _))
            {
                throw new InvalidOperationException("Cannot replace a rendering that has no uid attribute.");
            }

            renderingElement.RemoveAttributes();

            renderingElement.SetAttributeValue("id", mapping.ValueId.ToString());
            renderingElement.SetAttributeValue("uid", sourceUid);

            if (string.IsNullOrWhiteSpace(mapping.Parameters))
            {
                return;
            }

            string decoded = urlDecodingService.UrlDecode(mapping.Parameters);
            string[] pairs = decoded.Split('&');

            List<string> remainingParams = new List<string>();

            foreach (string pair in pairs)
            {
                int separatorIndex = pair.IndexOf('=');
                if (separatorIndex < 0)
                {
                    remainingParams.Add(pair);
                    continue;
                }

                string key = pair.Substring(0, separatorIndex);
                string value = pair.Substring(separatorIndex + 1);

                if (WellKnownKeys.Contains(key))
                {
                    if (!string.IsNullOrWhiteSpace(value))
                    {
                        string attributeName = GetAttributeName(key);
                        renderingElement.SetAttributeValue(attributeName, value);
                    }
                }
                else
                {
                    remainingParams.Add(pair);
                }
            }

            string remaining = string.Join("&", remainingParams.Where(p => !string.IsNullOrEmpty(p)));
            if (!string.IsNullOrWhiteSpace(remaining))
            {
                renderingElement.SetAttributeValue("par", remaining);
            }
        }

        /// <inheritdoc/>
        public bool TryApplyReplacement(XElement renderingElement, ID renderingId, ILookup<ID, RenderingMapping> replacements)
        {
            try
            {
                if (replacements == null || !replacements.Contains(renderingId))
                {
                    return false;
                }

                RenderingMapping mapping;
                if (Guid.TryParse(renderingElement.Attribute("uid")?.Value, out var instanceUid) && instanceUid != Guid.Empty)
                {
                    mapping = replacements[renderingId].FirstOrDefault(m => !m.IsJustRemove && m.Uid == instanceUid && !ID.IsNullOrEmpty(m.ValueId))
                              ?? replacements[renderingId].FirstOrDefault(m => !m.IsJustRemove && m.Uid == Guid.Empty && !ID.IsNullOrEmpty(m.ValueId));
                }
                else
                {
                    mapping = replacements[renderingId].FirstOrDefault(m => !m.IsJustRemove && m.Uid == Guid.Empty && !ID.IsNullOrEmpty(m.ValueId));
                }

                if (mapping == null)
                {
                    return false;
                }

                var db = databaseProvider.GetDatabase(DatabaseType.Context);
                if (db?.GetItem(mapping.ValueId) == null)
                {
                    return false;
                }

                ReplaceRendering(renderingElement, mapping);
                return true;
            }
            catch (Exception ex)
            {
                logger?.Warn($"Failed to apply rendering replacement for renderingId {renderingId}.", ex, this);
                return false;
            }
        }

        private static string GetAttributeName(string wellKnownKey)
        {
            switch (wellKnownKey.ToLowerInvariant())
            {
                case "placeholder":
                    return "ph";
                case "data source":
                    return "ds";
                case "caching":
                    return "cac";
                default:
                    return wellKnownKey;
            }
        }
    }
}

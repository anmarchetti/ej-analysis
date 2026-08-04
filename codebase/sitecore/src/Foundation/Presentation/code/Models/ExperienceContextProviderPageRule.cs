using System;
using System.Collections.Generic;
using System.Linq;
using Sitecore.Data;

namespace easyJet.Foundation.Presentation.Models
{
    public class ExperienceContextProviderPageRule
    {
        private readonly HashSet<ID> allowedRenderings;
        private readonly ILookup<ID, RenderingMapping> replacements;

        public ExperienceContextProviderPageRule(
            ID pageItemId,
            IEnumerable<ID> allowedRenderingIds,
            IEnumerable<RenderingMapping> renderingReplacements,
            bool isTemplateBased = false)
        {
            PageItemId = pageItemId ?? ID.Null;
            IsTemplateBased = isTemplateBased;
            allowedRenderings = new HashSet<ID>((allowedRenderingIds ?? Enumerable.Empty<ID>()).Where(id => !ID.IsNullOrEmpty(id)));
            replacements = (renderingReplacements ?? Enumerable.Empty<RenderingMapping>())
                .Where(mapping => mapping != null && mapping.IsValid)
                .ToLookup(mapping => mapping.KeyId);
        }

        public ID PageItemId { get; }

        public bool IsTemplateBased { get; }

        public IReadOnlyCollection<ID> AllowedRenderings => allowedRenderings;

        public ILookup<ID, RenderingMapping> RenderingReplacements => replacements;

        public bool HasRules => allowedRenderings.Count > 0 || replacements.Count > 0;

        public bool AllowsRendering(ID renderingId)
        {
            return !ID.IsNullOrEmpty(renderingId) && allowedRenderings.Contains(renderingId);
        }

        public bool TryGetReplacement(ID renderingId, out RenderingMapping mapping)
        {
            mapping = null;

            if (ID.IsNullOrEmpty(renderingId) || replacements.Count == 0)
            {
                return false;
            }

            if (!replacements.Contains(renderingId))
            {
                return false;
            }

            mapping = replacements[renderingId].FirstOrDefault(m => m != null && !m.ValueId.IsNull);
            return mapping != null;
        }

        public bool TryGetJustRemoveMapping(ID renderingId, Guid instanceUid, out RenderingMapping mapping)
        {
            mapping = null;

            if (ID.IsNullOrEmpty(renderingId) || !replacements.Contains(renderingId))
            {
                return false;
            }

            mapping = instanceUid != Guid.Empty
                ? replacements[renderingId].FirstOrDefault(m => m.IsJustRemove && m.Uid == instanceUid)
                  ?? replacements[renderingId].FirstOrDefault(m => m.IsJustRemove && m.Uid == Guid.Empty)
                : replacements[renderingId].FirstOrDefault(m => m.IsJustRemove && m.Uid == Guid.Empty);

            return mapping != null;
        }

        public bool ShouldRemoveByAllowedList(ID renderingId)
        {
            return allowedRenderings.Count > 0 && !allowedRenderings.Contains(renderingId);
        }
    }
}

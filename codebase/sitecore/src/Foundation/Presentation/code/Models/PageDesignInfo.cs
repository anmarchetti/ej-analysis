using System;
using System.Collections.Generic;
using Sitecore.Data;

namespace easyJet.Foundation.Presentation.Models
{
    /// <summary>
    /// Cache-safe descriptor of a page design: its id plus the field values needed for matching
    /// (page templates, assigned Experience Context Providers, resolved RootItem path). Holds no
    /// live <c>Item</c> so it is safe to keep in cache across requests.
    /// </summary>
    internal sealed class PageDesignInfo
    {
        public PageDesignInfo(ID id, IReadOnlyList<ID> pageTemplateIds, IReadOnlyList<ID> experienceContextProviderIds, string rootItemPath)
        {
            Id = id;
            PageTemplateIds = pageTemplateIds ?? Array.Empty<ID>();
            ExperienceContextProviderIds = experienceContextProviderIds ?? Array.Empty<ID>();
            RootItemPath = rootItemPath;
        }

        public ID Id { get; }

        public IReadOnlyList<ID> PageTemplateIds { get; }

        public IReadOnlyList<ID> ExperienceContextProviderIds { get; }

        /// <summary>Full path of the RootItem target item; null/empty means "site root" (matches everything).</summary>
        public string RootItemPath { get; }
    }
}

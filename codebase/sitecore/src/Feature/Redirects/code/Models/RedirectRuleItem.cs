using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using Sitecore.Data;

namespace easyJet.Feature.Redirects.Models
{
    public class RedirectRuleItem
    {
        public ID Id { get; set; }

        public string FromUrl { get; set; }

        public string ToUrl { get; set; }

        public int RedirectType { get; set; }

        public string Comments { get; set; }

        public int Priority { get; set; }

        public string FilterPageTypes { get; set; }

        public HashSet<ID> FilterPageTypeIds { get; set; }

        public string CreatedBy { get; set; }

        public DateTime Created { get; set; }

        public int SortOrder { get; set; }

        public string ItemPath { get; set; }

        public bool IsWildcard { get; set; }

        public bool IsRegex { get; set; }

        public string NormalizedFromUrl { get; set; }

        public string GroupName { get; set; }

        public ID GroupId { get; set; }

        public string Languages { get; set; }

        public ImmutableHashSet<string> LanguageNames { get; set; }

        public RedirectRuleStatus Status { get; set; }

        public ID RelatedItemId { get; set; }
    }
}
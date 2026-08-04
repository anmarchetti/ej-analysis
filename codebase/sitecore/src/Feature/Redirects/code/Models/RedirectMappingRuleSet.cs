using System.Collections.Generic;
using System.Linq;
using Sitecore.Data;

namespace easyJet.Feature.Redirects.Models
{
    public class RedirectMappingRuleSet
    {
        public HashSet<ID> TemplateFilter { get; set; }

        public List<RedirectMapping> RedirectMappings { get; set; }

        /// <summary>
        /// Checks If template filter has been configured -> apply redirect rules for specific type of urls.
        /// Otherwise apply redirect rules for all type of urls.
        /// </summary>
        /// <param name="templateId">Page templated id.</param>
        /// <returns>True if template filter has been configured for <see cref="templateId"> page type</see>.</returns>
        public bool ShouldSkipRuleset(ID templateId)
        {
            if (templateId is null)
            {
                return false;
            }

            if (TemplateFilter == null || !TemplateFilter.Any())
            {
                return false;
            }

            return !TemplateFilter.Contains(templateId);
        }
    }
}
using System.Collections.Generic;
using easyJet.Feature.Redirects.Models;
using Sitecore.Data;
using Sitecore.Globalization;

namespace easyJet.Feature.Redirects.Services
{
    public interface IRedirectRuleMatcher
    {
        RedirectRuleMatchResult FindMatch(string url, Database database, ID templateId = null, Language language = null);

        IReadOnlyCollection<RedirectRuleItem> GetRules(Database database);

        void ClearCache();
    }
}

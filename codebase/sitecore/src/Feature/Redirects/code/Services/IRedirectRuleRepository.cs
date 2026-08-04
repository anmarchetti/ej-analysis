using System.Collections.Generic;
using easyJet.Feature.Redirects.Models;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Feature.Redirects.Services
{
    public interface IRedirectRuleRepository
    {
        Item GetRulesRoot(Database database);

        IReadOnlyCollection<RedirectRuleItem> GetRules(Database database);

        Item GetRuleItemById(Database database, ID id);

        Item FindRule(Database database, string normalizedFromUrl, string languages, LanguageMaps languageMaps);

        Item CreateRule(Database database, RedirectRuleInput input);

        Item UpdateRule(Item item, RedirectRuleInput input);

        void DeleteRule(Item item);
    }
}

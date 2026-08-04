using System;
using System.Diagnostics.CodeAnalysis;
using easyJet.Feature.Redirects.Services;
using Sitecore.Diagnostics;

namespace easyJet.Feature.Redirects.Cache
{
    [ExcludeFromCodeCoverage]
    public class RedirectRulesCacheClearer
    {
        public void ClearCache(object sender, EventArgs args)
        {
            RedirectRulesCache.ClearAll();
            Log.Info("Redirect rules cache cleared.", this);
        }
    }
}

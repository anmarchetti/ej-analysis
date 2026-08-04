using System;
using System.Web;
using easyJet.Feature.Redirects.Cache;
using FluentAssertions;
using Xunit;

namespace easyJet.Feature.Redirects.Tests.Cache
{
    public class RedirectRulesCacheClearerTests
    {
        [Fact]
        public void ClearCache_ShouldRemoveRedirectRuleEntries()
        {
            var rulesKey = "easyJet-Redirect-Rules-master";
            var resolvedKey = "easyJet-Redirect-ResolvedMappings-master";
            HttpRuntime.Cache[rulesKey] = "rules";
            HttpRuntime.Cache[resolvedKey] = "resolved";

            var clearer = new RedirectRulesCacheClearer();
            clearer.ClearCache(this, EventArgs.Empty);

            HttpRuntime.Cache[rulesKey].Should().BeNull();
            HttpRuntime.Cache[resolvedKey].Should().BeNull();
        }
    }
}

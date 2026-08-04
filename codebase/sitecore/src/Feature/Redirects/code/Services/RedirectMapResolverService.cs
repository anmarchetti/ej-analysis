using System;
using System.Runtime.CompilerServices;
using easyJet.Feature.Redirects.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;

[assembly: InternalsVisibleTo("easyJet.Feature.Redirects.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Feature.Redirects.Services
{
    [Service(typeof(IRedirectMapResolverService), Lifetime = Lifetime.Transient)]
    public class RedirectMapResolverService : IRedirectMapResolverService
    {
        private BaseLinkManager LinkManager { get; }

        private IRedirectRuleMatcher RedirectRuleMatcher { get; }

        public RedirectMapResolverService(BaseLinkManager linkManager, IRedirectRuleMatcher redirectRuleMatcher)
        {
            LinkManager = linkManager;
            RedirectRuleMatcher = redirectRuleMatcher;
        }

        /// <inheritdoc/>
        public RedirectData GetRedirectData(Item item)
        {
            if (item == null)
            {
                return null;
            }

            var itemUrl = LinkManager.GetItemUrl(item);
            var match = RedirectRuleMatcher.FindMatch(itemUrl, item.Database, item.TemplateID, item.Language);

            if (match == null)
            {
                return null;
            }

            if (!(match.RelatedItemId is null) && !match.RelatedItemId.IsNull)
            {
                if (match.RelatedItemId != item.ID)
                {
                    return null;
                }

                return new RedirectData()
                {
                    PreserveQueryString = false,
                    RedirectType = match.RedirectType,
                    RedirectUrl = item.IsHotelItem() ? RedirectRuleHelper.ToHotelRedirectRuleUrl(itemUrl) : itemUrl
                };
            }

            return new RedirectData()
            {
                PreserveQueryString = false,
                RedirectType = match.RedirectType,
                RedirectUrl = match.ToUrl
            };
        }

        /// <inheritdoc/>
        public RedirectData GetRedirectData(string url, ID templateId = null, Language language = null)
        {
            if (string.IsNullOrWhiteSpace(url) || Sitecore.Context.Database == null)
            {
                return null;
            }

            var match = RedirectRuleMatcher.FindMatch(url, Sitecore.Context.Database, templateId, language);
            if (match == null)
            {
                return null;
            }

            return new RedirectData()
            {
                PreserveQueryString = false,
                RedirectType = match.RedirectType,
                RedirectUrl = match.ToUrl
            };
        }
    }
}

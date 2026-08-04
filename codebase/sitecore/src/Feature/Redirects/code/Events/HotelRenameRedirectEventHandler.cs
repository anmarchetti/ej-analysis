using System;
using easyJet.Feature.Redirects.Logging;
using easyJet.Feature.Redirects.Models;
using easyJet.Feature.Redirects.Services;
using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data.Items;
using Sitecore.Events;
using Sitecore.Sites;

namespace easyJet.Feature.Redirects.Events
{
    /// <summary>
    /// Creates an AwaitingPublish redirect rule whenever a hotel's display name (and therefore
    /// its URL) changes, so the old URL redirects to the new one once the change is published.
    /// </summary>
    public class HotelRenameRedirectEventHandler
    {
        private const string MasterDatabaseName = "master";
        private const string WebDatabaseName = "web";
        private const int PermanentRedirectType = 301;

        private readonly IRedirectRuleManagementService managementService;
        private readonly BaseLinkManager linkManager;
        private readonly BaseFactory factory;
        private readonly IRedirectsLogger logger;

        public HotelRenameRedirectEventHandler(
            IRedirectRuleManagementService managementService,
            BaseLinkManager linkManager,
            BaseFactory factory,
            IRedirectsLogger logger)
        {
            this.managementService = managementService;
            this.linkManager = linkManager;
            this.factory = factory;
            this.logger = logger;
        }

        public void OnItemSaved(object sender, EventArgs args)
        {
            try
            {
                if (Event.ExtractParameter(args, 0) is Item item
                    && Event.ExtractParameter(args, 1) is ItemChanges changes
                    && ShouldCreateRedirect(item, changes))
                {
                    CreateAwaitingPublishRedirect(item);
                }
            }
            catch (Exception ex)
            {
                logger.Error("Failed to create AwaitingPublish redirect for renamed hotel.", ex, this);
            }
        }

        private static bool ShouldCreateRedirect(Item item, ItemChanges changes)
        {
            return item.IsHotelItem()
                && item.Database.Name.Equals(MasterDatabaseName, StringComparison.OrdinalIgnoreCase)
                && changes.HasFieldsChanged
                && changes.FieldChanges.Contains(FieldIDs.DisplayName);
        }

        private static string ToSlug(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return value;
            }

            return value
                .Trim()
                .ToLowerInvariant()
                .Replace(" ", "-");
        }

        private void CreateAwaitingPublishRedirect(Item item)
        {
            // The currently published (web) item still carries the old display name, so its URL
            // is exactly the URL that will start to 404 once the new name is published.
            var webItem = factory.GetDatabase(WebDatabaseName)?.GetItem(item.ID, item.Language);
            if (webItem == null)
            {
                return;
            }

            // ^(/destinations)(.*)$ -> $2 redirect already covers the case
            if (ToSlug(item.Name) == ToSlug(webItem.DisplayName))
            {
                return;
            }

            string oldUrl;
            string newUrl;

            var siteContext = webItem.GetSiteContext();
            using (siteContext != null ? new SiteContextSwitcher(siteContext) : null)
            {
                oldUrl = RedirectRuleHelper.ToHotelRedirectRuleUrl(linkManager.GetItemUrl(webItem));
                newUrl = RedirectRuleHelper.ToHotelRedirectRuleUrl(linkManager.GetItemUrl(item));
            }

            if (string.IsNullOrWhiteSpace(oldUrl) || string.IsNullOrWhiteSpace(newUrl) || RedirectRuleHelper.IsSameUrl(oldUrl, newUrl))
            {
                return;
            }

            var input = new RedirectRuleInput
            {
                FromUrl = oldUrl,
                ToUrl = newUrl,
                RedirectType = PermanentRedirectType,
                GroupName = "Hotel redirects - 301",
                Status = RedirectRuleStatus.AwaitingPublish,
                RelatedItem = item.ID.ToString(),
                Languages = item.Language?.Name,
                Comments = $"Auto-created on hotel rename ({item.ID} - {item.Paths.FullPath})."
            };

            var rule = managementService.UpsertRule(item.Database, input, out var created, out var error);
            if (rule == null)
            {
                logger.Warn($"Could not create AwaitingPublish redirect for '{oldUrl}': {error}", this);
                return;
            }

            logger.Info(
                $"{(created ? "Created" : "Updated")} AwaitingPublish redirect '{oldUrl}' -> '{newUrl}'.",
                this);
        }
    }
}

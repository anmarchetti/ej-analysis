using System.Collections.Generic;
using easyJet.Foundation.Presentation.Models;
using Sitecore.Data;

namespace easyJet.Foundation.Presentation.Repositories
{
    public interface IExperienceContextProviderRepository
    {
        IReadOnlyCollection<ExperienceContextProviderPageRule> GetActiveProviderPages(string providerIdentifier, ID contextItemId);

        ExperienceContextProviderConfig GetActiveProvider(string providerIdentifier);

        /// <summary>
        /// Checks if a provider with the given identifier is configured (active) for the specified page ID.
        /// </summary>
        /// <param name="identifier">The provider identifier to check.</param>
        /// <param name="pageId">The page item ID to validate against.</param>
        /// <returns>True if the provider is configured for this page; otherwise false.</returns>
        bool IsProviderActiveForPage(string identifier, ID pageId);

        /// <summary>
        /// Gets the provider item ID for the specified identifier.
        /// </summary>
        /// <param name="identifier">The provider identifier to look up.</param>
        /// <returns>The provider item ID, or null if not found or not active.</returns>
        ID GetProviderItemId(string identifier);

        bool IsVerboseLoggingEnabled();

        IEnumerable<string> GetProviders();

        /// <summary>
        /// Gets the ECP page rule for the given rule item ID (page-based or template-based).
        /// Returns null if the item is not a recognised ECP rule item or does not exist.
        /// </summary>
        ExperienceContextProviderPageRule GetRuleForItem(ID ruleItemId);

        bool IsValidIdentifier(string identifier);
    }
}

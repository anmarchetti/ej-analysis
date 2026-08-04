using System.Collections.Generic;
using easyJet.Foundation.Presentation.Models;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Presentation.Repositories
{
    /// <summary>
    /// Resolves the page designs that apply to a given content item, honouring the page template, the
    /// RootItem scoping and Experience Context Provider assignments.
    /// </summary>
    public interface IPageDesignRepository
    {
        /// <summary>
        /// Returns every page design that applies to <paramref name="item"/>, one per Experience Context Provider.
        /// <para>
        /// The list is built from all page designs matching the item's template whose RootItem is an
        /// ancestor-or-self of the item. They are grouped by Experience Context Provider; within each group only
        /// the design with the deepest (most path segments) matching RootItem is kept.
        /// </para>
        /// The first element (when present) is the standard design that has no Experience Context Provider
        /// assigned; the remaining elements are the provider-bound designs.
        /// </summary>
        /// <param name="item">The content item being resolved.</param>
        /// <returns>The matching designs paired with their provider; empty when none match.</returns>
        IReadOnlyList<PageDesignMatch> GetMatchingPageDesigns(Item item);

        /// <summary>
        /// Resolves the single page design that should render for <paramref name="item"/>.
        /// When <paramref name="experienceContextProviderIdentifier"/> is supplied and the provider is active for
        /// the page, the provider-bound design is returned; otherwise the standard design is returned.
        /// </summary>
        /// <param name="item">The content item being rendered.</param>
        /// <param name="experienceContextProviderIdentifier">The active ECP identifier (e.g. from the <c>ecp</c> query string), or null.</param>
        /// <returns>The page design to render, or null when none applies.</returns>
        Item ResolveActivePageDesign(Item item, string experienceContextProviderIdentifier);
    }
}

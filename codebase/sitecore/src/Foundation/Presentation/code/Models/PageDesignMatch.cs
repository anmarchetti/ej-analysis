using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Presentation.Models
{
    /// <summary>
    /// A page design resolved for a context item, paired with the Experience Context Provider it is bound to.
    /// The standard (provider-agnostic) design carries <see cref="ID.Null"/> as <see cref="ExperienceContextProviderId"/>.
    /// </summary>
    public sealed class PageDesignMatch
    {
        public PageDesignMatch(Item pageDesign, ID experienceContextProviderId)
        {
            PageDesign = pageDesign;
            ExperienceContextProviderId = experienceContextProviderId ?? ID.Null;
        }

        /// <summary>The resolved page design item.</summary>
        public Item PageDesign { get; }

        /// <summary>The Experience Context Provider this design is bound to, or <see cref="ID.Null"/> for the standard design.</summary>
        public ID ExperienceContextProviderId { get; }

        /// <summary><c>true</c> when this match is bound to an Experience Context Provider.</summary>
        public bool HasExperienceContextProvider => !ExperienceContextProviderId.IsNull;
    }
}

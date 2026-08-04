using System;
using System.Collections.Generic;
using System.Linq;

namespace easyJet.Foundation.Presentation.Models
{
    public class ExperienceContextProviderConfig
    {
        public ExperienceContextProviderConfig(string identifier, IEnumerable<ExperienceContextProviderPageRule> pages)
        {
            Identifier = identifier ?? string.Empty;
            Pages = pages?.Where(p => p != null && !p.PageItemId.IsNull).ToArray() ?? Array.Empty<ExperienceContextProviderPageRule>();
        }

        public string Identifier { get; }

        public IReadOnlyCollection<ExperienceContextProviderPageRule> Pages { get; }
    }
}

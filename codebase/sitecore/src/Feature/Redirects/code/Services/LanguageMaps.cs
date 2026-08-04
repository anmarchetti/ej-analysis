using System;
using System.Collections.Generic;
using Sitecore.Data;

namespace easyJet.Feature.Redirects.Services
{
    public class LanguageMaps
    {
        public LanguageMaps(
            IReadOnlyDictionary<ID, string> namesById,
            IReadOnlyDictionary<string, string> idsByName)
        {
            NamesById = namesById ?? new Dictionary<ID, string>();
            IdsByName = idsByName ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        public IReadOnlyDictionary<ID, string> NamesById { get; }

        public IReadOnlyDictionary<string, string> IdsByName { get; }
    }
}
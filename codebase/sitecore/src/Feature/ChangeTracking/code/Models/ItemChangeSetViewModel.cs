using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using Sitecore.Data;

namespace easyJet.Feature.ChangeTracking.Models
{
    [ExcludeFromCodeCoverage]
    public class ItemChangeSetViewModel
    {
        public string Path { get; set; }

        public ID ItemId { get; set; }

        public string EditorUrl { get; set; }

        public List<ChangeViewModel> Changes { get; set; }
    }
}
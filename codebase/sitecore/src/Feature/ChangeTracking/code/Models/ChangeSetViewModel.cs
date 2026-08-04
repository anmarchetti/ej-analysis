using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Feature.ChangeTracking.Models
{
    [ExcludeFromCodeCoverage]
    public class ChangeSetViewModel
    {
        public DateTime SessionStart { get; set; }

        public DateTime SessionEnd { get; set; }

        public List<ItemChangeSetViewModel> Items { get; set; }

        public string Author { get; set; }

        public List<int> Versions { get; set; }

        public int NumChanges { get; set; }
    }
}

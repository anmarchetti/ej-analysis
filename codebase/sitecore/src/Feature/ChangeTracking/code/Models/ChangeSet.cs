using System;
using System.Collections.Generic;

namespace easyJet.Feature.ChangeTracking.Models
{
    public class ChangeSet
    {
        public DateTime SessionStart { get; set; }

        public DateTime SessionEnd { get; set; }

        public string Author { get; set; }

        public int Version { get; set; }

        public List<Change> Changes { get; set; }
    }
}

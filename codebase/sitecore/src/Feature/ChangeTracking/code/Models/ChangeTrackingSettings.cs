using System.Collections.Generic;
using Sitecore.Data;

namespace easyJet.Feature.ChangeTracking.Models
{
    public class ChangeTrackingSettings
    {
        public HashSet<ID> Templates { get; set; } = new HashSet<ID>();

        public HashSet<ID> ExcludedFields { get; set; } = new HashSet<ID>();

        public bool IsEnabled { get; set; }
    }
}
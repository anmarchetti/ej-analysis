using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace easyJet.Feature.ChangeTracking.Models
{
    [Table("[easyJet.Feature.ChangeTracking.ItemChanges]")]
    public class ChangeTrackingItemChange : Change
    {
        [Required]
        [StringLength(1)]
        public string Action { get; set; }

        [StringLength(512)]
        public string OldPath { get; set; }

        public Guid OldParentItemId { get; set; }

        public Guid ParentItemId { get; set; }
    }
}

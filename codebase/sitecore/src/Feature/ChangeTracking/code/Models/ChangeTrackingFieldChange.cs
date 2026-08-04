using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace easyJet.Feature.ChangeTracking.Models
{
    [Table("[easyJet.Feature.ChangeTracking.FieldChanges]")]
    public class ChangeTrackingFieldChange : Change
    {
        public Guid FieldId { get; set; }

        public string Value { get; set; }

        public string OldValue { get; set; }
    }
}

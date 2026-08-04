using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace easyJet.Feature.Tracker.Models.Personalize
{
    [Table("[easyJet.Feature.Personalize.Tracking]")]
    public class PersonalizationTrackingItem
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public string BookingReference { get; set; }

        public string Experience { get; set; }

        public string AttributeId { get; set; }

        public decimal Price { get; set; }

        public string Currency { get; set; }

        public DateTime Date { get; set; }
    }
}

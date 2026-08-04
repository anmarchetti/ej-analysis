using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace easyJet.Feature.ChangeTracking.Models
{
    public class Change
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public DateTime Date { get; set; }

        public Guid ItemId { get; set; }

        public Guid TemplateId { get; set; }

        [StringLength(512)]
        public string Path { get; set; }

        public string Language { get; set; }

        public int Version { get; set; }

        public bool IsLatestVersion { get; set; }

        public string Author { get; set; }
    }
}

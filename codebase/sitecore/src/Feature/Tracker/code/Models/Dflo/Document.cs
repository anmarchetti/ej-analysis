using System;
using Newtonsoft.Json;

namespace easyJet.Feature.Tracker.Models.Dflo
{
    public class Document
    {
        [JsonProperty("ID")]
        public string Id { get; set; }

        [JsonProperty("Batch_ID")]
        public string BatchId { get; set; }

        [JsonProperty("Document")]
        public string Subject { get; set; }

        [JsonProperty("EmailAdd")]
        public string Email { get; set; }

        [JsonProperty("ResId")]
        public string ResId { get; set; }

        [JsonProperty("DateStored")]
        public DateTime DateStored { get; set; }

        [JsonProperty("DocType")]
        public string[] DocType { get; set; }
    }
}

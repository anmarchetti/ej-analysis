using System;

namespace easyJet.Foundation.HotelBeds.Reports.Models
{
    internal class FailedImageSyncRecord
    {
        public DateTime DateTime { get; set; }

        public string HotelBedsCode { get; set; }

        public string ImageItemId { get; set; }

        public string ImageItemPath { get; set; }

        public string Field { get; set; }

        public string SourceUrl { get; set; }

        public string Error { get; set; }
    }
}

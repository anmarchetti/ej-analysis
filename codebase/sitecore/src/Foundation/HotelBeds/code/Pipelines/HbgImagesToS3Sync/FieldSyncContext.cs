using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Reports.Models;
using Sitecore.Data.Items;

namespace easyJet.Foundation.HotelBeds.Pipelines.HbgImagesToS3Sync
{
    internal sealed class FieldSyncContext
    {
        public Item ImageItem { get; set; }

        public string HotelBedsCode { get; set; }

        public ICollection<FailedImageSyncRecord> FailedRecords { get; set; }

        public IDictionary<string, string> Changes { get; set; }
    }
}

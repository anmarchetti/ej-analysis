using System;

namespace easyJet.Foundation.AmazonS3.Reports.Models
{
    public class HotelImageStatusRecord
    {
        public string HotelCode { get; set; }

        public string ImageName { get; set; }

        public Status Status { get; set; }

        public string Message { get; set; }

        public DateTime DateTime { get; set; }
    }
}
using System;

namespace easyJet.Foundation.AmazonS3.Exceptions
{
    public class ImageSyncAbandonedException : Exception
    {
        public string ImageCode { get; set; }

        public string HotelCode { get; set; }

        public ImageSyncAbandonedException(string imageCode, string hotelCode, string message)
            : base(message)
        {
            ImageCode = imageCode;
            HotelCode = hotelCode;
        }
    }
}
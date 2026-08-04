using Amazon;

namespace easyJet.Foundation.AmazonS3.Models
{
    public class S3Settings
    {
        public string AcmiBucketName { get; set; }

        public string ImageBucketName { get; set; }

        public int SmallImageSize { get; set; }

        public int MediumImageSize { get; set; }

        public int LargeImageSize { get; set; }

        public string SitecoreImagesPath { get; set; }

        public string ReportPath { get; set; }

        public bool AllowDeleteImagesFromS3 { get; set; }

        public int ImageReportLifeSpanInDays { get; set; }

        public string RegionName { get; set; }

        public RegionEndpoint Region => string.IsNullOrEmpty(RegionName) ? null : RegionEndpoint.GetBySystemName(RegionName);
    }
}

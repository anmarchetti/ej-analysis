using System;
using Amazon.S3;
using Amazon.S3.Model;
using easyJet.Foundation.AmazonS3.Models;
using easyJet.Foundation.AmazonS3.Services.Base;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Models;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.AmazonS3.Services
{
    [Service(typeof(IAmazonS3AcmiBucketService), Lifetime = Lifetime.Singleton)]
    public sealed class AmazonS3AcmiBucketService : BaseAmazonS3Service, IAmazonS3AcmiBucketService
    {
        protected override string BucketName => Settings.AcmiBucketName;

        protected override string Region => Settings.RegionName;

        protected override string BucketUrl => $"https://{BucketName}.s3-{Region}.amazonaws.com/";

        protected override S3Settings Settings => SettingsService.GetSettings();

        public AmazonS3AcmiBucketService(ISettingsService settingsService, IAmazonS3 client)
            : base(settingsService, client)
        {
        }

        public bool UploadFile(CsvFile file)
        {
            try
            {
                var relativeUrl = GenerateKey(file.MediaItem, DateTime.Now.Ticks.ToString());

                Client.PutObject(new PutObjectRequest
                {
                    InputStream = file.Stream,
                    Key = relativeUrl,
                    BucketName = BucketName,
                    ContentType = file.ContentType,
                    CannedACL = S3CannedACL.Private,
                });

                return true;
            }
            catch (Exception ex)
            {
                Log.Error($"Something went wrong while uploading file: {ex}", this);
                return false;
            }
        }

        protected override string GenerateKey(MediaItem mediaItem, string version) => $"{mediaItem.Name.Replace(" ", "_")}-{version}.{mediaItem.Extension}";
    }
}

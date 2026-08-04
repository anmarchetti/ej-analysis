using System.Collections.Generic;
using System.Linq;
using Amazon.S3;
using Amazon.S3.Model;
using easyJet.Foundation.AmazonS3.Models;
using Sitecore.Data.Items;

namespace easyJet.Foundation.AmazonS3.Services.Base
{
    public abstract class BaseAmazonS3Service
    {
        protected readonly ISettingsService SettingsService;

        protected readonly IAmazonS3 Client;

        protected abstract string BucketName { get; }

        protected abstract string Region { get; }

        protected abstract string BucketUrl { get; }

        protected abstract S3Settings Settings { get; }

        protected BaseAmazonS3Service(ISettingsService settingsService, IAmazonS3 client)
        {
            SettingsService = settingsService;
            Client = client;
        }

        protected virtual string GenerateKey(MediaItem mediaItem, string version)
        {
            if (mediaItem == null)
            {
                return string.Empty;
            }

            Item item = mediaItem;
            var parentName = item?.Parent?.Name ?? string.Empty;

            return version == null ? $"{parentName}/{mediaItem.Name}.{mediaItem.Extension}" :
                $"{parentName}/{version}/{mediaItem.Name}.{mediaItem.Extension}";
        }

        protected virtual List<KeyVersion> GetKeys(IEnumerable<string> urlPaths)
        {
            List<KeyVersion> keys = urlPaths
                .Select(path => path.Replace(BucketUrl, string.Empty))
                .Where(path => !string.IsNullOrEmpty(path))
                .Select(path => new KeyVersion() { Key = path })
                .ToList();

            return keys;
        }
    }
}

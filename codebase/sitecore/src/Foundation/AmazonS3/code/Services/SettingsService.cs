using easyJet.Foundation.AmazonS3.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Abstractions;

namespace easyJet.Foundation.AmazonS3.Services
{
    [Service(typeof(ISettingsService), Lifetime = Lifetime.Transient)]
    public class SettingsService : ISettingsService
    {
        private readonly BaseSettings settings;

        public SettingsService(BaseSettings settings)
        {
            this.settings = settings;
        }

        public S3Settings GetSettings()
        {
            return new S3Settings
            {
                AcmiBucketName = settings.GetSetting(Constants.Settings.AcmiBucketNameSettingsName),
                RegionName = settings.GetSetting(Constants.Settings.RegionSettingsName),
                AllowDeleteImagesFromS3 = settings.GetBoolSetting(Constants.Settings.AllowDeleteImagesFromS3SettingsName, Constants.Settings.AllowDeleteImagesFromS3DefaultValue),
                ImageBucketName = settings.GetSetting(Constants.Settings.ImageBucketNameSettingsName),
                ImageReportLifeSpanInDays = settings.GetIntSetting(Constants.Settings.ImageReportLifeSpanInDaysSettingsName, Constants.Settings.ImageReportLifeSpanInDaysDefaultValue),
                LargeImageSize = settings.GetIntSetting(Constants.Settings.ImageSizeLargeSettingsName, Constants.Settings.LargeImageSizeDefaultValue),
                MediumImageSize = settings.GetIntSetting(Constants.Settings.ImageSizeMediumSettingsName, Constants.Settings.MediumImageSizeDefaultValue),
                ReportPath = settings.GetSetting(Constants.Settings.ReportPathSettingsName),
                SitecoreImagesPath = settings.GetSetting(Constants.Settings.SitecoreImagesPathSettingsName),
                SmallImageSize = settings.GetIntSetting(Constants.Settings.ImageSizeSmallSettingsName, Constants.Settings.SmallImageSizeDefaultValue)
            };
        }
    }
}

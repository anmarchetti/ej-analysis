using easyJet.Foundation.AmazonS3.Models;

namespace easyJet.Foundation.AmazonS3.Services
{
    public interface ISettingsService
    {
        S3Settings GetSettings();
    }
}
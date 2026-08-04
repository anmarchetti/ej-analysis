using easyJet.Foundation.SitecoreExtensions.Models;

namespace easyJet.Foundation.AmazonS3.Services
{
    public interface IAmazonS3AcmiBucketService
    {
        bool UploadFile(CsvFile stream);
    }
}

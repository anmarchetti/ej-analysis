using Amazon.SQS;

namespace easyJet.Feature.ScrappingTrigger.Services
{
    public interface IScrapingTriggerClientService
    {
        IAmazonSQS GetClient();
    }
}
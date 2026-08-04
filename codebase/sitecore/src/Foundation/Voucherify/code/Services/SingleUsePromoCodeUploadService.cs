using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.DynamoDb.Factory;
using easyJet.Foundation.DynamoDb.Models;
using easyJet.Foundation.DynamoDb.Repositories.Base;

namespace easyJet.Foundation.Voucherify.Services
{
    [Service(typeof(ISingleUsePromoCodeUploadService), Lifetime = Lifetime.Transient)]
    public class SingleUsePromoCodeUploadService : AwsDynamoDbRepository<SingleUsePromocodeModel>, ISingleUsePromoCodeUploadService
    {
        public SingleUsePromoCodeUploadService(IAwsDynamoDbContextFactory<SingleUsePromocodeModel> factory)
            : base(factory)
        {
        }

        public void UploadSingleUsePromoCodes(IEnumerable<string> codes, string campaignId)
        {
            var dataModels = codes.Select(csv => ToAwsModel(csv, campaignId)).ToList();
            SaveBatch(dataModels).GetAwaiter().GetResult();
        }

        private SingleUsePromocodeModel ToAwsModel(string code, string campaignName)
            => new SingleUsePromocodeModel
            {
                Code = code,
                CampaignId = campaignName
            };
    }
}
using System.Collections.Generic;
using easyJet.Foundation.DynamoDb.Models;
using easyJet.Foundation.DynamoDb.Repositories.Base;

namespace easyJet.Foundation.Voucherify.Services
{
    public interface ISingleUsePromoCodeUploadService : IAwsDynamoDbRepository<SingleUsePromocodeModel>
    {
        void UploadSingleUsePromoCodes(IEnumerable<string> codes, string campaignId);
    }
}
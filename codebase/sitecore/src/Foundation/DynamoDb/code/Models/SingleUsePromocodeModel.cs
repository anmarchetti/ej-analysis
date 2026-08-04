using Amazon.DynamoDBv2.DataModel;

namespace easyJet.Foundation.DynamoDb.Models
{
    /// <summary>
    /// Single Use Promocode Aws Model.
    /// </summary>
    public class SingleUsePromocodeModel
    {
        [DynamoDBHashKey("campaignId")]
        public string CampaignId { get; set; }

        [DynamoDBRangeKey("code")]
        public string Code { get; set; }
    }
}
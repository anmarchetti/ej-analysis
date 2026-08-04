using Amazon.DynamoDBv2.DataModel;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.SingleUseVoucher;

/// <summary>
/// Single-use voucher record stored in DynamoDB.
/// </summary>
public class SingleUseVoucherModel
{
    /// <summary>
    /// Campaign identifier used as the DynamoDB hash key.
    /// </summary>
    [DynamoDBHashKey("campaignId")]
    public string CampaignId { get; set; }
    
    /// <summary>
    /// Voucher code used as the DynamoDB range key.
    /// </summary>
    [DynamoDBRangeKey("code")]
    public string Code { get; set; }

    /// <summary>
    /// Mapped customer identifier assigned to the voucher code.
    /// </summary>
    [DynamoDBProperty("customerMappedId")]
    public string CustomerMappedId { get; set; }
}

#nullable enable

using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.SingleUseVoucher;
using easyJet.Holidays.Api.Domain.Interfaces.SingleUseVoucher;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils.Aws;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.Services.SingleUseVoucher;

/// <summary>
/// DynamoDB-backed service for reading and assigning single-use promo codes.
/// </summary>
public class SingleUseVoucherService : ISingleUseVoucherService
{
    private const string DefaultTableName = "single-use-promocodes-local";
    private static readonly SemaphoreSlim AssignmentLock = new(1, 1);

    private readonly IDynamoDBContext _dbContext;
    private readonly DynamoDBOperationConfig _config;
    
    /// <summary>
    /// Constructor
    /// </summary>
    public SingleUseVoucherService(IDynamoDBContext dbContext, IOptions<AwsSettings> awsSettings)
    {
        ArgumentNullException.ThrowIfNull(dbContext);
        ArgumentNullException.ThrowIfNull(awsSettings);

        _dbContext = dbContext;
        _config = new DynamoDBOperationConfig
        {
            ConsistentRead = true,
            OverrideTableName = string.IsNullOrWhiteSpace(awsSettings.Value?.Storage?.Tables?.SingleUsePromoCodes)
                ? DefaultTableName
                : awsSettings.Value.Storage.Tables.SingleUsePromoCodes
        };
    }

    /// <summary>
    /// Assign an available single-use promo code to a customer in a campaign.
    /// </summary>
    /// <param name="customerMappedId">mapped customer Id.</param>
    /// <param name="campaignId">campaign Id.</param>
    /// <returns>Existing or newly assigned single-use promo code, or empty string when none is available.</returns>
    public async Task<string> AssignSingleUsePromoCodeToCustomer(string customerMappedId, string campaignId)
    {
        if (string.IsNullOrWhiteSpace(customerMappedId) || string.IsNullOrWhiteSpace(campaignId))
        {
            return string.Empty;
        }

        await AssignmentLock.WaitAsync();
        try
        {
            var assignedCode = await GetAssignedSingleUsePromoCode(customerMappedId, campaignId);
            if (!string.IsNullOrWhiteSpace(assignedCode))
            {
                return assignedCode;
            }

            var availableCode = (await GetAll(campaignId))
                .FirstOrDefault(code => string.IsNullOrWhiteSpace(code.CustomerMappedId));

            if (availableCode == null)
            {
                return string.Empty;
            }
            
            availableCode.CustomerMappedId = customerMappedId;
            await _dbContext.SaveAsync(availableCode, _config.ConvertToSaveConfig());

            return availableCode.Code ?? string.Empty;
        }
        finally
        {
            AssignmentLock.Release();
        }
    }
    
    /// <summary>
    /// Get customer single user promo code
    /// </summary>
    /// <param name="customerId">customer Id.</param>
    /// <param name="campaignId">campaign Id.</param>
    /// <returns>Single User Promo Code.</returns>
    public async Task<string> GetCustomerSingleUserPromoCode(string customerId, string campaignId)
    {
        return await GetAssignedSingleUsePromoCode(customerId, campaignId);
    }
    
    /// <summary>
    /// Get assigned single-use promo code for a customer in a campaign.
    /// </summary>
    /// <param name="customerMappedId">mapped customer Id.</param>
    /// <param name="campaignId">campaign Id.</param>
    /// <returns>Assigned single-use promo code, or empty string when none exists.</returns>
    private async Task<string> GetAssignedSingleUsePromoCode(string customerMappedId, string campaignId)
    {
        if (string.IsNullOrWhiteSpace(customerMappedId) || string.IsNullOrWhiteSpace(campaignId))
        {
            return string.Empty;
        }

        var queryConfig = _config.ConvertToQueryConfig();
        queryConfig.QueryFilter =
        [
            new ScanCondition(nameof(SingleUseVoucherModel.CustomerMappedId), ScanOperator.Equal, customerMappedId)
        ];

        var asyncSearch = _dbContext.QueryAsync<SingleUseVoucherModel>(campaignId, queryConfig);
        var results = await asyncSearch.GetRemainingAsync();

        return results.FirstOrDefault()?.Code ?? string.Empty;
    }
    
    /// <summary>
    /// Get all single-use vouchers for a campaign.
    /// </summary>
    /// <param name="campaignId">campaign Id.</param>
    /// <returns>Single-use voucher records.</returns>
    private async Task<IEnumerable<SingleUseVoucherModel>> GetAll(string campaignId)
    {
        if (string.IsNullOrWhiteSpace(campaignId))
        {
            return Enumerable.Empty<SingleUseVoucherModel>();
        }

        var asyncSearch = _dbContext.QueryAsync<SingleUseVoucherModel>(campaignId, _config.ConvertToQueryConfig());

        return await asyncSearch.GetRemainingAsync();
    }
}

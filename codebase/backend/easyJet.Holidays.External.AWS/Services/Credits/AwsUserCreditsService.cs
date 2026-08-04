#nullable enable
#pragma warning disable CA1062
using Amazon.DynamoDBv2.Model;
using Amazon.Util;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Models.Credits;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.AWS.Services.Credits;

/// <inheritdoc cref="IAwsUserCreditsService"/>
public class AwsUserCreditsService : IAwsUserCreditsService
{
    private readonly AwsSettings _awsSettings;
    private readonly CacheSettings _cacheSettings;
    private readonly AwsClient _awsClient;
    private readonly ILogger<AwsUserCreditsService> _logger;

    private const string MemberId = "MemberId";
    private const string Timestamp = "Timestamp";
    private const string UserCredits = "UserCredits";

    /// <summary>
    /// Constructor
    /// </summary>
    /// <param name="awsSettings"></param>
    /// <param name="cacheSettings"></param>
    /// <param name="awsClient"></param>
    /// <param name="logger"></param>
    public AwsUserCreditsService(
        IOptions<AwsSettings> awsSettings,
        IOptions<CacheSettings> cacheSettings,
        AwsClient awsClient,
        ILogger<AwsUserCreditsService> logger)
    {
        _awsSettings = awsSettings.Value ?? throw new ArgumentNullException(nameof(awsSettings));
        _cacheSettings = cacheSettings.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
        _awsClient = awsClient;
        _logger = logger;
    }


    /// <inheritdoc/>
    public async Task<Dictionary<Currency, MyCreditInfo>> GetOrUpdateUserCredits(string userId, Func<Task<Dictionary<Currency, MyCreditInfo>>> action, bool force = false)
    {
        try
        {
            _logger.LogInformation("Getting credits for {UserId}", userId);
            var getRequest = new GetItemRequest
            {
                TableName = _awsSettings.Storage.Tables.Credits,
                Key = new Dictionary<string, AttributeValue>
                {
                    { MemberId, new AttributeValue() { S = userId } },
                }
            };

            using var client = _awsClient.GetClient();

            Dictionary<Currency, MyCreditInfo> userCredits;

            if (!force)
            {
                var response = await client.GetItemAsync(getRequest);
                var awsUserCredits = ConvertModel(response.Item);

                if (awsUserCredits?.UserCredits != null)
                {
                    userCredits = awsUserCredits.UserCredits.ToDictionary(x => new Currency { Code = x.Key }, x => x.Value);

                    _logger.LogInformation("Found credits in cache for {UserId}, balance: {Balance}", 
                        userId,
                        string.Join(", ", userCredits.Select(credit => $"{credit.Key.Code}: {credit.Value.Balance}"))
                    );
                    return userCredits;
                }
            }

            userCredits = await action();

            if (userCredits == null)
            {
                // Throw exception if no credits returns from Voucherify
                _logger.LogInformation("Failed to get user credits for {UserId}", userId);
                throw new ApiException(ApiExceptionCodes.CreditsUserInfoNotAvailable);
            }

            var allCurrenciesCredits = userCredits.ToDictionary(x => x.Key.Code, x => x.Value);

            _cacheSettings.ExpirationSeconds.TryGetValue(_cacheSettings.Buckets.Voucherify, out var exp);

            var updateRequest = new PutItemRequest
            {
                TableName = _awsSettings.Storage.Tables.Credits,
                Item = new Dictionary<string, AttributeValue>
                {
                    { MemberId, new AttributeValue() { S = userId } },
                    { UserCredits, new AttributeValue() { S = JsonConvert.SerializeObject(allCurrenciesCredits) } },
                    { Timestamp, new AttributeValue() { N = AWSSDKUtils.ConvertToUnixEpochSecondsString(DateTime.UtcNow.AddSeconds(exp <=0 ? 3600 : exp)) } },
                },
            };
            await client.PutItemAsync(updateRequest);

            _logger.LogInformation("Put credits in cache for {UserId}, balance: {Balance}", 
                userId,
                userCredits.Select(credit => $"{credit.Key.Code}: {credit.Value.Balance}")
            );

            return userCredits;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get vouchers from cache");
            throw new ApiException(ApiExceptionCodes.VoucherFailedToGetFromCache, new ApiError[] { }, ex.Message);
        }
    }

    /// <inheritdoc/>
    public async Task ClearUserCreditsInfo(string userId)
    {
        try
        {
            var deleteRequest = new DeleteItemRequest
            {
                TableName = _awsSettings.Storage.Tables.Credits,
                Key = new Dictionary<string, AttributeValue>
                {
                    { MemberId, new AttributeValue() { S = userId } },
                }
            };

            using var client = _awsClient.GetClient();

            await client.DeleteItemAsync(deleteRequest);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Was not able to connect to Dynamo DB");
            throw new ApiException(ApiExceptionCodes.VoucherFailedToClearCache, new ApiError[] { }, ex.Message);
        }
    }

    /// <summary>
    /// Convert dynamoDb result to Credits model if timestamp expired will return null
    /// </summary>
    /// <param name="item"></param>
    /// <returns></returns>
    private static AwsUserCredits? ConvertModel(Dictionary<string, AttributeValue>? item)
    {
        if (item is not null and not { Count: 0 })
        {
            if (!int.TryParse(ConvertSingleValue(item, Timestamp, x => x.N), out var timestamp) ||
                AWSSDKUtils.ConvertFromUnixEpochSeconds(timestamp) < DateTime.UtcNow)
            {
                return null;
            }

            return new AwsUserCredits()
            {
                MemberId = ConvertSingleValue(item, MemberId, (x) => x.S),
                Timestamp = timestamp,
                UserCredits = JsonConvert.DeserializeObject<Dictionary<string, MyCreditInfo>>(ConvertSingleValue(item, UserCredits, x => x.S) ?? string.Empty)
            };
        }
        return null;
    }

    /// <summary>
    /// Convert single field value from dynamoDb response
    /// </summary>
    /// <typeparam name="T">Type to return</typeparam>
    /// <param name="item">Full item</param>
    /// <param name="name">Field name</param>
    /// <param name="convertFunc">Function to convert</param>
    /// <returns></returns>
    private static T? ConvertSingleValue<T>(Dictionary<string, AttributeValue> item, string name, Func<AttributeValue, T> convertFunc)
    {
        if (item.Count == 0)
        {
            return default;
        }
        if (item.TryGetValue(name, out var value))
        {
            return convertFunc(value);
        }
        return default;
    }
}
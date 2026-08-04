#nullable enable
#pragma warning disable CA1062
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.Api.Domain.Data.ShortList;
using easyJet.Holidays.Api.Domain.Interfaces.ShortList;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;


namespace easyJet.Holidays.External.AWS.Services.ShortList;

/// <inheritdoc cref="IShortListService"/>
public class ShortListService : IShortListService
{
    private const string ShortListMemberId = "MemberId";
    private const string ShortListGrouping = "Grouping";
    private const string ShortList = "Data";
    private const string ShortListLastUpdated = "LastUpdated";

    private readonly AwsSettings _awsSettings;
    private readonly AwsClient _awsClient;
    private readonly ILogger<ShortListService> _logger;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="awsClient"></param>
    /// <param name="awsSettings"></param>
    /// <param name="logger"></param>
    /// <exception cref="ArgumentNullException"></exception>
    public ShortListService(
        AwsClient awsClient,
        IOptions<AwsSettings> awsSettings,
        ILogger<ShortListService> logger)
    {
        _awsSettings = awsSettings.Value ?? throw new ArgumentNullException(nameof(awsSettings));
        _awsClient = awsClient;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<ShortListOfferRequest>> GetUserShortList(string userId, string? listType = null)
    {
        try
        {
            listType ??= _awsSettings.UserData.DefaultGroupping;
            var request = new GetItemRequest
            {
                TableName = _awsSettings.Storage.Tables.ShortList,
                Key = new Dictionary<string, AttributeValue>
                {
                    { ShortListMemberId, new AttributeValue() { S = userId } },
                    { ShortListGrouping, new AttributeValue() { S = listType } },
                }
            };

            using var client = _awsClient.GetClient();

            var response = await client.GetItemAsync(request);
            return ConvertObject(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Was not able to connect to Dynamo DB");
            throw new ApiException(ApiExceptionCodes.ShortListFailedToGet, [], ex.Message);
        }
    }

    /// <inheritdoc />
    public async Task<ShortListStatus> CreateOrUpdateUserShortList(string userId, ShortListOfferRequest request, string? listType = null)
    {
        listType ??= _awsSettings.UserData.DefaultGroupping;
        IEnumerable<ShortListOfferRequest> userResults = new List<ShortListOfferRequest>();
        var isShortlistedOffer = false;
        await UpdateDynamoDbRecode(userId, listType, (item) =>
        {
            userResults = ConvertObject(item);

            isShortlistedOffer = CheckHotelDuplicates(request, userResults);

            // Exclude duplicate offers
            if (request.ShortListType == Api.Domain.Data.PackageOffers.ShortList.ShortListType.Offer)
                userResults = userResults.Where(x => !OfferUtils.CompareAccomadationRequests(x, request, true));

            // Put new offer with updated created date
            if (!isShortlistedOffer)
                userResults = userResults.Concat([request]);

            var jsonSettings = new JsonSerializerSettings() { NullValueHandling = NullValueHandling.Ignore };
            jsonSettings.Converters.Add(new StringEnumConverter());
            return userResults.Select(x => JsonConvert.SerializeObject(x, jsonSettings)).ToList();
        });
        return new ShortListStatus()
        {
            SavedOffersCount = userResults?.Count() ?? 0,
            CreatedID = isShortlistedOffer ? string.Empty : request?.Id,
        };
    }

    /// <inheritdoc />
    public async Task<ShortListStatus> RemoveOfferFormList(string userId, List<string> ids, string? listType = null)
    {
        listType ??= _awsSettings.UserData.DefaultGroupping;
        var userResults = new List<string>();
        await UpdateDynamoDbRecode(userId, listType, (items) =>
        {
            userResults = ConvertSingleValue(items, ShortList, (item) => item.SS) ?? [];
            // Remove package request from list
            userResults = userResults.Where(x => !ids.Any(x.Contains)).ToList();
            return userResults;
        });
        return new ShortListStatus()
        {
            SavedOffersCount = userResults.Count
        };
    }

    /// <summary>
    /// Update user saved offers based on updateAction from params
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="listType">Short list type</param>
    /// <param name="updateAction">Action to update item</param>
    /// <returns></returns>
    private async Task UpdateDynamoDbRecode(string userId, string listType, Func<Dictionary<string, AttributeValue>, List<string>> updateAction)
    {
        try
        {
            var getRequest = new GetItemRequest
            {
                TableName = _awsSettings.Storage.Tables.ShortList,
                Key = new Dictionary<string, AttributeValue>
                {
                    { ShortListMemberId, new AttributeValue() { S = userId } },
                    { ShortListGrouping, new AttributeValue() { S = listType } },
                }
            };

            using (var client = _awsClient.GetClient())
            {
                var response = await client.GetItemAsync(getRequest);
                var lastUpdated = ConvertSingleValue(response.Item, ShortListLastUpdated, (item) => item.S);
                // Update recode
                var userResults = updateAction(response.Item);

                var updateRequest = new PutItemRequest
                {
                    TableName = _awsSettings.Storage.Tables.ShortList,
                    Item = new Dictionary<string, AttributeValue>
                    {
                        { ShortListMemberId, new AttributeValue() { S = userId } },
                        { ShortListGrouping, new AttributeValue() { S = listType } },
                        { ShortListLastUpdated, new AttributeValue() { S = DateTime.UtcNow.ToString("o") }  }
                    },
                    ExpressionAttributeNames = new Dictionary<string, string>()
                    {
                        {"#U", ShortListLastUpdated},
                        { "#ID", ShortListMemberId}
                    },
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>()
                    {
                        {":lastUpdate", new AttributeValue {S = lastUpdated ?? ""}},
                    },
                    // Update items only if lastUpdateTime is equal to previous value.
                    ConditionExpression = "#U = :lastUpdate OR attribute_not_exists(#ID)",
                };
                if (userResults.Count > 0)
                {
                    updateRequest.Item.Add(ShortList, new AttributeValue() { SS = userResults });
                }
                await client.PutItemAsync(updateRequest);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Was not able to connect to Dynamo DB");
            throw new ApiException(ApiExceptionCodes.ShortListFailedToUpdate, [], ex.Message);
        }
    }

    /// <summary>
    /// Convert single field value from dynamoDb response
    /// </summary>
    /// <typeparam name="T">Type to return</typeparam>
    /// <param name="item">Full item</param>
    /// <param name="name">Field name</param>
    /// <param name="convertFunc">Function to convert</param>
    /// <returns></returns>
    private static T? ConvertSingleValue<T>(Dictionary<string, AttributeValue>? item, string name, Func<AttributeValue, T> convertFunc)
    {
        if (item is null or { Count: 0 })
        {
            return default;
        }
        if (item.TryGetValue(name, out var value))
        {
            return convertFunc(value);
        }
        return default;
    }

    /// <summary>
    /// Convert dynamoDB response to Atcom requests
    /// </summary>
    /// <param name="item">Full dynamoDB response</param>
    /// <returns></returns>
    private IEnumerable<ShortListOfferRequest> ConvertObject(Dictionary<string, AttributeValue>? item)
    {
        var result = new List<ShortListOfferRequest?>();
        if (item is not null and not { Count: 0 } && item.TryGetValue(ShortList, out var list))
        {
            var requests = list.SS?.Where(s => s is not null) ?? [];
            foreach (var req in requests)
            {
                try
                {
                    var respObj = JsonConvert.DeserializeObject<ShortListOfferRequest>(req);
                    result.Add(respObj);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Can not parse {Req}", req);
                }
            }
        }
        return result.OfType<ShortListOfferRequest>();
    }

    /// <summary>
    /// Checks the hotel duplicates.
    /// </summary>
    /// <param name="request">The request.</param>
    /// <param name="userResults">The user results.</param>
    /// <returns>A bool.</returns>
    private bool CheckHotelDuplicates(ShortListOfferRequest request, IEnumerable<ShortListOfferRequest> userResults)
    {
        var isHotelAlreadySaved = userResults
            .Any(r =>
                r.ShortListType == Api.Domain.Data.PackageOffers.ShortList.ShortListType.Hotel &&
                  (r.GiataCode != null && r.GiataCode == request.GiataCode));

        if (isHotelAlreadySaved)
            _logger.LogWarning("Hotel already added to the shortlist. Giata: {GiataCode}", request.GiataCode);

        return isHotelAlreadySaved;
    }
}

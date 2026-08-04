using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.Api.Domain.Interfaces.Customers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.Counter;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;

namespace easyJet.Holidays.External.AWS.Services.Customer;

/// <summary>
/// Service which provides digital Ids for B2B customer id (letters and digits)
/// </summary>
public class CustomerMapperService : ICustomerMapperService
{
    /// <summary>
    /// Atomic counter key
    /// </summary>
    private const string UserIdCounterName = "userId";
    private const string AttributeId = "Id";
    private const string AttributeMemberId = "MemberId";

    private readonly AwsSettings _awsSettings;
    private readonly AwsClient _awsClient;
    private readonly IAtomicCounterService _counterService;
    private readonly ILogger<CustomerMapperService> _logger;

    /// <summary>
    /// Constructor
    /// </summary>
    /// <param name="awsClient"></param>
    /// <param name="counterService"></param>
    /// <param name="awsSettings"></param>
    /// <param name="logger"></param>
    public CustomerMapperService(AwsClient awsClient, IAtomicCounterService counterService, IOptions<AwsSettings> awsSettings, ILogger<CustomerMapperService> logger)
    {
        _awsSettings = awsSettings.Value ?? throw new ArgumentNullException(nameof(awsSettings));
        _awsClient = awsClient;
        _counterService = counterService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<decimal> GetOrCreateCustomerId(string memberId)
    {
        using var client = _awsClient.GetClient();

        // 1. Get customer id
        var customerId = await GetCustomerId(client, memberId);
        if (customerId > 0)
        {
            _logger.LogInformation("Found customer id({CustomerId}) for member {MemberId}", customerId, memberId);
            return customerId;
        }

        // No customer entry. Need to create new one
        customerId = await _counterService.GetNextId(UserIdCounterName);
        _logger.LogInformation("No mapped id for for member {MemberId}. Generated new one {CustomerId}", memberId, customerId);

        try
        {
            await CreateUserItem(client, memberId, customerId);
            return customerId;
        }
        catch (Exception ex)
        {
            if (ex is ConditionalCheckFailedException || (ex as AggregateException)?.InnerException is ConditionalCheckFailedException)
            {
                // Can't create customer. It's expected: it could be added by concurrent thread. Try to read it once again
                _logger.LogWarning(ex, "Tried to add memberId which already exists: {MemberId}", memberId);

                customerId = await GetCustomerId(client, memberId);
                return customerId;
            }
            _logger.LogError(ex, "Can not create mapping for user: {MemberId}", memberId);
            throw;
        }
    }

    /// <summary>
    /// Get customer entry by member id. Returns -1 if member id doesn't exist
    /// </summary>
    /// <param name="client">Aws client</param>
    /// <param name="memberId">Member id</param>
    /// <returns>Customer id or -1 if member id doesn't exist</returns>
    private async Task<decimal> GetCustomerId(IAmazonDynamoDB client, string memberId)
    {
        var request = new GetItemRequest
        {
            TableName = _awsSettings.Storage.Tables.Users,
            Key = new Dictionary<string, AttributeValue>()
            {
                {
                    AttributeMemberId, new AttributeValue {
                        S = memberId
                    }
                }
            },
            ProjectionExpression = $"{AttributeMemberId}, {AttributeId}",
            ConsistentRead = true
        };

        var response = await client.GetItemAsync(request);

        if (response.Item?.TryGetValue(AttributeId, out var itemId) ?? false)
        {
            decimal.TryParse(itemId.N, CultureInfo.InvariantCulture, out var resultId);
            return resultId;
        }

        return -1;
    }


    /// <summary>
    /// Create entry: customer memberId and id
    /// </summary>
    /// <param name="client">Aws client</param>
    /// <param name="memberId">Member id</param>
    /// <param name="id">Id</param>
    /// <returns>New customer id</returns>
    private async Task CreateUserItem(IAmazonDynamoDB client, string memberId, decimal id)
    {
        var request = new PutItemRequest
        {
            TableName = _awsSettings.Storage.Tables.Users,
            Item = new Dictionary<string, AttributeValue>()
            {
                {
                    AttributeMemberId, new AttributeValue {
                        S = memberId
                    }
                },
                {
                    AttributeId, new AttributeValue {
                        N = id.ToString(CultureInfo.InvariantCulture)
                    }
                },
            },
            ConditionExpression = $"attribute_not_exists({AttributeMemberId})"// prevent duplicates
        };

        await client.PutItemAsync(request);
    }
}
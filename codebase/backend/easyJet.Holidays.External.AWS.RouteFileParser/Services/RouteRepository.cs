using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.External.AWS.RouteFileParser.Models;
using easyJet.Holidays.External.AWS.RouteFileParser.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;

namespace easyJet.Holidays.External.AWS.RouteFileParser.Services;

/// <inheritdoc cref="IRouteRepository"/>
public class RouteRepository : IRouteRepository
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly ILogger<RouteRepository> _logger;
    private readonly LambdaSettings _lambdaSettings;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="dynamoDb"></param>
    /// <param name="logger"></param>
    /// <param name="lambdaOptions"></param>
    public RouteRepository(IAmazonDynamoDB dynamoDb, ILogger<RouteRepository> logger, IOptions<LambdaSettings> lambdaOptions)
    {
        _dynamoDb = dynamoDb;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(lambdaOptions);
        _lambdaSettings = lambdaOptions.Value;
    }

    /// <inheritdoc />
    public async Task WriteToAvailability(Dictionary<string, RoutePerMarkets<List<string>>> departures, string version)
    {
        _logger.LogInformation("Start Writing TO");

        ArgumentNullException.ThrowIfNull(departures);

        foreach (var dep in departures)
        {
            var item = new Dictionary<string, AttributeValue>
            {
                {
                    "version",new AttributeValue { N = version }
                },
                {
                    "departure", new AttributeValue(dep.Key)
                },
                {
                    "arrivals", new AttributeValue(dep.Value.Routes)
                }
            };

            if (dep.Value.Markets is { Count: > 0 })
            {
                item.Add("markets", new AttributeValue() { SS = dep.Value.Markets });
            }

            _ = await _dynamoDb.PutItemAsync(_lambdaSettings.ToTableName, item);
        }
    }

    /// <inheritdoc />
    public async Task WriteFromAvailability(Dictionary<string, RoutePerMarkets<List<string>>> arrivals, string version)
    {
        _logger.LogInformation("Start Writing FROM");

        ArgumentNullException.ThrowIfNull(arrivals);

        foreach (var arr in arrivals)
        {
            var item = new Dictionary<string, AttributeValue>
            {
                {
                    "version",new AttributeValue { N = version }
                },
                {
                    "arrival", new AttributeValue(arr.Key)
                },
                {
                    "departures", new AttributeValue(arr.Value.Routes)
                }
            };

            if (arr.Value.Markets != null && arr.Value.Markets.Count > 0)
            {
                item.Add("markets", new AttributeValue() { SS = arr.Value.Markets });
            }

            _ = await _dynamoDb.PutItemAsync(_lambdaSettings.FromTableName, item);
        }
    }

    /// <inheritdoc />
    public async Task WriteAllMonthsAvailability(Dictionary<string, RoutePerMarkets<string>> schedule, string version)
    {
        _logger.LogInformation("Start Writing DATE");

        ArgumentNullException.ThrowIfNull(schedule);

        foreach (var arr in schedule)
        {
            var item = new Dictionary<string, AttributeValue>
                {
                    {
                        "version",new AttributeValue { N = version }
                    },
                    {
                        "month", new AttributeValue(arr.Key)
                    },
                    {
                        "departures", new AttributeValue (arr.Value.Routes)
                    }
                }
                ;
            if (arr.Value.Markets != null && arr.Value.Markets.Count > 0)
            {
                item.Add("markets", new AttributeValue() { SS = arr.Value.Markets });
            }
            _ = await _dynamoDb.PutItemAsync(_lambdaSettings.DatesTableName, item);
        }
    }

    /// <inheritdoc />
    public async Task<int> GetLatestVersion()
    {
        var response = await _dynamoDb.ScanAsync(new ScanRequest
        {
            TableName = _lambdaSettings.VersionTableName,
            ConsistentRead = true
        });

        _ = int.TryParse(response.Items.LastOrDefault()?["version"]?.N, out int version);

        return version;
    }

    /// <inheritdoc />
    public async Task UpdateLatestVersion(int version)
    {
        _logger.LogInformation("Updating versions to {VersionNo}", version);

        await _dynamoDb.PutItemAsync(_lambdaSettings.VersionTableName, new Dictionary<string, AttributeValue>
        {
            { "version", new AttributeValue
                {
                    N = version.ToString(CultureInfo.InvariantCulture)
                }
            }
        });

        await _dynamoDb.DeleteItemAsync(_lambdaSettings.VersionTableName, new Dictionary<string, AttributeValue>
        {
            { "version", new AttributeValue
                {
                    N = (version - 1).ToString(CultureInfo.InvariantCulture)
                }
            }
        });

        _logger.LogInformation("Deleting versions below {VersionNo}", version);

        _logger.LogInformation("Start Deleting TO");
        await DeletePreviousVersion(version, _lambdaSettings.ToTableName, "departure");
        
        _logger.LogInformation("Start Deleting FROM");
        await DeletePreviousVersion(version, _lambdaSettings.FromTableName, "arrival");
        
        _logger.LogInformation("Start Deleting DATES");
        await DeletePreviousVersion(version, _lambdaSettings.DatesTableName, "month");
    }

    internal async Task DeletePreviousVersion(int version, string table, string primaryKey)
    {
        Dictionary<string, AttributeValue> lstEvaluatedKey = null;
        ScanResponse allItemsResponse;
        ScanRequest scanRequest = BuildScanRequest(version, table);

        do
        {
            scanRequest.ExclusiveStartKey = lstEvaluatedKey;

            allItemsResponse = await _dynamoDb.ScanAsync(scanRequest);
            lstEvaluatedKey = allItemsResponse.LastEvaluatedKey;

            foreach (var i in allItemsResponse.Items)
            {
                await _dynamoDb.DeleteItemAsync(new DeleteItemRequest
                {
                    TableName = table,
                    Key = new Dictionary<string, AttributeValue>
                    {
                        {
                            primaryKey, i[primaryKey]
                        },
                        {
                            "version", i["version"]
                        }
                    }
                });
            }
        } while (allItemsResponse.LastEvaluatedKey?.Count > 0);
    }

    internal static ScanRequest BuildScanRequest(int version, string table)
    {
        return new ScanRequest
        {
            TableName = table,
            FilterExpression = "#col < :ver",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                {
                    ":ver", new AttributeValue
                    {
                        N = version.ToString(CultureInfo.InvariantCulture)
                    }
                }
            },
            ExpressionAttributeNames = new Dictionary<string, string>
            {
                {
                    "#col", "version"
                }
            }
        };
    }
}
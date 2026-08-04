using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.Api.Domain.Data.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.Services.Search
{
    public class RouteDataRepository : IRouteDataRepository
    {
        private readonly ILogger<RouteDataRepository> _logger;

        private readonly AwsSettings _awsSettings;
        private readonly AwsClient _awsClient;

        private readonly ICacheService _cacheService;
        private readonly CacheSettings _cacheSettings;
        private readonly IMarketService _marketService;

        private static readonly string RouteVersionCacheKey = "RoutesVersionDates";
        private static readonly string AllMonthCacheKey = "AllMonth";
        private static readonly string AvailabilityCacheKey = "Availability";

        public RouteDataRepository(
            ILogger<RouteDataRepository> logger,
            AwsClient awsClient,
            IOptions<AwsSettings> awsSettings,
            ICacheService cacheService,
            IOptions<CacheSettings> cacheSettings,
            IMarketService marketService)
        {
            _cacheSettings = cacheSettings.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
            _awsSettings = awsSettings.Value ?? throw new ArgumentNullException(nameof(awsSettings));
            _awsClient = awsClient;
            _logger = logger;
            _cacheService = cacheService;
            _marketService = marketService;
        }

        /// <summary>
        /// Get Arrivals availability
        /// </summary>
        /// <returns></returns>
        public async Task<int> GetLatestVersion()
        {
            return await GetLatestVersion(false);
        }

        public async Task<Dictionary<string, List<string>>> GetToAvailability(string market, int version)
        {
            var marketAirports = _marketService.GetMarket(market).AirportDepartureCodes;
            var availability = await GetAvailability(_awsSettings.Routes.Tables.To, "departure", "arrivals", null, version, market);

            availability = new Dictionary<string, List<string>>(availability.Where(x => marketAirports.Contains(x.Key)));

            return availability;
        }

        public async Task<Dictionary<string, List<string>>> GetToAvailability(string fromAirport, string market, int version)
        {
            return await GetAvailability(_awsSettings.Routes.Tables.To, "departure", "arrivals", fromAirport, version, market);
        }

        public async Task<Dictionary<string, List<string>>> GetFromAvailability(string toAirport, int version, string market)
        {
            var marketAirports = _marketService.GetMarket(market).AirportDepartureCodes;
            var availability = await GetAvailability(_awsSettings.Routes.Tables.From, "arrival", "departures", toAirport, version, market);

            availability = new Dictionary<string, List<string>>(availability
                .Select(x =>
                    new KeyValuePair<string, List<string>>
                    (
                        x.Key,
                        x.Value.Where(marketAirports.Contains).ToList()
                    )
                )
                .Where(x => x.Value.Any()));

            return availability;
        }

        /// <summary>
        /// Get Arrivals availability
        /// </summary>
        /// <returns></returns>
        private async Task<int> GetLatestVersion(bool forceUpdate)
        {
            return await _cacheService.GetOrAddAsync<int?>(
                _cacheSettings.Buckets.RoutesVersion,
                new[] { RouteVersionCacheKey },
                async () =>
                {
                    using (var client = _awsClient.GetClient())
                    {
                        ScanResponse allitemsResponse = null;
                        var scanRequest = new ScanRequest
                        {
                            TableName = _awsSettings.Routes.Tables.Version,
                            AttributesToGet = new List<string> { "version" },
                            ConsistentRead = true,
                        };

                        allitemsResponse = await client.ScanAsync(scanRequest);
                        var item = allitemsResponse.Items.LastOrDefault();

                        int.TryParse(item["version"].N, out int version);

                        _logger.LogTrace("AWS. Fetched Dates version from Dynamo: {Version}", version);
                        return version;
                    }
                },
                forceUpdate) ?? 0;
        }

        /// <summary>
        /// Get availability
        /// </summary>
        /// <returns></returns>
        private async Task<Dictionary<string, List<string>>> GetAvailability(string table, string key, string value, string airport, int version, string market)
        {
            Func<string[]> cacheKey = () => new[] { AvailabilityCacheKey, table, key, value, airport, version.ToString(), market };
            version = await ValidateDataVersionInCache<Dictionary<string, List<string>>>(version, cacheKey, _cacheSettings.Buckets.RoutesDates);

            return await _cacheService.GetOrAddAsync(
                _cacheSettings.Buckets.RoutesDates,
                cacheKey(),
                async () =>
                {
                    var result = new Dictionary<string, List<string>>();
                    using (var client = _awsClient.GetClient())
                    {

                        if (!string.IsNullOrWhiteSpace(airport))
                        {
                            var request = new QueryRequest
                            {
                                TableName = table,
                                ConsistentRead = true,
                                KeyConditionExpression = $"#col = :ver and {key} = :{key}",
                                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                                {
                                    {
                                        ":ver", new AttributeValue {
                                            N = version.ToString()
                                        }
                                    },
                                    {
                                        $":{key}", new AttributeValue(airport)
                                    },
                                    {
                                        ":market", new AttributeValue(market)
                                    }
                                },
                                ExpressionAttributeNames = new Dictionary<string, string>
                                {
                                    {
                                        "#col", "version"
                                    }
                                },
                                FilterExpression = "contains(markets, :market)"
                            };

                            var response = await client.QueryAsync(request);

                            if (response?.Items?.Count > 0)
                            {
                                foreach (var i in response.Items)
                                {
                                    result.Add(i[key].S, i[value].SS.ToList());
                                }
                            }
                        }
                        else
                        {
                            Dictionary<string, AttributeValue> lstEvaluatedKey = null;
                            QueryResponse allitemsResponse = null;
                            var scanRequest = new QueryRequest
                            {
                                TableName = table,
                                ConsistentRead = true,
                                KeyConditionExpression = "#col = :ver",
                                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                                {
                                    {
                                        ":ver", new AttributeValue {
                                            N = version.ToString()
                                        }
                                    },
                                    {
                                        ":market", new AttributeValue(market)
                                    }
                                },
                                ExpressionAttributeNames = new Dictionary<string, string>
                                {
                                    {
                                        "#col", "version"
                                    }
                                },
                                FilterExpression = "contains(markets, :market)"
                            };

                            do
                            {
                                scanRequest.ExclusiveStartKey = lstEvaluatedKey;

                                allitemsResponse = await client.QueryAsync(scanRequest);
                                lstEvaluatedKey = allitemsResponse.LastEvaluatedKey;

                                foreach (var i in allitemsResponse.Items)
                                {
                                    result.Add(i[key].S, i[value].SS.ToList());
                                }
                            } while (allitemsResponse?.LastEvaluatedKey?.Count > 0);
                        }

                        _logger.LogTrace("AWS. GetAvailability. Found {Count} items", result.Count);
                        return result;
                    }
                },
                false
            );
        }

        public async Task<Dictionary<string, List<AvailabilityRecord>>> GetAllArrangement(int version, string market)
        {
            Func<string[]> cacheKey = () => new[] { AllMonthCacheKey, version.ToString(), market };

            version = await ValidateDataVersionInCache<Dictionary<string, List<AvailabilityRecord>>>(version, cacheKey, _cacheSettings.Buckets.RoutesDates);
            var marketAirports = _marketService.GetMarket(market).AirportDepartureCodes;

            return await _cacheService.GetOrAddAsync(
                _cacheSettings.Buckets.RoutesDates,
                cacheKey(),
                async () =>
                {

                    var allMonthRecords = new Dictionary<string, string>();
                    using (var client = _awsClient.GetClient())
                    {
                        Dictionary<string, AttributeValue> lstEvaluatedKey = null;
                        QueryResponse result = null;
                        var scanRequest = new QueryRequest
                        {
                            TableName = _awsSettings.Routes.Tables.Dates,
                            ConsistentRead = true,
                            KeyConditionExpression = "#col = :ver",
                            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                            {
                                {
                                    ":ver", new AttributeValue {
                                        N = version.ToString()
                                    }
                                },
                                {
                                    ":market", new AttributeValue(market)
                                }
                            },
                            ExpressionAttributeNames = new Dictionary<string, string>
                            {
                                {
                                    "#col", "version"
                                }
                            },
                            FilterExpression = "contains(markets, :market)"
                        };

                        do
                        {
                            scanRequest.ExclusiveStartKey = lstEvaluatedKey;

                            result = await client.QueryAsync(scanRequest);
                            lstEvaluatedKey = result.LastEvaluatedKey;

                            foreach (var i in result.Items)
                            {
                                allMonthRecords.Add(i["month"].S, i["departures"].S);
                            }
                        } while (result?.LastEvaluatedKey?.Count > 0);

                        var allArrangement = allMonthRecords.ToDictionary(
                            x => x.Key,
                            x => ParseMonthArrangement(int.Parse(x.Key.Substring(0, 4)), int.Parse(x.Key.Substring(5, 2)), x.Value)
                                .Where(x => marketAirports.Contains(x.Dep) || marketAirports.Contains(x.Arr))
                                .ToList());

                        _logger.LogTrace("AWS. GetAllArrangement. Found {Count} items", result.Count);
                        return allArrangement;
                    }
                },
                false);
        }

        private List<AvailabilityRecord> ParseMonthArrangement(int year, int month, string monthArrangementStr)
        {
            var monthRecord = new List<AvailabilityRecord>();
            var days = monthArrangementStr.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);

            foreach (var day in days)
            {
                monthRecord.Add(new AvailabilityRecord
                {
                    Date = new DateTime(year, month, int.Parse(day.Substring(0, 2))),
                    Dep = day.Substring(2, 3),
                    Arr = day.Substring(5, 3),
                });
            }

            return monthRecord;
        }

        /// <summary>
        /// Checks whether data in cache is valid.
        /// If it's not cached method fetches version fro storage
        /// </summary>
        /// <returns></returns>
        private async Task<int> ValidateDataVersionInCache<T>(int version, Func<string[]> cacheKey, string bucketName)
        {
            var fromCache = await _cacheService.Get<T>(
                bucketName,
                cacheKey()
            );

            if (fromCache == null)
            {
                // if data is not cached we should always get not cached version to get correct data.
                // e.g. we have in cache version=1, but DB data was updated with new version=2.
                // We should fetch latest version and then only get data otherwise we'll get nothing                
                version = await GetLatestVersion(true);
                _logger.LogTrace("AWS. No cached data for {Key}. Fetched version from Dynamo {Version}", string.Join(",", cacheKey()), version);
            }

            return version;
        }
    }
}
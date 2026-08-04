using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.Model;

using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.ErrataInfo;
using easyJet.Holidays.Api.Domain.Data.ErrataInfo;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using easyJet.Holidays.External.AWS.Utils;
using Newtonsoft.Json;
using Polly;
using Polly.Registry;

namespace easyJet.Holidays.External.AWS.Services.ErrataInfo
{
    public class ErrataInfoService : IErrataInfoService
    {
        private readonly int _batchChunkSizeDefault = 25;
        private readonly ResiliencePipeline<BatchWriteItemResponse> _batchWriter;
        private readonly AwsClient _awsClient;
        private readonly ILogger<IErrataInfoService> _logger;
        private readonly AwsSettings _awsSettings;
        public static readonly string Code = "Code";
        public static readonly string ErratasInfo = "ErratasInfo";
        private const string AllAirportsTag = "ALL";

        public ErrataInfoService(
            AwsClient awsClient,
            IOptions<AwsSettings> awsSettings,
            ILogger<ErrataInfoService> logger,
            ResiliencePipelineProvider<string> pipelineProvider)
        {
            ArgumentNullException.ThrowIfNull(pipelineProvider);

            _awsClient = awsClient;
            _logger = logger;
            _awsSettings = awsSettings.Value ?? throw new ArgumentNullException(nameof(awsSettings));
            _batchWriter = pipelineProvider.GetPipeline<BatchWriteItemResponse>(AwsConfigurationExtensions.DynamoDbBatchWritePipelineKey);
        }

        /// <summary>
        /// Save list of ErrataInfoModels in DynamoDB table
        /// </summary>
        /// <param name="data">Items for saving in DynamoDb </param>
        /// <returns></returns>
        public async Task Save(List<HotelErrataModel> data)
        {
            await SaveInternal(data, BuildBaseAttrs, model => model.HotelCode, _awsSettings.Storage.Tables.ErrataInfo);
        }

        /// <summary>
        /// Save list of ErrataInfoModels in DynamoDB table
        /// </summary>
        /// <param name="data">Items for saving in DynamoDb </param>
        /// <returns></returns>
        public async Task SaveFlightErrata(List<FlightErrataModel> data)
        {
            await SaveInternal(data, BuildFlightErrataBaseAttrs, model => model.Code, _awsSettings.Storage.Tables.FlightErrataInfo);
        }

        /// <summary>
        /// Enrich offers with errata info
        /// </summary>
        /// <param name="offers"></param>
        /// <returns></returns>
        public async Task EnrichWithErrataInfo(List<Offer> offers, string language)
        {
            foreach (var offer in offers)
            {
                await EnrichWithErrataInfo(offer, language);
            }
        }

        /// <summary>
        /// Enrich offer with errata info
        /// </summary>
        /// <param name="offer"></param>
        /// <returns></returns>
        public async Task EnrichWithErrataInfo(Offer offer, string language)
        {
            // because of two types of Errata (Accom & Geography) we have to do two requests
            // Get Errata by accommodation Id and hotel airport codes
            // Because we have to show all suitable errata we have to get all data
            var codes = new List<string>
            {
                offer.Accom.Code
            };

            var hotelAirport = offer.Transport?.Routes?.FirstOrDefault(x => x.Direction == Direction.Outbound)?.ArrPt?.ToUpperInvariant();
            if (!string.IsNullOrEmpty(hotelAirport))
            {
                codes.Add(hotelAirport);
            }

            offer.ErrataInfo = await GetErrataInfo(language, offer?.Date, codes.ToArray());
        }

        /// <inheritdoc />
        public async Task<string[]> GetErrataInfo(string language, DateTime? offerDate, params string[] codes)
        {
            var currentLanguageCode = GetLanguageCode(language);
            var erratas = new List<ErrataInfoModel>();
            foreach (var code in codes)
            {
                var info = (await GetErrataInfo(code))?.ErratasInfo ?? new List<ErrataInfoModel>();
                erratas.AddRange(info.Where(e => string.Equals(e.LanguageCode, currentLanguageCode, StringComparison.InvariantCultureIgnoreCase)));
            }

            //errata.EffectiveDates <= today
            //errata.DepartureStartDate <= offer.Departure
            //offer.Departure <= errata.DepartureEndDate
            //We consider that today user is trying to book, therefore:
            //errata.BookStartDate <= today
            //today <= errata.BookEndDate
            var result = erratas
                ?.Where(e =>
                    offerDate != null && DateTime.Compare(e.EffectiveDate.Date, DateTime.Today) <= 0
                                        && DateTime.Compare(e.DepartureStartDate.Date, offerDate.Value.Date) <= 0
                                        && DateTime.Compare(offerDate.Value.Date, e.DepartureEndDate.Date) <= 0
                                        && DateTime.Compare(e.BookStartDate.Date, DateTime.Today) <= 0
                                        && DateTime.Compare(DateTime.Today, e.BookEndDate.Date) <= 0)
                .Select(e => e.Errata)
                .Distinct() // in DynamoDB can be duplicate values
                .ToArray() ?? new string[] { };

            return result;
        }

        /// <summary>
        /// Set flight errata info to transport
        /// </summary>
        /// <param name="offers">list of offer for which need to set up errata info</param>
        public async Task EnrichWithFlightErrataInfo(List<Offer> offers, string language)
        {
            if (offers.IsNullOrEmpty())
            {
                return;
            }

            foreach (var offer in offers)
            {
                await EnrichTransportWithErrataInfo(offer.Transport, offer.Date, language);
            }
        }

        /// <summary>
        /// Set flight errata info to bookings transport
        /// </summary>
        /// <param name="booking">Booking to set its errata</param>
        public async Task EnrichWithFlightErrataInfo(BookingResponse booking, string language)
        {
            await EnrichWithFlightErrataInfo(booking.Package.Transport, language);
        }

        /// <summary>
        /// Enriches the transport with flight errata information.
        /// </summary>
        /// <typeparam name="T">Transport information</typeparam>
        /// <param name="amendTransport">Transport information</param>
        public async Task EnrichWithFlightErrataInfo<T>(T amendTransport, string language) where T : Transport
        {
            if (amendTransport == null)
            {
                return;
            }
            await EnrichTransportWithErrataInfo(amendTransport, amendTransport?.Routes?.FirstOrDefault()?.DepDate.Value.Date, language);
        }

        /// <summary>
        /// Delete all errata fom DynamoDb
        /// </summary>
        /// <returns></returns>
        public async Task DeleteOldErrata()
        {
            var scanRequest = new ScanRequest
            {
                TableName = _awsSettings.Storage.Tables.ErrataInfo,
                ConsistentRead = true,
            };

            await DeleteOldErrataInternal(scanRequest);
        }

        /// <summary>
        /// Delete all flight errata fom DynamoDb
        /// </summary>
        /// <returns></returns>
        public async Task DeleteOldFlightErrata()
        {
            var scanRequest = new ScanRequest
            {
                TableName = _awsSettings.Storage.Tables.FlightErrataInfo,
                ConsistentRead = true,
            };

            await DeleteOldErrataInternal(scanRequest);
        }

        /// <summary>
        /// Special for save: it allows to build client without access keys. It's used for functions inside AWS (e.g. lambdas)
        /// </summary>
        /// <param name="settings"></param>
        /// <returns></returns>
        public virtual IAmazonDynamoDB GetClient()
        {
            return AwsClient.GetImplicitClient(_awsSettings.Storage.Client.Region);
        }

        public string GenerateFlightErrataCode(string departurePoint, string arrivalPoint)
        {
            return $"{(string.IsNullOrEmpty(departurePoint) ? AllAirportsTag : departurePoint)}-{(string.IsNullOrEmpty(arrivalPoint) ? AllAirportsTag : arrivalPoint)}";
        }

        public IEnumerable<string> MapLanguageCode(string languageCode)
        {
            languageCode = languageCode?.ToLower();

            if (languageCode == null || !_awsSettings.Errata.LanguageMap.ContainsKey(languageCode))
            {
                return new[] { languageCode };
            }

            return _awsSettings.Errata.LanguageMap[languageCode];
        }

        /// <summary>
        /// Enriches the transport with errata information.
        /// </summary>
        /// <param name="transport">The transport information.</param>
        /// <param name="date">The booking start date.</param>
        private async Task EnrichTransportWithErrataInfo(Transport transport, DateTime? date, string language)
        {
            //no information about flights -> skip
            if (transport == null || date == null)
            {
                return;
            }

            var codes = new List<string>();

            var routesFlightNumbers = transport?.Routes?.Where(i => !string.IsNullOrEmpty(i.FltNo)).Select(i => i.FltNo).ToList();
            if (!routesFlightNumbers.IsNullOrEmpty())
                codes.AddRange(routesFlightNumbers);

            var departureArrivalAirportList =
                transport?.Routes?.Select(i => new KeyValuePair<string, string>(i.DepPt, i.ArrPt)).ToList();

            if (!departureArrivalAirportList.IsNullOrEmpty())
            {
                foreach (var departureArrivalAirport in departureArrivalAirportList!)
                {
                    var departureAirport = departureArrivalAirport.Key;
                    var arrivalAirport = departureArrivalAirport.Value;

                    if (!string.IsNullOrEmpty(departureAirport) && !string.IsNullOrEmpty(arrivalAirport))
                        codes.Add(GenerateFlightErrataCode(departureAirport, arrivalAirport));

                    if (!string.IsNullOrEmpty(departureAirport))
                        codes.Add(GenerateFlightErrataCode(departureAirport, null));

                    if (!string.IsNullOrEmpty(arrivalAirport))
                        codes.Add(GenerateFlightErrataCode(null, arrivalAirport));
                }
            }

            //no codes to look for -> skip
            if (!codes.Any())
            {
                return;
            }

            codes = codes.Distinct().ToList();

            var currentLanguageCode = GetLanguageCode(language);
            var erratas = (await GetFlightErrataInfo(codes))?
                .SelectMany(i => i.FlightErrataInfoModels)
                .Where(x => string.Equals(x.LanguageCode, currentLanguageCode, StringComparison.InvariantCultureIgnoreCase));

            transport.FlightErrataInfo = erratas?.Where(e =>
                    DateTime.Compare(e.EffectiveDate.Date, DateTime.Today) <= 0 &&
                    DateTime.Compare(e.DepartureStartDate.Date, date.Value.Date) <= 0 &&
                    DateTime.Compare(date.Value.Date, e.DepartureEndDate.Date) <= 0 &&
                    DateTime.Compare(e.BookStartDate.Date, DateTime.Today) <= 0 &&
                    DateTime.Compare(DateTime.Today, e.BookEndDate.Date) <= 0 &&
                    DateTime.Compare(e.StartDate, date.Value.Date) <= 0 &&
                    DateTime.Compare(date.Value.Date, e.EndDate) <= 0 &&
                    CheckDepartureDayOfWeek(e, transport) &&
                    MatchingInventoryType(e, transport))
                .Select(e => e.Text)
                .Where(i => !string.IsNullOrEmpty(i))
                .Distinct()
                .ToList();
        }

        private string GetLanguageCode(string language)
        {
            return LanguageUtils.GetLanguageCode(language);
        }

        private async Task<List<FlightErrataModel>> GetFlightErrataInfo(List<string> codes)
        {
            try
            {
                if (!codes.Any())
                {
                    return null;
                }

                var ctxBuilder = new DynamoDBContextBuilder();

                using var context = ctxBuilder.WithDynamoDBClient(_awsClient.GetClient).Build();

                var batch = context.CreateBatchGet<FlightErrataDynamoDbEntry>(new BatchGetConfig
                {
                    OverrideTableName = _awsSettings.Storage.Tables.FlightErrataInfo
                });

                foreach (var code in codes)
                {
                    batch.AddKey(code);
                }

                await batch.ExecuteAsync();

                if (!batch.Results.Any())
                {
                    return null;
                }

                var resultList = new List<FlightErrataModel>();
                foreach (var flightErrataDynamoDbEntry in batch.Results)
                {
                    var flightErrataModel = new FlightErrataModel()
                    {
                        Code = flightErrataDynamoDbEntry.Code,
                        FlightErrataInfoModels =
                            JsonConvert.DeserializeObject<List<FlightErrataInfoModel>>(flightErrataDynamoDbEntry
                                .ErratasInfo)
                    };

                    resultList.Add(flightErrataModel);
                }

                return resultList;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Can't get flight errata for codes {string.Join(",", codes)}");
                return null;
            }
        }

        private async Task DeleteOldErrataInternal(ScanRequest scanRequest)
        {
            Dictionary<string, AttributeValue> lstEvaluatedKey = null;

            try
            {
                using var client = GetClient();
                var deleteRequests = new List<WriteRequest>();

                ScanResponse allItemsResponse;
                do
                {
                    scanRequest.ExclusiveStartKey = lstEvaluatedKey;

                    allItemsResponse = await client.ScanAsync(scanRequest);

                    lstEvaluatedKey = allItemsResponse.LastEvaluatedKey;

                    foreach (var item in allItemsResponse.Items)
                    {
                        deleteRequests.Add(new WriteRequest(new DeleteRequest(new Dictionary<string, AttributeValue>
                        {
                            {Code, new AttributeValue {S = item[Code].S}},
                        })));
                    }
                } while (allItemsResponse?.LastEvaluatedKey?.Count > 0);

                if (deleteRequests.Any())
                {
                    await ProcessBatchRequests(client, deleteRequests, scanRequest.TableName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogInformation(ex, "Error while deleting info for hotels");
            }
        }

        /// <summary>
        /// Build attributes map to save in DynamoDB
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        private Dictionary<string, AttributeValue> BuildBaseAttrs(HotelErrataModel model)
        {
            _logger.LogInformation("Code: {HotelCode}, erratas: {ErratasInfoCount}", model.HotelCode, model.ErratasInfo.Count);

            var map = new Dictionary<string, AttributeValue>
            {
                // Key and sort key
                {Code, new AttributeValue { S = model.HotelCode} },

                {ErratasInfo, new AttributeValue { S = JsonConvert.SerializeObject(model.ErratasInfo)}}
            };

            return map;
        }

        /// <summary>
        /// Build attributes map to save in DynamoDB
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        private Dictionary<string, AttributeValue> BuildFlightErrataBaseAttrs(FlightErrataModel model)
        {
            _logger.LogInformation("Code: {HotelCode}, erratas: {ErratasInfoCount}", model.Code, model.FlightErrataInfoModels.Count);

            var map = new Dictionary<string, AttributeValue>
            {
                // Key and sort key
                {Code, new AttributeValue { S = model.Code} },
                {ErratasInfo, new AttributeValue { S = JsonConvert.SerializeObject(model.FlightErrataInfoModels)}}
            };

            return map;
        }

        private async Task ProcessBatchRequests(IAmazonDynamoDB client, ICollection<WriteRequest> requests, string tableName)
        {
            var chunkSize = _awsSettings.Errata.ChunkSize > 0 ? _awsSettings.Errata.ChunkSize : _batchChunkSizeDefault;
            var chunkDelayMs = _awsSettings.Errata.ChunkDelayMs;
            var chunks = requests.Split(chunkSize).ToList(); // Batch write chunk size

            _logger.LogInformation(
                "Starting processing batch request, chunk size: {ChunkSize}, chunk delay: {ChunkDelayMs}ms, chunks: {Chunks}",
                chunkSize,
                chunkDelayMs,
                chunks.Count);

            for (var i = 0; i < chunks.Count; i++)
            {
                try
                {
                    var chunk = chunks[i];
                    var batchWriteItemRequest = new BatchWriteItemRequest(
                        new Dictionary<string, List<WriteRequest>>
                        {
                            {tableName, chunk.ToList()}
                        });

                    await _batchWriter.WriteAsync(client, batchWriteItemRequest);

                    _logger.LogInformation("Processed chunk {I} of {Count}", i + 1, chunks.Count);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to process chunk {I} of {Count}", i + 1, chunks.Count);
                }

                if (chunkDelayMs > 0 && i < chunks.Count - 1)
                    await Task.Delay(chunkDelayMs);
            }
        }

        private bool CheckDepartureDayOfWeek(FlightErrataInfoModel flightErrataInfoModel, Transport transport)
        {
            var firstOutBoundRoute = transport?.Routes?.FirstOrDefault(i => i.Direction == Direction.Outbound);
            var departureDayOfWeekOutBound = (firstOutBoundRoute?.DepDate.HasValue ?? false) ? firstOutBoundRoute?.DepDate.Value.DayOfWeek : null;

            var firstInBoundRoute = transport?.Routes?.FirstOrDefault(i => i.Direction == Direction.Inbound);
            var departureDayOfWeekInBound = (firstInBoundRoute?.DepDate.HasValue ?? false) ? firstInBoundRoute?.DepDate.Value.DayOfWeek : null;

            var outBoundWeekDayMatching = departureDayOfWeekOutBound != null && flightErrataInfoModel.DepartDays.HasFlag(GetDepartDaysFlag(departureDayOfWeekOutBound.Value));
            var inboundWeekDayMatching = departureDayOfWeekInBound != null && flightErrataInfoModel.DepartDays.HasFlag(GetDepartDaysFlag(departureDayOfWeekInBound.Value));

            return outBoundWeekDayMatching || inboundWeekDayMatching;
        }

        private static DepartDays GetDepartDaysFlag(DayOfWeek dayOfWeek)
        {
            return (DepartDays)(1 << (int)dayOfWeek);
        }

        private bool MatchingInventoryType(FlightErrataInfoModel flightErrataInfoModel, Transport transport)
        {
            bool IsExternal()
            {
                var firstOutBoundRoute = transport?.Routes?.FirstOrDefault(i => i.Direction == Direction.Outbound);
                var isExternalOutBound = firstOutBoundRoute?.IsExternal;
                return isExternalOutBound ?? false;
            }

            switch (flightErrataInfoModel.InventoryType)
            {
                case InventoryType.External:
                    return IsExternal();

                case InventoryType.Internal:
                    return !IsExternal();

                case InventoryType.AllInventory:
                    return true;

                default:
                    return false;
            }
        }

        private async Task SaveInternal<T>(List<T> data, Func<T, Dictionary<string, AttributeValue>> getAttributes, Func<T, string> getItemCode, string tableName)
        {
            var requests = new List<WriteRequest>();
            foreach (var item in data)
            {
                try
                {
                    var attrs = getAttributes(item);
                    requests.Add(new WriteRequest(new PutRequest(attrs)));
                }
                catch (Exception ex)
                {
                    _logger?.LogError(ex, $"Failed to convert item to batch requests for {getItemCode(item)}");
                }
            }

            using (var client = GetClient())
            {
                await ProcessBatchRequests(client, requests, tableName);
            }
        }

        /// <summary>
        /// Get errata by code
        /// </summary>
        /// <param name="code"></param>
        /// <returns></returns>
        private async Task<HotelErrataModel> GetErrataInfo(string code)
        {
            try
            {
                if (string.IsNullOrEmpty(code))
                {
                    return null;
                }

                var request = new GetItemRequest
                {
                    TableName = _awsSettings.Storage.Tables.ErrataInfo,
                    Key = new Dictionary<string, AttributeValue>()
                            {
                                { Code, new AttributeValue() { S = code } },
                            }
                };

                using (var client = _awsClient.GetClient())
                {
                    var response = await client.GetItemAsync(request);
                    var item = response.Item;

                    item.TryGetValue(ErratasInfo, out var errataInfo);

                    if (string.IsNullOrEmpty(errataInfo?.S))
                    {
                        return null;
                    }

                    return new HotelErrataModel()
                    {
                        HotelCode = code,
                        ErratasInfo = JsonConvert.DeserializeObject<List<ErrataInfoModel>>(errataInfo.S)
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Can't get errata for {Code} hotel from data base", code);
                return null;
            }
        }
    }
}
using System;
using System.Globalization;
using System.Threading.Tasks;
using easyJet.Foundation.BeCause.Logging;
using easyJet.Foundation.BeCause.Models.Request;
using easyJet.Foundation.BeCause.Models.Response;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using EasyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Services.Api
{
    [Service(typeof(IMasterDataService), Lifetime = Lifetime.Transient)]
    public class MasterDataService : IMasterDataService
    {
        private readonly IEndpointService endpointService;
        private readonly IClientService clientService;
        private readonly IBeCauseLogger logger;

        public MasterDataService(IEndpointService endpointService, IClientService clientService, IBeCauseLogger logger)
        {
            this.endpointService = endpointService;
            this.clientService = clientService;
            this.logger = logger;
        }

        public async Task<StandardsSearchResponse> GetStandardsSearchResultAsync(StandardsSearchRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var url = endpointService.GetStandardsSearchEndpoint;
            var payload = CreatePayload(request);
            try
            {
                var correlationId = await clientService.GetResultAsync(url, payload).ConfigureAwait(false);
                if (string.IsNullOrEmpty(correlationId))
                {
                    logger.Warn($"{nameof(GetStandardsSearchResultAsync)} received empty response", this);
                    return null;
                }

                var statusResponse = await GetStatusAsync(correlationId).ConfigureAwait(false);
                if (statusResponse == null)
                {
                    logger.Warn($"{nameof(GetStandardsSearchResultAsync)} received null from {nameof(GetStatusAsync)} for correlationId:{correlationId}", this);
                    return null;
                }

                var resultUrl = statusResponse.Result?.ResultUrl;
                if (string.IsNullOrEmpty(resultUrl))
                {
                    logger.Warn($"{nameof(GetStandardsSearchResultAsync)} result url was empty for correlationId:{correlationId}", this);
                    return null;
                }

                var resultData = await clientService.GetDataAsync(resultUrl).ConfigureAwait(false);
                if (string.IsNullOrEmpty(resultData))
                {
                    logger.Warn($"{nameof(GetStandardsSearchResultAsync)} could not download data for result url:{resultUrl}", this);
                    return null;
                }

                var data = JsonConvert.DeserializeObject<StandardsSearchResponse>(resultData);
                if (data == null)
                {
                    logger.Warn($"{nameof(GetStandardsSearchResultAsync)} could not deserialize resultData for result url:{resultUrl}", this);
                    return null;
                }

                return data;
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(GetStandardsSearchResultAsync)}", ex, this);
                return null;
            }
        }

        public async Task<CompaniesSearchResponse> GetCompaniesSearchResultAsync(CompaniesSearchRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var url = endpointService.GetCompaniesSearchEndpoint;
            var payload = CreatePayload(request);
            try
            {
                var createTaskResponse = await clientService.GetResultAsync(url, payload).ConfigureAwait(false);
                if (string.IsNullOrEmpty(createTaskResponse) || !createTaskResponse.TryParseJson<CreateTaskResponse>(out var createTaskData))
                {
                    logger.Warn($"{nameof(GetCompaniesSearchResultAsync)} received empty or invalid response - data:{createTaskResponse}", this);
                    return null;
                }

                var correlationId = createTaskData?.CorrelationId;
                if (string.IsNullOrEmpty(correlationId))
                {
                    logger.Warn($"{nameof(GetCompaniesSearchResultAsync)} could not deserialize createTaskResponse:{createTaskResponse}", this);
                    return null;
                }

                logger.Info($"Search Task created, received {nameof(correlationId)}:'{correlationId}'", this);

                var statusResponse = await GetStatusAsync(correlationId).ConfigureAwait(false);
                if (statusResponse == null)
                {
                    logger.Warn($"{nameof(GetCompaniesSearchResultAsync)} received null from {nameof(GetStatusAsync)} for correlationId:{createTaskResponse}", this);
                    return null;
                }

                var resultUrl = statusResponse.Result?.ResultUrl;
                if (string.IsNullOrEmpty(resultUrl))
                {
                    logger.Warn($"{nameof(GetCompaniesSearchResultAsync)} result url was empty for correlationId:{createTaskResponse}", this);
                    return null;
                }

                var resultData = await clientService.GetDataAsync(resultUrl).ConfigureAwait(false);
                if (string.IsNullOrEmpty(resultData))
                {
                    logger.Warn($"{nameof(GetCompaniesSearchResultAsync)} could not download data for result url:{resultUrl}", this);
                    return null;
                }

                var data = JsonConvert.DeserializeObject<CompaniesSearchResponse>(resultData);
                if (data == null)
                {
                    logger.Warn($"{nameof(GetCompaniesSearchResultAsync)} could not deserialize resultData for result url:{resultUrl}", this);
                    return null;
                }

                return data;
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(GetCompaniesSearchResultAsync)}", ex, this);
                return null;
            }
        }

        public async Task GetHotelMappingResultAsync(HotelMappingRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var url = endpointService.GetCompanyMappingsEndpoint;
            var payload = CreatePayload(request);
            try
            {
                var createTaskResponse = await clientService.GetResultAsync(url, payload).ConfigureAwait(false);
                if (string.IsNullOrEmpty(createTaskResponse) || !createTaskResponse.TryParseJson<CreateTaskResponse>(out var createTaskData))
                {
                    logger.Warn($"{nameof(GetHotelMappingResultAsync)} received empty or invalid response - data:{createTaskResponse}", this);
                    return;
                }

                var correlationId = createTaskData?.CorrelationId;
                if (string.IsNullOrEmpty(correlationId))
                {
                    logger.Warn($"{nameof(GetHotelMappingResultAsync)} could not deserialize createTaskResponse:{createTaskResponse}", this);
                    return;
                }

                logger.Info($"Mapping Request created, received {nameof(correlationId)}:'{correlationId}'", this);
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(GetHotelMappingResultAsync)}", ex, this);
            }
        }

        private async Task<StatusResponse> GetStatusAsync(string correlationId)
        {
            try
            {
                var firstCall = true;
                var url = $"{endpointService.GetStatusEndpoint}{correlationId}";
                var countRetries = Constants.GetSearchStatusRetryCount;
                do
                {
                    if (!firstCall)
                    {
                        await Task.Delay(endpointService.GetPollingDelay).ConfigureAwait(false);
                    }
                    else
                    {
                        firstCall = false;
                    }

                    var response = await clientService.GetStatusAsync(url).ConfigureAwait(false);
                    if (string.IsNullOrEmpty(response))
                    {
                        logger.Warn($"{nameof(GetStatusAsync)} received an empty response which indicates an issue - stopping polling for data for correlationId:{correlationId}", this);
                        return null;
                    }

                    var data = JsonConvert.DeserializeObject<StatusResponse>(response);
                    if (data == null)
                    {
                        logger.Warn($"could not parse response to {nameof(StatusResponse)} - received:{response}", this);
                        return null;
                    }

                    logger.Info($"Received State:'{data.Status}'. Retries remaining:'{countRetries}'", this);
                    if (data.Status == ApiStatus.Cancelled || data.Status == ApiStatus.Error)
                    {
                        logger.Warn($"{nameof(GetStatusAsync)} received - status:{data.Status} - error:{data.Error?.ErrorUrl} - correlationId:{data.CorrelationId}", this);
                        return data;
                    }

                    if (data.Status == ApiStatus.Success || data.Status == ApiStatus.PartialSuccess)
                    {
                        logger.Info($"{nameof(GetStatusAsync)} received - status:{data.Status} - result:{data.Result?.ResultUrl} - correlationId:{data.CorrelationId}", this);
                        return data;
                    }
                }
                while (--countRetries > 0);

                throw new Exception($"Retry limit exceeded - no data received after {Constants.GetSearchStatusRetryCount} retries!");
            }
            catch (Exception ex)
            {
                logger.Error($"stopping polling for data for correlationId:{correlationId} due to exception", ex, this);
                return null;
            }
        }

        private string CreatePayload<T>(T data)
        {
            return JsonConvert.SerializeObject(data, Formatting.None, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore, Culture = CultureInfo.InvariantCulture });
        }
    }
}

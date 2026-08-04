using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.MediaCenter;
using easyJet.Holidays.Api.Domain.Interfaces.MediaCenter;
using easyJet.Holidays.External.Cms.Models.MediaCenter;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;

namespace easyJet.Holidays.External.Cms.Services
{
    public class MediaCenterSearchService : IMediaCenterSearchService
    {
        private readonly IApiService _apiService;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public MediaCenterSearchService(IApiService apiService, EndpointsProvider endpointsProvider, IHttpContextAccessor httpContextAccessor)
        {
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
        }

        /// <inheritdoc />
        public async Task<ArticlesResponse> GetArticles(ArticlesRequest requestBody)
        {
            var request = new ArticlesSearchRequest();

            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetMediaCenterArticles, _httpContextAccessor.HttpContext.Request.Cookies);
            request.Payload.Body = new ArticlesRequest
            {
                Take = requestBody.Take,
                Page = requestBody.Page,
                Offset = requestBody.Offset,
                StartDate = requestBody.StartDate,
                EndDate = requestBody.EndDate,
                Query = requestBody.Query,
                Topics = requestBody.Topics
            };

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<ArticlesSearchRequest, ArticlesSearchResponse>(request, ApiExceptionCodes.MediaCenterArticleError);

            return new ArticlesResponse
            {
                Total = response.Payload?.Body.Total ?? default(int),
                Articles = response.Payload?.Body.Articles,
                TopicsFilter = response.Payload?.Body.TopicsFilter
            };
        }

        /// <inheritdoc />
        public async Task<string[]> GetTopics()
        {
            var request = new TopicsSearchRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetMediaCenterTopics, _httpContextAccessor.HttpContext.Request.Cookies);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<TopicsSearchRequest, TopicsSearchResponse>(request, ApiExceptionCodes.MediaCenterTopicsError);

            return response.Payload?.Body;
        }
    }
}

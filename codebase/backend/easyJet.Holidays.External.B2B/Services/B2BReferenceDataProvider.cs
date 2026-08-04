using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.B2B.Models.CountryInformation;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.B2B.Services
{
    public class B2BReferenceDataProvider : IB2BReferenceDataProvider
    {

        private readonly IApiService _apiService;
        private readonly B2BSettings _b2bSettings;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public B2BReferenceDataProvider(
            IApiService apiService,
            IOptions<B2BSettings> b2bSettings,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor)
        {
            _b2bSettings = b2bSettings.Value ?? throw new ArgumentNullException(nameof(b2bSettings));
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<CountryInformation>> GetB2BCountries()
        {
            var request = new CountryInformationRequest();
            request.Payload.Body = new CountryInformationRequestBody(_b2bSettings)
            {
                LanguageCode = _b2bSettings.LanguageCode
            };
            request.Endpoint = _endpointsProvider.GetEndpoint(B2BEndpoint.BasicService, _httpContextAccessor.HttpContext?.Request?.Cookies);

            var countriesInfo = await _apiService.GetResponseContentAsyncWithErrorMapping<CountryInformationRequest, CountryInformationResponse>
                (request, ApiExceptionCodes.AuthCustomerCountriesError);
            return countriesInfo.Payload.Body.DataListRoot.CountryInformationList;
        }
    }
}

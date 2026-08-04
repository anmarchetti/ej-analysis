using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking.Extras;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.FlightExtras;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using FlightExtraSearchRequest = easyJet.Holidays.External.Atcom.Models.FlightExtraSearch.FlightExtraSearchRequest;
using FlightExtraSearchResponse = easyJet.Holidays.External.Atcom.Models.FlightExtraSearch.FlightExtraSearchResponse;

namespace easyJet.Holidays.External.Atcom.Services.FlightExtras;

/// <inheritdoc />
public class FlightExtraSearchService : IFlightExtraSearchService
{
    private readonly IApiService _apiService;
    private readonly AtcomRequestGenerator _atcomRequestGenerator;
    private readonly EndpointsProvider _atcomRequestBuilder;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IReferenceDataService _referenceDataService;

    public FlightExtraSearchService(
        IApiService apiService,
        AtcomRequestGenerator atcomRequestGenerator,
        EndpointsProvider atcomRequestBuilder,
        IHttpContextAccessor httpContextAccessor,
        IReferenceDataService referenceDataService)
    {
        _apiService = apiService;
        _atcomRequestGenerator = atcomRequestGenerator;
        _atcomRequestBuilder = atcomRequestBuilder;
        _httpContextAccessor = httpContextAccessor;
        _referenceDataService = referenceDataService;
    }

    /// <inheritdoc />
    public async Task<IList<FlightExtraCategoryList>> GetFlightExtras(Offer offer, IEnumerable<Person> guests, bool isPostBooking)
    {
        ArgumentNullException.ThrowIfNull(offer);

        var luggage = await _referenceDataService.GetLuggage();
        var luggageSettings = await _referenceDataService.GetLuggageSettings();
        var promoCodeSettings = await _referenceDataService.GetPromoCodeSetting();
        var atcomRequest = FlightExtraSearchMapper.MapRequest(offer, guests, _atcomRequestGenerator.BuildCurrentCltInfo(true, offer.PromotionCollections), promoCodeSettings?.FlightExtrasSearchPromoCode);
        var flightExtrasRequest = new FlightExtraSearchRequest
        {
            Payload =
            {
                Body = atcomRequest
            },
            Endpoint = _atcomRequestBuilder.GetEndpoint(AtcomEndpoint.Booking, _httpContextAccessor.HttpContext?.Request?.Cookies)
        };

        var response = await _apiService.GetResponseContentAsyncWithErrorMapping<FlightExtraSearchRequest, FlightExtraSearchResponse>(
            flightExtrasRequest, ApiExceptionCodes.FlightExtraSearchRequestError);

        return FlightExtraSearchMapper.MapResponse(response, luggage, luggageSettings, isPostBooking);
    }
}

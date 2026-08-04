using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Mappers.Utils;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Atcom.Services;
using Microsoft.AspNetCore.Http;
using BookingResponse = easyJet.Holidays.Api.Domain.Data.Booking.BookingResponse;
using InfoCancellationRequest = easyJet.Holidays.External.Atcom.Models.InfoCancellation.InfoCancellationRequest;
using InfoCancellationResponse = easyJet.Holidays.External.Atcom.Models.Internal.InfoCancellationResponse;

namespace easyJet.Holidays.External.Atcom.Mappers.InfoCancellation;

/// <summary>
/// Maps the InfoCancellation request and response
/// </summary>
/// <param name="priceMapper"></param>
/// <param name="atcomRequestBuilder"></param>
/// <param name="httpContextAccessor"></param>
/// <param name="atcomRequestGenerator"></param>
/// <param name="bookingCancellationRequestService"></param>
public class InfoCancellationMapper(
    PriceMapper priceMapper,
    EndpointsProvider atcomRequestBuilder,
    IHttpContextAccessor httpContextAccessor,
    AtcomRequestGenerator atcomRequestGenerator,
    IBookingCancellationRequestService bookingCancellationRequestService): IInfoCancellationMapper
{
    private readonly string[] _cancellationFeeNames = ["Cancellation Fee" , "Cancellation Charge"];

    /// <summary>
    /// Creates the InfoCancellation request
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <param name="withoutFee"></param>
    /// <param name="withoutFeeSpecified"></param>
    /// <param name="discountCode"></param>
    /// <returns></returns>
    public async Task<InfoCancellationRequest> CreateRequest(BookingResponse bookingResponse, bool withoutFee, bool withoutFeeSpecified, string discountCode)
    {
        ArgumentNullException.ThrowIfNull(bookingResponse);

        var bookingReference = bookingResponse.BookingReference;
        var clientInfo = await GetClientInfo(bookingResponse);
        var bookingRequest = new InfoCancellationRequest
        {
            Payload =
            {
                Body = new Models.Internal.InfoCancellationRequest
                {
                    BkgNum = new []{new BkgNum() { BkgId = bookingReference } } ,
                    Adm = VrpRequestUtils.BuildAdm(),
                    Cnx_Without_Fee = withoutFee,
                    Cnx_Without_FeeSpecified = withoutFeeSpecified,
                    Items = [new Disc() { Disc_Code = discountCode }],
                    CltInfo = clientInfo
                }
            },
            Endpoint = atcomRequestBuilder.GetEndpoint(AtcomEndpoint.Booking, httpContextAccessor.HttpContext?.Request?.Cookies)
        };

        return bookingRequest;
    }

    /// <summary>
    /// Maps the InfoCancellation response
    /// </summary>
    /// <param name="response"></param>
    /// <returns></returns>
    public Holidays.Api.Domain.Data.Booking.InfoCancellationResponse MapResponse(InfoCancellationResponse response)
    {
        ArgumentNullException.ThrowIfNull(response);

        var feeItems = priceMapper.MapAmendmentFeeInfoItems(response.Bkg_Ent.Prices);

        var result = feeItems.Aggregate(
            (CancellationFeeItem: (FeeItem)null, OtherFeeItems: new List<FeeItem>()),
            (acc, item) =>
            {
                if (_cancellationFeeNames.Contains(item.Name))
                {
                    acc.CancellationFeeItem = item;
                }
                else
                {
                    acc.OtherFeeItems.Add(item);
                }
                return acc;
            });

        return new Holidays.Api.Domain.Data.Booking.InfoCancellationResponse
        {
            BookingReference = response.BkgNum.BkgId,
            BookingStatus = response.BkgSts.ToString(),
            BookingDate = response.His?.Bkg_Dt_Tm.Date,
            CancellationDate = response.His?.Cnx_Dt_Tm,
            HasNotice = response.HasAgt_Notice,
            CancellationFeeItem = result.CancellationFeeItem,
            FeeItems = result.OtherFeeItems
        };
    }

    private async Task<CltInfo> GetClientInfo(BookingResponse bookingResponse)
    {
        if (await bookingCancellationRequestService.IsWebsiteRequest())
            return atcomRequestGenerator.BuildCurrentCltInfo(promotionAgentKey: bookingResponse.PromotionCollections);

        var marketCode = bookingResponse.MarketCode;
        var language = bookingResponse.Language;

        if (!bookingResponse.IsExternalAgency)
            return atcomRequestGenerator.BuildCltInfo(marketCode, language, true, bookingResponse.PromotionCollections);

        var agentDetails = new AgentDetails()
        {
            Name = bookingResponse.AgentData.AgentName, 
            Number = bookingResponse.AgentData.AgentNumber
        };
        return atcomRequestGenerator.BuildCltInfo(marketCode, language, agentDetails);
    }
}
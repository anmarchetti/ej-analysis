using easyJet.Holidays.Api.Domain.Data.Booking;
using InfoCancellationResponse = easyJet.Holidays.External.Atcom.Models.Internal.InfoCancellationResponse;

namespace easyJet.Holidays.External.Atcom.Mappers.InfoCancellation;

/// <summary>
/// 
/// </summary>
public interface IInfoCancellationMapper
{
    /// <summary>
    /// 
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <param name="withoutFee"></param>
    /// <param name="withoutFeeSpecified"></param>
    /// <param name="discountCode"></param>
    /// <returns></returns>
    public Task<Models.InfoCancellation.InfoCancellationRequest> CreateRequest(BookingResponse bookingResponse,
        bool withoutFee, bool withoutFeeSpecified, string discountCode);

    /// <summary>
    /// 
    /// </summary>
    /// <param name="response"></param>
    /// <returns></returns>
    public Holidays.Api.Domain.Data.Booking.InfoCancellationResponse MapResponse(InfoCancellationResponse response);
}
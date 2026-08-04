using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.TransferManagementPlatform.Models;

internal class DetailsResponse : JsonApiResponse<TransferDetailsPayload>
{
    public override ApiError[] ApiErrors { get; } = [];
}
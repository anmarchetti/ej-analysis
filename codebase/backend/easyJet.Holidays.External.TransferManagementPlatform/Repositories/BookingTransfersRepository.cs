using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.TransferManagementPlatform.Models;
using easyJet.Holidays.External.TransferManagementPlatform.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.TransferManagementPlatform.Repositories;

/// <inheritdoc/>
public sealed class BookingTransfersRepository(
    IApiService apiService,
    EndpointsProvider endpointsProvider
) : IBookingTransfersRepository
{
    /// <inheritdoc/>
    public async ValueTask<TransferDetailsPayload?> GetTransferDetails(string bookingReference,
        CancellationToken cancellationToken)
    {
        var request = new DetailsRequest
        {
            Endpoint = endpointsProvider.GetEndpoint(TransferManagementEndpoint.BookingTransferDetails,
                new Dictionary<string, string> { { "bookingReference", bookingReference } })
        };

        var response =
            await apiService.GetResponseContentAsyncWithErrorMapping<DetailsRequest, DetailsResponse>(request,
                ApiExceptionCodes.TransferManagementPlatformTransferDetailsGet);
        return response?.Payload?.Body;
    }
}
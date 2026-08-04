using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;

namespace easyJet.Holidays.Api.Domain.Services.BulkTool.Commands
{
    public interface IBulkToolCommand
    {
        Task<BulkToolResponse> Invoke(BookingResponse booking, BulkToolRequest request, string correlationId);
    }
}

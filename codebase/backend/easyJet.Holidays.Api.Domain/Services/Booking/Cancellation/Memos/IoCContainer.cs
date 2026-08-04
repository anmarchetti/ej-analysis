using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos.RepCodeStrategies;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos;

[ExcludeFromCodeCoverage]
internal static class IoCContainer
{
    internal static IServiceCollection AddMemos(this IServiceCollection services)
    {
        return services
            .AddAllImplementationsOfInterface<IBookingCancellationRepCodeStrategy>()
            .AddTransient<IBookingCancellationRepCodeService, BookingCancellationRepCodeService>()
            .AddTransient<IBookingCancellationMemoService, BookingCancellationMemoService>();
    }
}
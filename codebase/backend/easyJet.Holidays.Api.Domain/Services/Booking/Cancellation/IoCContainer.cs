using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation;

/// <summary>
/// IoC container for booking cancellations services
/// </summary>
[ExcludeFromCodeCoverage]
public static class IoCContainer
{
    /// <summary>
    /// Adds the booking cancellations services to the service collection
    /// </summary>
    /// <param name="services"></param>
    /// <returns></returns>
    public static IServiceCollection AddBookingCancellations(this IServiceCollection services)
    {
        return services
            .AddBreakdownStrategies()
            .AddMemos()
            .AddScoped<IBookingCancellationService, BookingCancellationService>()
            .AddScoped<IBookingCancellationRefundValidationService, BookingCancellationRefundValidationService>()
            .AddScoped<IBookingCancellationCreditRulesEngine, BookingCancellationCreditRulesEngine>()
            .AddScoped<IBookingCancellationRefundBreakdownService, BookingCancellationRefundBreakdownService>()
            .AddScoped<IBookingCancellationRefundSummaryService, BookingCancellationRefundSummaryService>()
            .AddScoped<IBookingCreditExpiryStateService, BookingCreditExpiryStateService>()
            .AddScoped<IBookingCancellationCreditRefundService, BookingCancellationCreditRefundService>()
            .AddScoped<IBookingCancellationPaymentRefundService, BookingCancellationPaymentRefundService>()
            .AddScoped<IBookingCancellationRefundOptionService, BookingCancellationRefundOptionService>()
            .AddScoped<IBookingCancellationCalculateCreditRefundService, BookingCancellationCalculateCreditRefundService>();
    }
}

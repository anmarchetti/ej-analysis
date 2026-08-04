using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;

[ExcludeFromCodeCoverage]
internal static class IoCContainer
{
    internal static IServiceCollection AddBreakdownStrategies(this IServiceCollection services)
    {
        return services
            .AddAllImplementationsOfInterface<IRefundBreakdownStrategy>()
            .AddTransient<IFeeCalculator, FeeCalculator>();

    }
}

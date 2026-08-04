using easyJet.Holidays.Api.Domain.Services.Authentication;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.Api.Domain.Services;

[ExcludeFromCodeCoverage]
internal static class ServicesIoC
{
    internal static IServiceCollection AddServicesServices(this IServiceCollection services)
    {
        return services
            .AddAuthenticationServices();
    }
}
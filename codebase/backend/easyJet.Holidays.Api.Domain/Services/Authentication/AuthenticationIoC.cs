using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.Api.Domain.Services.Authentication;

[ExcludeFromCodeCoverage]
internal static class AuthenticationIoC
{
    internal static IServiceCollection AddAuthenticationServices(this IServiceCollection services)
    {
        return services
            .AddScoped<ICustomerIdentifierProvider, CustomerIdentifierProvider>();
    }
}
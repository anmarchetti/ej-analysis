using easyJet.Holidays.Api.Domain.Services;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.Api.Domain;

/// <summary>
/// 
/// </summary>
[ExcludeFromCodeCoverage]
public static class DomainIoC
{
    /// <summary>
    /// 
    /// </summary>
    /// <param name="services"></param>
    /// <returns></returns>
    public static IServiceCollection AddDomainServices(this IServiceCollection services)
    {
        return services
            .AddServicesServices();
    }
}
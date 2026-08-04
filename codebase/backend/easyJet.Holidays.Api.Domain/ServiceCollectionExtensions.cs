using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace easyJet.Holidays.Api.Domain;

internal static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAllImplementationsOfInterface<TInterface>(this IServiceCollection services)
    {
        return services.AddAllImplementationsOfInterface<TInterface>(Assembly.GetExecutingAssembly());
    }

    public static IServiceCollection AddAllImplementationsOfInterface<TInterface>(this IServiceCollection services,
        Assembly assembly)
    {
        var interfaceType = typeof(TInterface);
        var implementations = assembly.GetTypes()
            .Where(t => t is { IsClass: true, IsAbstract: false } && interfaceType.IsAssignableFrom(t));

        foreach (var implementation in implementations)
        {
            services.AddTransient(interfaceType, implementation);
        }

        return services;
    }
}
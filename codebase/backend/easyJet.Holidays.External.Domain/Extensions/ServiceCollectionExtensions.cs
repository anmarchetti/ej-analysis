using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace easyJet.Holidays.External.Domain.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddConfiguredHttpClient<TClient>(
            this IServiceCollection services, IConfiguration configuration
        ) where TClient : class
        {
            configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));

            var envSettings = configuration.GetSection("EnvironmentBehaviour")
                                           .Get<EnvironmentBehaviourSettings>();
            if (envSettings == null)
                throw new InvalidOperationException($"Failed to get {nameof(EnvironmentBehaviourSettings)}");

            services.AddHttpClient<TClient>()
                    .ConfigurePrimaryHttpMessageHandler(() => ApiClientUtils.ConfigurePrimaryHttpMessageHandler(envSettings))
                    .ConfigureHttpClient(client => { client.Timeout = Timeout.InfiniteTimeSpan; });

            return services;
        }
    }
}

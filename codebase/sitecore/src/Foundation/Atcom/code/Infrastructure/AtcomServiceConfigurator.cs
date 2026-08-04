using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.SitecoreExtensions.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Microsoft.Extensions.DependencyInjection;
using Sitecore.Configuration;
using Sitecore.DependencyInjection;

namespace easyJet.Foundation.Atcom.Infrastructure
{
    [ExcludeFromCodeCoverage]
    public class AtcomServiceConfigurator : IServicesConfigurator
    {
        public void Configure(IServiceCollection serviceCollection)
        {
            serviceCollection.AddTransient<ISftpService>(factory =>
                new SftpService(
                    new SftpConfig()
                    {
                        Host = Settings.GetSetting("Atcom.Hybris.Host"),
                        Port = Settings.GetIntSetting("Atcom.Hybris.Port", 22),
                        Login = SecretsManager.GetSecret("Atcom.Hybris.Login"),
                        Password = SecretsManager.GetSecret("Atcom.Hybris.Pass"),
                    },
                    factory.GetService<ICsvUtilsService>(),
                    factory.GetService<IAtcomLogger>()));
        }
    }
}
using System.Diagnostics.CodeAnalysis;
using easyJet.Feature.SitecoreEnhancment.Services;
using Microsoft.Extensions.DependencyInjection;
using Sitecore.DependencyInjection;
using Sitecore.Layouts.PageExtenders;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.PageExtenders
{
    [ExcludeFromCodeCoverage]
    public class EnvironmentHintPageExtender : PageExtender
    {
        private readonly IEnvironmentHintService environmentHintService = ServiceLocator.ServiceProvider.GetService<IEnvironmentHintService>();

        public override void Insert()
        {
            environmentHintService.AddEnvironmentStyle();
        }
    }
}

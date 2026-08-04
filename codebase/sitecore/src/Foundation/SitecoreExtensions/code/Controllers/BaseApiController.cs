using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.SitecoreExtensions.Logger;
using Sitecore.Services.Infrastructure.Web.Http;

namespace easyJet.Foundation.SitecoreExtensions.Controllers
{
    [ExcludeFromCodeCoverage]
    // TODO: Add comments
    public class BaseApiController : ServicesApiController
    {
#pragma warning disable SA1401 // Fields should be private
        protected readonly ILogger Logger;
#pragma warning restore SA1401 // Fields should be private

        public BaseApiController(ILogger logger)
        {
            Logger = logger;
        }
    }
}
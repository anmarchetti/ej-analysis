using System.Web;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Foundation.Presentation.Services
{
    [Service(typeof(IUrlDecodingService), Lifetime = Lifetime.Singleton)]
    public class UrlDecodingService : IUrlDecodingService
    {
        /// <inheritdoc/>
        public string UrlDecode(string encodedValue)
        {
            return HttpUtility.UrlDecode(encodedValue);
        }
    }
}

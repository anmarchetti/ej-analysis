using System.Diagnostics.CodeAnalysis;
using System.Web;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IHttpContextAccessor))]
    public class HttpContextAccessor : IHttpContextAccessor
    {
        public HttpContext GetCurrent()
            => HttpContext.Current;

        public string GetRequestCookieValue(string cookieIndex)
            => GetCurrent()?.Request?.Cookies[cookieIndex] is HttpCookie userCookie && !string.IsNullOrEmpty(userCookie.Value) ? userCookie.Value : null;
    }
}
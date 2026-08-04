using System.Web;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    public interface IHttpContextAccessor
    {
        HttpContext GetCurrent();

        string GetRequestCookieValue(string cookieIndex);
    }
}

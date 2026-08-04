using easyJet.Holidays.Api.Domain.Utils;

namespace easyJet.Holiday.IntegrationTests.Shared.Helpers
{
    public static class CookiesHelper
    {
        public static string BuildCookieString(string name, string value)
        {
            return $"{name}={value}";
        }
    }
}

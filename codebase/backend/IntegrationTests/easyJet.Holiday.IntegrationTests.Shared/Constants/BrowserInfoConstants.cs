using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holiday.IntegrationTests.Shared.Constants;

public class BrowserInfoConstants
{
    public static BrowserInfo DefaultBrowserInfo()
    {
        return new BrowserInfo
        {
            AcceptHeader = "application/json",
            ColourDepth = 24,
            JavaEnabled = false,
            JavaScriptEnabled = true,
            Language = "en",
            ScreenHeight = 1080,
            ScreenWidth = 1920,
            TimeZoneOffset = 0,
            UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.41"
        };
    }
}
namespace easyJet.Holidays.External.Eskel.Settings;

public class EskelSettings
{
    public string AtcomBookingDetailsUrl { get; set; }
    public int? AtcomBookingDetailsTimeoutMilliseconds { get; set; }

    /// <summary>
    /// Required for requesting booking details, not needed for booking margins (for now?)
    /// </summary>
    public string Token { get; set; }

    public int TimeoutMilliSeconds { get; set; }
}
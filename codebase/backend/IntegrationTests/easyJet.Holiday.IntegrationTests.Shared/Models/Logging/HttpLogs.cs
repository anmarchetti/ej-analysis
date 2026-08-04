namespace easyJet.Holiday.IntegrationTests.Shared.Models.Logging;

public class HttpLogs
{
    public string RequestUrl { get; set; }
    public string? RequestBody { get; set; }

    public int StatusCode { get; set; }

    public string CorrelationId { get; set; }

    public string Error { get; set; }
}
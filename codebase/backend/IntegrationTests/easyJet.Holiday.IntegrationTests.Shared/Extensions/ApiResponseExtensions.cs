using easyJet.Holiday.IntegrationTests.Shared.Exceptions;
using easyJet.Holiday.IntegrationTests.Shared.Models.Logging;
using Newtonsoft.Json;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Extensions;

public static class ApiResponseExtensions
{
    public static HttpLogs MapApiResponseToLogs<T>(this ApiResponse<T> apiResponse, object? requestBody = null)
    {
        apiResponse.Headers.TryGetValues("X-Api-CorrelationId", out var list);
        var correlationId = list?.FirstOrDefault();

        return new HttpLogs()
        {
            RequestUrl = apiResponse.RequestMessage.RequestUri.ToString(),
            RequestBody = requestBody != null ? JsonConvert.SerializeObject(requestBody) : null,
            StatusCode = (int)apiResponse.StatusCode,
            CorrelationId = correlationId,
            Error = apiResponse.IsSuccessStatusCode ? string.Empty : apiResponse.Error.Content
        };
    }

    public static void ThrowIfNull<T>(this ApiResponse<T> apiResponse, string reason)
    {
        if (apiResponse is null || apiResponse.Content is null)
        {
            throw new BookingException(reason);
        }
    }
}
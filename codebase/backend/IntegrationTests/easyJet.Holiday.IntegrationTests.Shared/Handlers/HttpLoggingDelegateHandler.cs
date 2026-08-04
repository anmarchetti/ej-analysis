using Allure.XUnit;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text;

namespace easyJet.Holiday.IntegrationTests.Shared.Handlers;

public class HttpLoggingDelegateHandler : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        HttpResponseMessage response = null;
        var loggingStringBuilder = new StringBuilder();

        try
        {
            loggingStringBuilder.AppendLine("REQUEST:");
            loggingStringBuilder.AppendLine($"{request.Method} {request.RequestUri}");
            loggingStringBuilder.AppendLine();

            foreach (var header in request.Headers)
            {
                // Iterate over values, because same header could be present multiple times (e.g. set-cookie)
                foreach (var headerValue in header.Value)
                {
                    loggingStringBuilder.AppendLine($"{header.Key}: {headerValue}");
                }
            }
            loggingStringBuilder.AppendLine();

            var requestContent = request.Content;
            if (requestContent != null)
            {
                var requestString = await requestContent.ReadAsStringAsync();
                if (!string.IsNullOrWhiteSpace(requestString))
                {
                    loggingStringBuilder.AppendLine(ParseAndFormat(requestString));
                    loggingStringBuilder.AppendLine();
                }
            }

            response = await base.SendAsync(request, cancellationToken);

            loggingStringBuilder.AppendLine("RESPONSE:");
            loggingStringBuilder.AppendLine($"HTTP/{response.Version} {(int)response.StatusCode} {response.StatusCode}");
            loggingStringBuilder.AppendLine();

            foreach (var header in response.Headers)
            {
                // Iterate over values, because same header could be present multiple times (e.g. set-cookie)
                foreach (var headerValue in header.Value)
                {
                    loggingStringBuilder.AppendLine($"{header.Key}: {headerValue}");
                }
            }
            loggingStringBuilder.AppendLine();

            var responseContent = response.Content;
            if (responseContent != null)
            {
                var responseString = await responseContent.ReadAsStringAsync();
                if (!string.IsNullOrWhiteSpace(responseString))
                {
                    loggingStringBuilder.AppendLine(ParseAndFormat(responseString));
                    loggingStringBuilder.AppendLine();
                }
            }
        }
        catch (TaskCanceledException)
        {
            return response;
        }
        catch (Exception e)
        {
            loggingStringBuilder.AppendLine();
            throw;
        }
        finally
        {
            // Log to Allure HTML report
            var allureAttachmentName = $"{request.Method} {request.RequestUri}";
            Attachments.Text(allureAttachmentName, loggingStringBuilder.ToString());
        }

        return response;
    }

    private static string ParseAndFormat(string content)
    {
        try
        {
            return JToken.Parse(content).ToString(Formatting.Indented);
        }
        catch (Exception)
        {
            return content;
        }
    }
}
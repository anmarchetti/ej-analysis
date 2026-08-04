using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using easyJet.Feature.Tracker.Models.Dflo;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Sitecore.Configuration;
using Sitecore.Diagnostics;

namespace easyJet.Feature.Tracker.Services
{
    [Service(typeof(IDfloService), Lifetime = Lifetime.Singleton)]
    public class DfloService : IDfloService
    {
        private const string MediaType = "application/json";

        private static int MaxConcurrentTasks => Settings.GetIntSetting(Constants.Performance.MaxConcurrentTasks, 7);

        private static int RequestTimeout => Settings.GetIntSetting(Constants.Performance.RequestTimeout, 5);

        public async Task<Dictionary<string, IEnumerable<Document>>> GetEmailsByEmailAsync(IEnumerable<string> emails)
        {
            var settings = GetSettings(Constants.DfloSettings.EmailsEndPoint);

            if (!AreSettingsValid(settings))
            {
                Log.Error("[Dflo] One or more settings for dflo are not configured.", this);
                return new Dictionary<string, IEnumerable<Document>>();
            }

            var handler = GetClientHandler(settings.SkipSslVerification);

            using (var semaphore = new SemaphoreSlim(MaxConcurrentTasks))
            using (var client = new HttpClient(handler) { Timeout = TimeSpan.FromMinutes(RequestTimeout) })
            {
                var getUserEmailsTasks = emails.Select(async email =>
                {
                    await semaphore.WaitAsync();
                    try
                    {
                        return await Task.Run(() => GetUserEmailsAsync(email, settings, client));
                    }
                    finally
                    {
                        semaphore.Release();
                    }
                });
                var getUserEmailsTasksResults = await Task.WhenAll(getUserEmailsTasks);

                return getUserEmailsTasksResults.ToDictionary(t => t.email, t => t.userEmails);
            }
        }

        public async Task<(string, string)> GetEmailBodyByIdAsync(string emailId)
        {
            var settings = GetSettings(Constants.DfloSettings.EmailBodyEndPoint);

            if (!AreSettingsValid(settings))
            {
                Log.Error("[Dflo] One or more settings for dflo are not configured.", this);
                return (emailId, string.Empty);
            }

            var result = string.Empty;

            var handler = GetClientHandler(settings.SkipSslVerification);

            using (var client = new HttpClient(handler) { Timeout = TimeSpan.FromMinutes(RequestTimeout) })
            {
                try
                {
                    var requestUri = $"{settings.Endpoint}/{emailId}";
                    var httpRequestMessage = new HttpRequestMessage(HttpMethod.Get, requestUri);
                    PrepareRequestMessage(httpRequestMessage, settings.Account, settings.Password);
                    var httpResponse = await GetResponseAsyncFromProvidedClient(client, httpRequestMessage).ConfigureAwait(false);

                    if (!httpResponse.IsSuccessStatusCode)
                    {
                        Log.Error($"[Dflo] Response is not valid for email: {emailId}.", this);
                        return (emailId, result);
                    }

                    result = await httpResponse.Content.ReadAsStringAsync().ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    Log.Error($"[Dflo] Couldn't process/recieve response form Dflo. For email: {emailId}", ex, this);
                }
            }

            return (emailId, result);
        }

        internal virtual Task<HttpResponseMessage> GetResponseAsyncFromProvidedClient(HttpClient client, HttpRequestMessage message) => client.SendAsync(message);

        internal virtual DfloSettings GetSettings(string endpoint) => new DfloSettings
        {
            Endpoint = Settings.GetSetting(endpoint),
            Account = SecretsManager.GetSecret("Dflo.Login"),
            Password = SecretsManager.GetSecret("Dflo.Password"),
            SkipSslVerification = bool.Parse(Settings.GetSetting(Constants.DfloSettings.SkipSslVerification)),
        };

        private static HttpClientHandler GetClientHandler(bool disableSsl)
        {
            var handler = new HttpClientHandler();
            if (disableSsl)
            {
                handler.DisableSslVerification();
            }

            return handler;
        }

        private static bool AreSettingsValid(DfloSettings settings) => !(string.IsNullOrEmpty(settings.Endpoint) ||
                                                                         string.IsNullOrEmpty(settings.Account) ||
                                                                         string.IsNullOrEmpty(settings.Password));

        private static void PrepareRequestMessage(HttpRequestMessage request, string account, string password)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue(
                "Basic",
                Convert.ToBase64String(Encoding.ASCII.GetBytes($"{account}:{password}")));
        }

        private static string GetFilterQuery(string email) => new JArray(
            new JObject(new JProperty("field", "EmailAdd"), new JProperty("operator", "eq"), new JProperty("value", $"{email}")),
            new JObject(new JProperty("field", "DocType"), new JProperty("operator", "eq"), new JProperty("value", "HTML"))).ToString();

        private async Task<(string email, IEnumerable<Document> userEmails)> GetUserEmailsAsync(string email, DfloSettings settings, HttpClient client)
        {
            try
            {
                var requestFilter = GetFilterQuery(email);
                var requestUri = $"{settings.Endpoint}";
                var httpRequestMessage = new HttpRequestMessage(HttpMethod.Post, requestUri)
                {
                    Content = new StringContent(requestFilter, Encoding.UTF8, MediaType),
                };
                PrepareRequestMessage(httpRequestMessage, settings.Account, settings.Password);

                var httpResponse = await GetResponseAsyncFromProvidedClient(client, httpRequestMessage).ConfigureAwait(false);

                if (!httpResponse.IsSuccessStatusCode)
                {
                    Log.Info($"[Dflo] Response from dflo is not parseable. {httpResponse.StatusCode}. Error message: {await httpResponse.Content.ReadAsStringAsync().ConfigureAwait(false)}", this);
                    return (email, new List<Document>());
                }

                var response = await httpResponse.Content.ReadAsStringAsync().ConfigureAwait(false);
                var parsedResponse = (JsonConvert.DeserializeObject<IEnumerable<Document>>(response) ?? Array.Empty<Document>()).ToList();
                return (email, parsedResponse);
            }
            catch (Exception ex)
            {
                Log.Error($"[Dflo] Couldn't process/recieve response form Dflo.", ex, this);
                return (email, new List<Document>());
            }
        }
    }
}

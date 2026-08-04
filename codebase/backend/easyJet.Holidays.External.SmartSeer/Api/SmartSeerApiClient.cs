using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using easyJet.Holidays.External.SmartSeer.Models;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.SmartSeer.Api
{
    /// <summary>
    /// Sitecore http client to sendXML requests
    /// </summary>
    public class SmartSeerApiClient : JsonApiClient
    {

        public SmartSeerApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings) : base(client, envSettings) { }

        /// <summary>
        /// Validate SmartSeer response and throw specific error if something went wrong
        /// </summary>
        /// <param name="response"></param>
        public override Task ValidateResponse(HttpResponseMessage response, Stream content)
        {
            try
            {
                response.EnsureSuccessStatusCode();
            }
            catch (Exception ex)
            {
                throw new SmartSeerException(response.StatusCode, response.Content, ex);
            }

            return Task.CompletedTask;
        }
    }
}
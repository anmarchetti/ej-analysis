using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Domain.Api.Client
{
    /// <summary>
    /// Client to sendXML requests
    /// </summary>
    public class XmlApiClient : BaseApiClient
    {
        public override string MediaType => "text/xml";

        public XmlApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings) : base(client, envSettings)
        {
        }
    }
}
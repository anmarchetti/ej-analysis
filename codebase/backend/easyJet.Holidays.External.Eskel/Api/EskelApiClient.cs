using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Eskel.Api;
public class EskelApiClient : JsonApiClient
{
    public EskelApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings) : base(client, envSettings)
    {
    }
}


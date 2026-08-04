using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.TransferManagementPlatform.Api;

/// <summary>
/// Http client
/// </summary>
public class TransferManagementPlatformApiClient : JsonApiClient
{
    // ReSharper disable once NotAccessedField.Local
    private readonly TransferManagementPlatformSettings _platformSettings;

    /// <summary>
    /// Constructor
    /// </summary>
    /// <param name="client"></param>
    /// <param name="envSettings"></param>
    /// <param name="settings"></param>
    public TransferManagementPlatformApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings, IOptions<TransferManagementPlatformSettings> settings) : base(client, envSettings)
    {
        ArgumentNullException.ThrowIfNull(settings);
        _platformSettings = settings.Value;
    }

    /// <inheritdoc />
    public override Task PrepareRequestMessage(HttpRequestMessage request)
    {
        ArgumentNullException.ThrowIfNull(request);
        
        request.Headers.Add(Consts.ApiKeyHeaderKey, _platformSettings.SecretKey);
        return base.PrepareRequestMessage(request);
    }
}
using easyJet.Holidays.External.Domain.Api;

namespace easyJet.Holidays.External.TransferManagementPlatform.Api;

/// <summary>
/// 
/// </summary>
public class TransferManagementPlatformApiService : ApiService
{
    /// <summary>
    /// Constructor
    /// </summary>
    /// <param name="platformApiClient"></param>
    public TransferManagementPlatformApiService(TransferManagementPlatformApiClient platformApiClient) : base(
        platformApiClient)
    {
    }

    /// <inheritdoc />
    public override string Name() => "Transfer Management API service.";
}
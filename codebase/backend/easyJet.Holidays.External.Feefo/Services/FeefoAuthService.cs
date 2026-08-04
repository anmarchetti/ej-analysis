using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Feefo.Services;

/// <summary>
/// Auth for Feefo calls
/// </summary>
public class FeefoAuthService : BaseAuthService
{
    private readonly IOptions<FeefoApiSettings> _feefoApiSettings;

    /// <summary>
    /// 
    /// </summary>
    /// <param name="apiService"></param>
    /// <param name="repository"></param>
    /// <param name="logger"></param>
    /// <param name="feefoApiSettings"></param>
    public FeefoAuthService([FromKeyedServices(Constants.AuthServiceKey)] IApiService apiService, IAWSDbRepository<Token> repository,
        ILogger<BaseAuthService> logger, IOptions<FeefoApiSettings> feefoApiSettings) : base(apiService, repository, logger)
    {
        _feefoApiSettings = feefoApiSettings;
    }

    /// <inheritdoc />
    public override string AuthKey => "FeefoAPI";

    /// <inheritdoc />
    public override Uri Endpoint => new Uri(_feefoApiSettings.Value.EndPointAuthentication);

    /// <inheritdoc />
    public override string ClientId => _feefoApiSettings.Value.ClientId;

    /// <inheritdoc />
    public override string ClientSecret => _feefoApiSettings.Value.ClientSecret;

    /// <inheritdoc />
    public override string GrantType => "client_credentials";

    /// <inheritdoc />
    public override ExceptionCode AuthExceptionCode => ApiExceptionCodes.FeefoAuthError;
}
using Amazon.Lambda.Core;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.Search;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.AWS.Logging;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Services;

/// <summary>
/// 
/// </summary>
public class SearchServiceBuilder
{
    private readonly ISettingsService _settingsService;
    private readonly IOptions<AtcomSettings> _atcomSettings;
    private readonly IOptions<CacheSettings> _cacheSettings;
    private readonly IOptions<LanguageSettings> _languageSettings;
    private readonly IOptions<SearchSettings> _searchSettings;
    private readonly IOptions<SmartSeerSettings> _smartSeerSettings;
    private readonly Dictionary<string, SearchService> _searchServiceCache = new Dictionary<string, SearchService>();

    /// <summary>
    /// 
    /// </summary>
    /// <param name="settingsService"></param>
    /// <param name="atcomSettings"></param>
    /// <param name="cacheSettings"></param>
    /// <param name="envSettings"></param>
    /// <param name="languageSettings"></param>
    /// <param name="searchSettings"></param>
    /// <param name="smartSeerSettings"></param>
    public SearchServiceBuilder(
        ISettingsService settingsService,
        IOptions<AtcomSettings> atcomSettings,
        IOptions<CacheSettings> cacheSettings,
        IOptions<EnvironmentBehaviourSettings> envSettings,
        IOptions<LanguageSettings> languageSettings,
        IOptions<SearchSettings> searchSettings,
        IOptions<SmartSeerSettings> smartSeerSettings
        )
    {
        _settingsService = settingsService;
        _atcomSettings = atcomSettings;
        _cacheSettings = cacheSettings;
        _searchSettings = searchSettings;
        _languageSettings = languageSettings;
        _smartSeerSettings = smartSeerSettings;
    }

    /// <summary>
    /// 
    /// </summary>
    /// <param name="marketCode"></param>
    /// <param name="referenceDataService"></param>
    /// <param name="endpointsProvider"></param>
    /// <param name="apiService"></param>
    /// <param name="logger"></param>
    /// <returns></returns>
    public SearchService Build(
        string marketCode,
        IReferenceDataService referenceDataService,
        EndpointsProvider endpointsProvider,
        IApiService apiService,
        ILambdaLogger logger)
    {
        if (_searchServiceCache.Keys.Any(x => x == marketCode))
        {
            return _searchServiceCache[marketCode];
        }
        var languageService = new LanguageService(_languageSettings.Value.MarketMasterLanguageMap[marketCode]);

        var marketService = new MarketService(languageService, _settingsService, _languageSettings);

        var searchRequestMapper = new SearchRequestsMapper(_searchSettings, _smartSeerSettings, _atcomSettings);

        var boardService = new BoardService(_atcomSettings);

        var baseSearchOffersService = new SearchOffersService(
            boardService,
            apiService,
            endpointsProvider,
            searchRequestMapper,
            new NoCacheService(),
            _atcomSettings,
            _cacheSettings,
            _settingsService,
            null!,
            marketService,
            new LambaLogger<SearchOffersService>(logger),
            referenceDataService
        );
        var service = new SearchService(baseSearchOffersService);

        _searchServiceCache.Add(marketCode, service);
        return service;
    }
}
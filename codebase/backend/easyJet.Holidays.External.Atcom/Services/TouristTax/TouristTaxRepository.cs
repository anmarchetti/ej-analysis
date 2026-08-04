using CsvHelper;
using CsvHelper.Configuration;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.FileService;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;
using System.Globalization;

namespace easyJet.Holidays.External.Atcom.Services.TouristTax;

internal interface ITouristTaxRepository
{
    Task<IEnumerable<TouristTaxRule>> GetConfig(TouristTaxOffer offer);
    Task<IReadOnlyList<ExchangeRateRecord>> GetExchangeRates();
}

internal sealed class TouristTaxRepository : ITouristTaxRepository
{
    private readonly IS3FileService _s3FileService;
    private readonly ICacheService _cacheService;
    private readonly CacheSettings _cacheSettings;
    private readonly AwsSettings _awsSettings;
    private const string RulesFileName = "Tourist Tax Rules.csv";
    private const string TouristTaxRulesCacheKey = "TouristTaxRules";
    private const string ExchangeRatesFileName = "Exchange Rates.csv";
    private const string ExchangeRatesCacheKey = "ExchangeRates";
    private static readonly string[] DateFormats =
    [
        "dd/MM/yyyy", "dd/MM/yy", // Both with leading zeros
        "d/M/yyyy", "d/M/yy",     // Both without leading zeros
        "dd/M/yyyy", "dd/M/yy",   // Day with, month without leading zero
        "d/MM/yyyy", "d/MM/yy",   // Month with, day without leading zero
        "yyyy-MM-dd", "yyyy-M-d"  // ISO format with and without leading zeros
    ];
    static int dateFromColumn => 9;
    static int dateToColumn => 10;

    public TouristTaxRepository(IS3FileService s3FileService, 
        ICacheService cacheService,
        IOptions<CacheSettings> cacheSettings,
        IOptions<AwsSettings> awsSettings)
    {
        ArgumentNullException.ThrowIfNull(s3FileService);
        ArgumentNullException.ThrowIfNull(cacheService);
        ArgumentNullException.ThrowIfNull(cacheSettings);
        ArgumentNullException.ThrowIfNull(awsSettings);

        _s3FileService = s3FileService;
        _cacheService = cacheService;
        _cacheSettings = cacheSettings.Value;
        _awsSettings = awsSettings.Value;
    }

    public async Task<IEnumerable<TouristTaxRule>> GetConfig(TouristTaxOffer offer)
    {
        var rules = await LoadRules();

        var matched = rules.Where(r => MatchRule(offer.Geography, offer.TravelFromDate, offer.TravelToDate, r)).OrderBy(r => r.TravelToDate).ToList();

        if (matched.Count == 0 && offer.Geography.Length >= 4)
        {
            matched = [.. rules.Where(r => MatchRule(offer.Geography[..4], offer.TravelFromDate, offer.TravelToDate, r)).OrderBy(r => r.TravelToDate)];
        }

        if (matched.Count == 0 && offer.Geography.Length >= 2)
        {
            matched = [.. rules.Where(r => MatchRule(offer.Geography[..2], offer.TravelFromDate, offer.TravelToDate, r)).OrderBy(r => r.TravelToDate)];
        }

        if (matched.Count == 0)
        {
            matched = [.. rules.Where(r => r.Geography.Equals(offer.Geography, StringComparison.Ordinal)).OrderBy(r => r.TravelToDate)];
        }

        if (matched.Count == 0 && offer.Geography.Length >= 4)
        {
            matched = [.. rules.Where(r => r.Geography.Equals(offer.Geography[..4], StringComparison.Ordinal)).OrderBy(r => r.TravelToDate)];
        }

        if (matched.Count == 0 && offer.Geography.Length >= 2)
        {
            matched = [.. rules.Where(r => r.Geography.Equals(offer.Geography[..2], StringComparison.Ordinal)).OrderBy(r => r.TravelToDate)];
        }

        if (matched.Count == 0)
        {
            return [];
        }

        var matchedRule = matched.FirstOrDefault(r => offer.TravelFromDate >= r.TravelFromDate && offer.TravelToDate <= r.TravelToDate) ?? matched.FirstOrDefault(r => offer.TravelToDate <= r.TravelToDate);

        return matchedRule is not null ? [matchedRule] : [];
    }

    private static bool MatchRule(string geography, DateOnly travelFromDate, DateOnly travelToDate, TouristTaxRule r) =>
        r.Geography.Equals(geography, StringComparison.Ordinal) && r.TravelFromDate <= travelFromDate && r.TravelToDate >= travelToDate;

    private async Task<List<TouristTaxRule>> LoadRules()
    {
        return await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.TouristTaxRules,
            [TouristTaxRulesCacheKey],
            async () =>
            {
                var bytes = await _s3FileService.Download(_awsSettings.S3.Buckets.TouristTaxRules, RulesFileName);
                using var stream = new MemoryStream(bytes);
                using var reader = new StreamReader(stream);

                var config = new CsvConfiguration(CultureInfo.InvariantCulture)
                {
                    HasHeaderRecord = true,
                    TrimOptions = TrimOptions.Trim,
                    MissingFieldFound = null,
                    HeaderValidated = null,
                    DetectColumnCountChanges = false,
                    PrepareHeaderForMatch = args => args.Header?.Trim(),
                    ShouldSkipRecord = record =>
                        SkipRow(record)
                };

                using var csv = new CsvReader(reader, config);
                // Support both 4-digit and 2-digit year date formats for DateOnly
                // Also support single-digit day/month (no leading zero)
                csv.Context.TypeConverterOptionsCache.AddOptions<DateOnly>(new CsvHelper.TypeConversion.TypeConverterOptions
                {
                    Formats = DateFormats,
                    CultureInfo = CultureInfo.GetCultureInfo("en-GB")
                });
                csv.Context.RegisterClassMap<TouristTaxRuleMap>();
                var rules = new List<TouristTaxRule>();
                await foreach (var rule in csv.GetRecordsAsync<TouristTaxRule>())
                {
                    rules.Add(rule);
                }
                return rules;
            },
            false);
        
    }

    public async Task<IReadOnlyList<ExchangeRateRecord>> GetExchangeRates()
    {
        return await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.ExchangeRates,
            [ExchangeRatesCacheKey],
            async () =>
            {
                var bytes = await _s3FileService.Download(_awsSettings.S3.Buckets.TouristTaxRules, ExchangeRatesFileName);
                using var stream = new MemoryStream(bytes);
                using var reader = new StreamReader(stream);

                var config = new CsvConfiguration(CultureInfo.InvariantCulture)
                {
                    HasHeaderRecord = true,
                    TrimOptions = TrimOptions.Trim,
                    MissingFieldFound = null,
                    HeaderValidated = null,
                    DetectColumnCountChanges = false,
                    PrepareHeaderForMatch = args => args.Header?.Trim(),
                };

                using var csv = new CsvReader(reader, config);
                csv.Context.RegisterClassMap<ExchangeRateMap>();
                var rates = new List<ExchangeRateRecord>();
                await foreach (var rate in csv.GetRecordsAsync<ExchangeRateRecord>())
                {
                    rates.Add(rate);
                }
                return rates;
            },
            false);
    }

    private static bool SkipRow(ShouldSkipRecordArgs record)
    {
        if (record.Row.Context.Parser.Row == 1)
        {
            return false; // Don't skip header (though CsvHelper won't call this for headers)
        }

        var invalid = record.Row?.Parser?.Record?.All(r => string.IsNullOrWhiteSpace(r) || string.IsNullOrEmpty(r)) == true;

        if (invalid)
        {
            return invalid;
        }

        var culture = CultureInfo.GetCultureInfo("en-GB");
        var from = DateOnly.TryParseExact(record.Row?.Parser?.Record?[dateFromColumn], DateFormats, culture, DateTimeStyles.None, out DateOnly fromDate);
        var to = DateOnly.TryParseExact(record.Row?.Parser?.Record?[dateToColumn], DateFormats, culture, DateTimeStyles.None, out DateOnly toDate);
        
        if (!from || !to)
        {
            return true;
        }

        if(fromDate > toDate)
        {
            return true;
        }

        return false;
    }
}

using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Interfaces;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Settings;
using easyJet.Holidays.External.Domain.Utils;
using Force.DeepCloner;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Oracle.ManagedDataAccess.Client;


namespace easyJet.Holidays.External.AWS.ErrataInfoSync.Services;

/// <inheritdoc cref="IImportErrataService"/>/>
public class ImportErrataService : BaseErrataService, IImportErrataService
{
    private readonly IReferenceDataProvider _referenceDataService;
    private readonly AtcomDbSettings _atcomDbSettings;

    private const string SqlQuery = "SELECT usr.cd AS attribute_cd, usr.NAME AS attribute_name, an.eff_dt,pt.pt_cd, pt.NAME,stc.cd AS accom_cd, stc.NAME AS accom_name, an.att_note_text, an.bk_from_dt, an.bk_to_dt,an.st_dt AS dep_from_dt, an.end_dt AS dep_to_dt, ll.lang_cd, nt.text AS text FROM ar_attributenote an INNER JOIN ar_note nt ON an.att_note_id = nt.att_note_id LEFT JOIN ar_linkattribute la ON an.link_att_id = la.link_att_id LEFT JOIN ar_usercodes usr ON la.att_cd_id = usr.user_cd_id LEFT JOIN ar_point pt ON la.link_id = pt.pt_id LEFT JOIN ar_staticstock stc ON la.link_id = stc.stc_stk_id LEFT JOIN ar_languagelocale ll ON nt.lang_locale_id = ll.lang_locale_id";

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="referenceDataService"></param>
    /// <param name="destinationsService"></param>
    /// <param name="errataInfoService"></param>
    /// <param name="logger"></param>
    /// <param name="atcomDbOptions"></param>
    public ImportErrataService(
        IReferenceDataProvider referenceDataService,
        IDestinationsService destinationsService,
        IErrataInfoService errataInfoService,
        ILogger<ImportErrataService> logger,
        IOptions<AtcomDbSettings> atcomDbOptions) : base(
        destinationsService,
        errataInfoService,
        logger)
    {
        _referenceDataService = referenceDataService;

        ArgumentNullException.ThrowIfNull(atcomDbOptions);
        _atcomDbSettings = atcomDbOptions.Value;
    }

    /// <inheritdoc />
    public async Task<List<HotelErrataModel>> GetErrataInfo()
    {
        if (string.IsNullOrEmpty(_atcomDbSettings.ConnectionString))
        {
            Logger.LogCritical("Connection string is empty");

            return null;
        }

        var errataInfoFromAtcom = new List<AtcomErrataModel>();
        await using (OracleConnection con = new OracleConnection(_atcomDbSettings.ConnectionString))
        {
            await using (OracleCommand cmd = new OracleCommand())
            {
                try
                {
                    con.Open();
                    cmd.BindByName = true;
                    cmd.Connection = con;
                    cmd.CommandText = SqlQuery;

                    Logger.LogInformation("Connection to database is opened");

                    // we rely on the concrete oracle type, therefore using the async methods of the generic base class is not an option
#pragma  warning disable S6966
#pragma  warning disable CA1849
                    await using (var reader = cmd.ExecuteReader())
                    {
#pragma warning restore S6966
#pragma warning restore CA1849
                        while (reader.Read())
                        {
                            try
                            {
                                var accomCode = GetDatabaseValueAsString(reader, 5);
                                var geoCode = GetDatabaseValueAsString(reader, 3);

                                //skip entities with empty geoCode or accomCode
                                if (string.IsNullOrWhiteSpace(accomCode) && string.IsNullOrWhiteSpace(geoCode))
                                {
                                    Logger.LogWarning("Can't handle following errata from Atcom database (accomCode and geoCode are null or empty, row will be skipped):");
                                    LogAtcomErrata(reader);
                                    continue;
                                }

                                var type = string.IsNullOrEmpty(accomCode) ? ErrataTypes.Geography : ErrataTypes.Accommodation;

                                var errataModel = BuildModel(type, accomCode, geoCode, reader);

                                var languageCode = reader.IsDBNull(12) ? Language.EnglishCode : reader.GetString(12).ToLower();
                                foreach (var language in ErrataInfoService.MapLanguageCode(languageCode))
                                {
                                    var model = errataModel.DeepClone();
                                    model.LanguageCode = language;
                                    errataInfoFromAtcom.Add(model);

                                    Logger.LogInformation("Errata: {Model}", JsonConvert.SerializeObject(model));
                                }
                            }
                            catch (Exception ex)
                            {
                                Logger.LogInformation("Can't handle following errata from Atcom database:");

                                LogAtcomErrata(reader);

                                Logger.LogError(ex, "Failed to handle errata");
                            }
                        }
                    }

                    Logger.LogInformation("Connection to database is closed");
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, "Error while trying to get Errata from DB");

                    //if we throw exception, devops guys will receive email with error and can find out the reason
                    throw new InvalidOperationException("Failed to get data from Atcom", ex);
                }
            }
        }

        if (!errataInfoFromAtcom.Any())
        {
            Logger.LogError("Can't get any errata from Atcom database");

            //if we throw exception, devops guys will receive email with error and can find out the reason
            throw new InvalidOperationException("Can't get any errata from Atcom database. Please check!!!");
        }

        Logger.LogInformation("Parsing geography errata");
        errataInfoFromAtcom = await ConvertGeographyToAirportCodes(errataInfoFromAtcom);

        List<HotelErrataModel> result = errataInfoFromAtcom.GroupBy(e => e.Code,
                e => new ErrataInfoModel()
                {
                    Errata = e.Errata,
                    ErrataCode = e.ErrataCode,
                    EffectiveDate = e.EffectiveDate,
                    BookStartDate = e.BookStartDate,
                    BookEndDate = e.BookEndDate,
                    DepartureStartDate = e.DepartureStartDate,
                    DepartureEndDate = e.DepartureEndDate,
                    LanguageCode = e.LanguageCode,
                },
                (key, g) => new HotelErrataModel
                {
                    HotelCode = key,
                    ErratasInfo = g.ToList()
                })
            .ToList();

        Logger.LogInformation("Get {Count} items from Accom db", result.Count);

        return result;
    }

    private static AtcomErrataModel BuildModel(ErrataTypes type, string accomCode, string geoCode, OracleDataReader reader)
    {
        return new()
        {
            ErrataCode = type,
            Code = string.IsNullOrEmpty(accomCode) ? geoCode : accomCode,
            EffectiveDate = reader.IsDBNull(2) ? DateTime.MinValue : reader.GetDateTime(2),
            BookStartDate = reader.IsDBNull(8) ? DateTime.MinValue : reader.GetDateTime(8),
            BookEndDate = reader.IsDBNull(9) ? DateTime.MinValue : reader.GetDateTime(9),
            DepartureStartDate = reader.IsDBNull(10) ? DateTime.MinValue : reader.GetDateTime(10),
            DepartureEndDate = reader.IsDBNull(11) ? DateTime.MaxValue : reader.GetDateTime(11),
            Errata = reader.IsDBNull(13) ? string.Empty : HtmlUtils.RemoveStylesAndScripts(reader.GetString(13)),
        };
    }

    /// <summary>
    /// method takes geography errata and convert geography codes to airport codes to normalize data
    /// </summary>
    /// <param name="atcomErrata"></param>
    /// <returns></returns>
    internal async Task<List<AtcomErrataModel>> ConvertGeographyToAirportCodes(List<AtcomErrataModel> atcomErrata)
    {
        var allDestinations = await _referenceDataService.GetAllDestinations(false, "en");
        var airportsForDestinations = new Dictionary<string, List<string>>();
        // In destinations, we have countries and airports for them only (just top level!)
        GroupDestinationsByCode(allDestinations, airportsForDestinations);

        // We want to process only Geographic errata
        var geoAtcomErrata = atcomErrata.Where(x => x.ErrataCode == ErrataTypes.Geography).ToList();

        // GeoCodes from DB can be country/location/report/airports            
        // That's why we want to request airports for them separately (process other levels)
        var geoCodes = geoAtcomErrata.Select(x => x.Code);
        var geoCodesToFindAirportFor = geoCodes.Except(airportsForDestinations.Keys).ToList();
        var destinations = await DestinationsService.GetDestinationsByCodes(geoCodesToFindAirportFor.ToArray());
        GroupDestinationsByCode(destinations.ToList(), airportsForDestinations);

        var extraErrataToAdd = new List<AtcomErrataModel>();
        foreach (var item in geoAtcomErrata)
        {
            if (airportsForDestinations.TryGetValue(item.Code, out var airportsForGeo))
            {
                // if didn't find anything, assume it was airport code (it won't be returned from GetDestinationsByCodes method)
                if (airportsForGeo.Any())
                {
                    item.Code = airportsForGeo.First();

                    extraErrataToAdd.AddRange(airportsForGeo.Skip(1).Select(arr =>
                    {
                        var clone = item.DeepClone();
                        clone.Code = arr;
                        return clone;
                    }));
                }
            }
        }

        atcomErrata.AddRange(extraErrataToAdd);
        return atcomErrata;
    }


    /// <summary>
    /// We want to group destinations to get airports
    /// </summary>
    /// <param name="destinations"></param>
    /// <param name="grouped"></param>
    private static void GroupDestinationsByCode(List<DestinationItem> destinations, Dictionary<string, List<string>> grouped)
    {
        // In destinations, we have countries and airports for them. Children can be ignored
        foreach (var dest in destinations)
        {
            var airports = dest.AirportCodes?.ToList() ?? [];
            grouped[dest.Code] = airports;

            foreach (var airport in airports)
            {
                grouped[airport] = [airport];
            }
        }
    }
}
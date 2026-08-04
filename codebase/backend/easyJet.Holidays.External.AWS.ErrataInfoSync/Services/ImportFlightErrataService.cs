using easyJet.Holidays.Api.Domain.Data.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Interfaces;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Settings;
using easyJet.Holidays.External.Domain.Utils;
using Force.DeepCloner;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Data;
using Type = easyJet.Holidays.Api.Domain.Data.ErrataInfo.Type;


namespace easyJet.Holidays.External.AWS.ErrataInfoSync.Services;

/// <inheritdoc cref="IImportFlightErrataService"/>/>
public class ImportFlightErrataService : BaseErrataService, IImportFlightErrataService
{
    private readonly IAtcomErrataOracleService _atcomFlightErrataOracleService;
    private readonly LambdaSettings _lambdaSettings;

    /// <summary>
    /// standard ctor
    /// </summary>
    public ImportFlightErrataService(
        IDestinationsService destinationsService,
        IErrataInfoService errataInfoService,
        IAtcomErrataOracleService atcomFlightErrataOracleService, 
        ILogger<ImportFlightErrataService> logger,
        IOptions<LambdaSettings> lambdaOptions) : base(
        destinationsService,
        errataInfoService,
        logger)
    {
        _atcomFlightErrataOracleService = atcomFlightErrataOracleService;

        ArgumentNullException.ThrowIfNull(lambdaOptions);
        _lambdaSettings = lambdaOptions.Value;
    }


    /// <inheritdoc />
    public async Task<List<FlightErrataModel>> GetFlightErrataInfo()
    {
        var atcomFlightErrataInfoModels = GetDataFromOracle();
        var result = await EnrichFlightErrataData(atcomFlightErrataInfoModels);

        return result;
    }

    private async Task<List<FlightErrataModel>> EnrichFlightErrataData(List<AtcomFlightErrataInfoModel> atcomFlightErrataInfoModels)
    {
        if (!atcomFlightErrataInfoModels.Any())
        {
            Logger.LogInformation("Can't get any errata from Atcom database");

            if (_lambdaSettings.FailOnEmptyErrata)
            {
                //if we throw exception, devops guys will receive email with error and can find out the reason
                throw new InvalidOperationException("Can't get any errata from Atcom database. Please check!!!");
            }

            return [];
        }

        Logger.LogInformation("Parsing geography errata");
        atcomFlightErrataInfoModels = await EnrichFlightErrataWithGeographyToAirportCodes(atcomFlightErrataInfoModels);

        List<FlightErrataModel> result = atcomFlightErrataInfoModels.Where(e => !string.IsNullOrWhiteSpace(e.Text))
            .GroupBy(e => e.Code,
                e => new FlightErrataInfoModel()
                {
                    Text = e.Text,
                    LanguageCode = e.LanguageCode,
                    EffectiveDate = e.EffectiveDate,
                    BookStartDate = e.BookStartDate,
                    BookEndDate = e.BookEndDate,
                    DepartureStartDate = e.DepartureStartDate,
                    DepartureEndDate = e.DepartureEndDate,
                    DepartDays = e.DepartDays,
                    InventoryType = e.InventoryType,
                    StartDate = e.StartDate,
                    EndDate = e.EndDate,
                }, (key, g) => new FlightErrataModel { Code = key, FlightErrataInfoModels = g.ToList() })
            .ToList();

        Logger.LogInformation("Get {Count} items from Accom db", result.Count);
        try
        {
            Logger.LogInformation("Result: {Result}", JsonConvert.SerializeObject(result));
        }
        catch (Exception)
        {
            // ignored
        }

        return result;
    }

    private List<AtcomFlightErrataInfoModel> GetDataFromOracle()
    {
        List<AtcomFlightErrataInfoModel> returnData = [];
        var dataTable = _atcomFlightErrataOracleService.GetAtcomDataTable();

        if (dataTable.Rows.Count == 0)
        {
            Logger.LogInformation("No rows in DataTable");
        }

        foreach (DataRow dataRow in dataTable.Rows)
        {
            try
            {
                #region Unused Fields
                //unused Fields
                //var attributeCd       = GetDatabaseValueAsString(dataRow,     0);
                //var attributeName     = GetDatabaseValueAsString(dataRow,     1);
                //var transErrataId     = GetDatabaseValueAsDecimal(dataRow,    2);
                //var departurePointName= GetDatabaseValueAsString(dataRow,     5);
                //var arrivalPointName  = GetDatabaseValueAsString(dataRow,     8);
                //var attNoteText       = GetDatabaseValueAsString(dataRow,     10);
                //var dirMth            = GetDatabaseValueAsString(dataRow,     29);
                //var transCode         = GetDatabaseValueAsString(dataRow,     30);
                #endregion

                var effectiveDate = GetDatabaseValueAsDatetime(dataRow, 3);
                var departurePoint = GetDatabaseValueAsString(dataRow, 4);
                var departurePointType = GetDatabaseValueAsString(dataRow, 6);
                var arrivalPoint = GetDatabaseValueAsString(dataRow, 7);
                var arrivalPointType = GetDatabaseValueAsString(dataRow, 9);
                var startDate = GetDatabaseValueAsDatetime(dataRow, 11);
                var endDate = GetDatabaseValueAsDatetime(dataRow, 12);
                var languageCode = GetDatabaseValueAsString(dataRow, 13);
                var text = GetDatabaseValueAsString(dataRow, 14);
                var flightNumber = GetDatabaseValueAsString(dataRow, 15);
                var departureFromDate = GetDatabaseValueAsDatetime(dataRow, 16);
                var departureToDate = GetDatabaseValueAsDatetime(dataRow, 17);
                var bookingFromDate = GetDatabaseValueAsDatetime(dataRow, 18);
                var bookingToDate = GetDatabaseValueAsDatetime(dataRow, 19);
                var carrierCode = GetDatabaseValueAsString(dataRow, 20);
                var inventoryType = GetDatabaseValueAsString(dataRow, 21);

                LogDataRow(dataRow);

                var atcomFlightErrataInfoModel = new AtcomFlightErrataInfoModel()
                {
                    EffectiveDate = effectiveDate,
                    BookStartDate = bookingFromDate,
                    BookEndDate = bookingToDate,
                    DepartureStartDate = departureFromDate,
                    DepartureEndDate = departureToDate,
                    Text = HtmlUtils.RemoveStylesAndScripts(text),
                    DepartDays = GetDepartDays(dataRow),
                    ArrivalPoint = arrivalPoint,
                    DeparturePoint = departurePoint,
                    ArrivalPointType = GetPointType(arrivalPointType),
                    DeparturePointType = GetPointType(departurePointType),
                    Code = !string.IsNullOrEmpty(flightNumber) ? carrierCode + flightNumber : null,
                    InventoryType = GetInventoryType(inventoryType),
                    StartDate = startDate,
                    EndDate = endDate
                };

                foreach (var language in ErrataInfoService.MapLanguageCode(languageCode))
                {
                    var model = atcomFlightErrataInfoModel.DeepClone();
                    model.LanguageCode = language;
                    returnData.Add(model);
                }
            }
            catch (Exception ex)
            {
                Logger.LogInformation("Can't handle following errata from Atcom database:");
                LogDataRow(dataRow);
                Logger.LogError(ex, "failed parsing of row");
            }
        }

        return returnData;
    }

    private InventoryType GetInventoryType(string inventoryType)
    {
        if (inventoryType.Equals("in", StringComparison.InvariantCultureIgnoreCase))
            return InventoryType.Internal;

        if (inventoryType.Equals("ex", StringComparison.InvariantCultureIgnoreCase))
            return InventoryType.External;

        return InventoryType.AllInventory;
    }

    private Type GetPointType(string arrivalPointType)
    {
        if (string.IsNullOrEmpty(arrivalPointType))
            return Type.None;

        if (arrivalPointType.ToUpper() == "AREA")
            return Type.Area;

        if (arrivalPointType.ToUpper() == "CTY1")
            return Type.Country;

        if (arrivalPointType.ToUpper() == "AIR")
            return Type.Airport;

        return Type.None;
    }

    internal async Task<List<AtcomFlightErrataInfoModel>> EnrichFlightErrataWithGeographyToAirportCodes(List<AtcomFlightErrataInfoModel> flightErrataInfoModelList)
    {
        var allDestinationCodes = flightErrataInfoModelList
            .Where(i => i.ArrivalPointType == Type.Area || i.ArrivalPointType == Type.Country ||
                        i.DeparturePointType == Type.Area || i.DeparturePointType == Type.Country)
            .Select(i => new List<string> { i.ArrivalPoint, i.DeparturePoint }).SelectMany(i => i).Distinct();

        var destinations = await DestinationsService.GetDestinationsByCodes(allDestinationCodes.ToArray());
        var codeAirportMapping = destinations.GroupBy(i => i.Code, i => i.AirportCodes)
            .ToDictionary(i => i.Key, i => i.SelectMany(b => b));

        var returnList = new List<AtcomFlightErrataInfoModel>();

        foreach (var atcomFlightErrataInfoModel in flightErrataInfoModelList)
        {
            //when they have a flight number 
            if (!string.IsNullOrEmpty(atcomFlightErrataInfoModel.Code))
            {
                var newAtcomFlightErrataInfoModel = new AtcomFlightErrataInfoModel();
                atcomFlightErrataInfoModel.Copy(newAtcomFlightErrataInfoModel);
                returnList.Add(newAtcomFlightErrataInfoModel);
                LogObject("Errata with flight number", newAtcomFlightErrataInfoModel);
                continue;
            }

            if (IsErrataFromAirportToAirport(atcomFlightErrataInfoModel))
            {
                var newAtcomFlightErrataInfoModel = new AtcomFlightErrataInfoModel();
                atcomFlightErrataInfoModel.Copy(newAtcomFlightErrataInfoModel);
                newAtcomFlightErrataInfoModel.Code = ErrataInfoService.GenerateFlightErrataCode(newAtcomFlightErrataInfoModel.DeparturePoint, newAtcomFlightErrataInfoModel.ArrivalPoint);
                returnList.Add(newAtcomFlightErrataInfoModel);
                LogObject("Errata with airport to airport", newAtcomFlightErrataInfoModel);
                continue;
            }

            if (atcomFlightErrataInfoModel.ArrivalPointType != Type.Area &&
                atcomFlightErrataInfoModel.ArrivalPointType != Type.Country &&
                atcomFlightErrataInfoModel.DeparturePointType != Type.Area &&
                atcomFlightErrataInfoModel.DeparturePointType != Type.Country)
            {
                LogObject("PointType is not area or country", atcomFlightErrataInfoModel);
                continue;
            }

            var lists = new List<List<string>>
            {
                !string.IsNullOrEmpty(atcomFlightErrataInfoModel.DeparturePoint) && codeAirportMapping.ContainsKey(atcomFlightErrataInfoModel.DeparturePoint) ? codeAirportMapping[atcomFlightErrataInfoModel.DeparturePoint].ToList() : new List<string>() { atcomFlightErrataInfoModel.DeparturePoint },
                !string.IsNullOrEmpty(atcomFlightErrataInfoModel.ArrivalPoint) && codeAirportMapping.ContainsKey(atcomFlightErrataInfoModel.ArrivalPoint) ? codeAirportMapping[atcomFlightErrataInfoModel.ArrivalPoint].ToList() : new List<string>() {atcomFlightErrataInfoModel.ArrivalPoint}
            };

            var allCombinations = GetAllPossibleCombinations(lists);

            foreach (var allCombination in allCombinations)
            {
                var combinations = allCombination.ToList();

                var newAtcomFlightErrataInfoModel = new AtcomFlightErrataInfoModel();
                atcomFlightErrataInfoModel.Copy(newAtcomFlightErrataInfoModel);
                newAtcomFlightErrataInfoModel.DeparturePoint = combinations[0];
                newAtcomFlightErrataInfoModel.ArrivalPoint = combinations[1];
                newAtcomFlightErrataInfoModel.Code = ErrataInfoService.GenerateFlightErrataCode(newAtcomFlightErrataInfoModel.DeparturePoint, newAtcomFlightErrataInfoModel.ArrivalPoint);

                returnList.Add(newAtcomFlightErrataInfoModel);
            }
        }

        return returnList;
    }

    private void LogObject(string text, object model)
    {
        try
        {
            Logger.LogInformation("{Text} model: {Value}", text, JsonConvert.SerializeObject(model));
        }
        catch (Exception)
        {
            // ignored
        }
    }

    private static bool IsErrataFromAirportToAirport(AtcomFlightErrataInfoModel atcomFlightErrataInfoModel)
    {
        return atcomFlightErrataInfoModel.ArrivalPointType == Type.Airport &&
               atcomFlightErrataInfoModel.DeparturePointType == Type.Airport;
    }

    private static IEnumerable<IEnumerable<T>> GetAllPossibleCombinations<T>(IEnumerable<IEnumerable<T>> sequences)
    {
        IEnumerable<IEnumerable<T>> combinations = new[] { Enumerable.Empty<T>() };
        return sequences.Aggregate(
            combinations,
            (accumulator, sequence) =>
                from accseq in accumulator
                from item in sequence
                select accseq.Concat(new[] { item }));
    }

    private static string DepartDayTrueValue = "Y";
    private DepartDays GetDepartDays(DataRow dataRow)
    {
        var monday = GetDatabaseValueAsString(dataRow, 22);
        var tuesday = GetDatabaseValueAsString(dataRow, 23);
        var wednesday = GetDatabaseValueAsString(dataRow, 24);
        var thursday = GetDatabaseValueAsString(dataRow, 25);
        var friday = GetDatabaseValueAsString(dataRow, 26);
        var saturday = GetDatabaseValueAsString(dataRow, 27);
        var sunday = GetDatabaseValueAsString(dataRow, 28);

        var returnValue = (DepartDays)0;
        if (monday == DepartDayTrueValue)
            returnValue |= DepartDays.Monday;

        if (tuesday == DepartDayTrueValue)
            returnValue |= DepartDays.Tuestday;

        if (wednesday == DepartDayTrueValue)
            returnValue |= DepartDays.Wednesday;

        if (thursday == DepartDayTrueValue)
            returnValue |= DepartDays.Thursday;

        if (friday == DepartDayTrueValue)
            returnValue |= DepartDays.Friday;

        if (saturday == DepartDayTrueValue)
            returnValue |= DepartDays.Saturday;

        if (sunday == DepartDayTrueValue)
            returnValue |= DepartDays.Sunday;

        return returnValue;
    }
}
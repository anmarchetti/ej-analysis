using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Oracle.ManagedDataAccess.Client;
using System.Data;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.ErrataInfoSync.Services;

/// <summary>
/// encapsulates common functionality for errata processing
/// </summary>
public class BaseErrataService
{
    private protected readonly IDestinationsService DestinationsService;
    private protected readonly IErrataInfoService ErrataInfoService;
    private protected readonly ILogger<BaseErrataService> Logger;

    /// <summary>
    /// base ctor
    /// </summary>
    /// <param name="logger"></param>
    /// <param name="destinationsService"></param>
    /// <param name="errataInfoService"></param>
    public BaseErrataService(IDestinationsService destinationsService, IErrataInfoService errataInfoService, ILogger<BaseErrataService> logger)
    {
        DestinationsService = destinationsService;
        ErrataInfoService = errataInfoService;
        Logger = logger;
    }

    /// <summary>
    /// Log DataRow
    /// </summary>
    /// <param name="dataRow"></param>
    internal void LogDataRow(DataRow dataRow)
    {
        try
        {
            var rowData = dataRow.ItemArray.Select((x, i) => new { Item = x, Index = i })
                .ToDictionary(i => dataRow.Table.Columns[i.Index], i => i.Item);
            var serializedDataRow = JsonConvert.SerializeObject(rowData);
            Logger.LogInformation("DataRow: {Row}", serializedDataRow);
        }
        catch (Exception)
        {
            // ignored
        }
    }

    /// <summary>
    /// Log errata values from Atcom database
    /// </summary>
    /// <param name="reader"></param>
    internal void LogAtcomErrata(OracleDataReader reader)
    {
        var rowValues = new object[reader.FieldCount];

        reader.GetValues(rowValues);

        for (var keyValueCounter = 0; keyValueCounter < rowValues.Length; keyValueCounter++)
        {
            var rawValue = rowValues[keyValueCounter] is DBNull
                ? string.Empty
                : rowValues[keyValueCounter];

            Logger.LogInformation("{Counter}: {Name}:{Value}", keyValueCounter, reader.GetName(keyValueCounter), rawValue);
        }
    }

    internal static string GetDatabaseValueAsString(DataRow dataRow, int ordinal)
    {
        return dataRow.Field<object>(ordinal) == null ? null : dataRow.Field<string>(ordinal);
    }

    internal static DateTime GetDatabaseValueAsDatetime(DataRow dataRow, int ordinal)
    {
        var value = dataRow.Field<object>(ordinal);
        if (value == null)
            return DateTime.MinValue;

        if (value is string)
        // Adding e.g. invariant culture breaks this, as atcom uses a distinct format.
#pragma warning disable CA1305
#pragma warning disable S6580
            return DateTime.Parse(dataRow.Field<string>(ordinal) ?? string.Empty);
#pragma warning restore CA1305
#pragma warning restore S6580
        return dataRow.Field<DateTime>(ordinal);
    }

    internal static string GetDatabaseValueAsString(OracleDataReader reader, int ordinal)
    {
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }
}
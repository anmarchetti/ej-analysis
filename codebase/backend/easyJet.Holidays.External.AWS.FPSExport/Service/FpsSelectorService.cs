using easyJet.Holidays.Api.Domain.Data.FlightPriceStore;
using easyJet.Holidays.External.AWS.FPSExport.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.FPSExport.Service;

/// <inheritdoc cref="IFpsSelectorService"/>
public class FpsSelectorService : IFpsSelectorService
{
    private readonly LambdaSettings _settings;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="options"></param>
    /// <exception cref="ArgumentException"></exception>
    public FpsSelectorService(IOptions<LambdaSettings> options)
    {
        ArgumentNullException.ThrowIfNull(options);
        _settings = options.Value;
    }

    /// <inheritdoc />
    public IList<FlightPriceStoreModel> SelectFare(IList<FlightPriceStoreModel> records)
    {
        var result = !_settings.NewFareClassPhaseOneEnabled
            ? LegacySelector(records)
            : PhaseOneSelector(records);

        // https://easyjet.atlassian.net/browse/EUXE-346
        if (_settings is { IgnoreDepartureDateTo: not null, IgnoreDepartureAirports: not [] })
        {
            result = result.Where(x =>
               x.LocalDepartureDateTime > _settings.IgnoreDepartureDateTo ||
               !_settings.IgnoreDepartureAirports.Contains(x.Departure, StringComparison.Ordinal));
        }

        return result.ToList();
    }

    private static IEnumerable<FlightPriceStoreModel> LegacySelector(IList<FlightPriceStoreModel> records)
    {
        return records.Where(record => record.GetKnownFareType() == FareType.Standard);
    }

    private IEnumerable<FlightPriceStoreModel> PhaseOneSelector(IList<FlightPriceStoreModel> records)
    {
        // FlightKey is unique, making each group contain all fare types in all currencies
        var groups = records.GroupBy(record => record.FlightKey);

        var result = new List<FlightPriceStoreModel>();

        foreach (var group in groups)
        {
            var groupMembers = group.ToList();

            // determine if we have discounted fares with sufficient availability
            var shouldSendDiscounted = groupMembers.Find(
                item =>
                    item.GetKnownFareType() == FareType.HolidaysDiscounted &&
                    item.AvailableInventory >= _settings.MinimumDiscountedAvailabilityThreshold
            ) != null;

            var fareTypeToSend = shouldSendDiscounted
                ? FareType.HolidaysDiscounted
                : FareType.Standard;

            result.AddRange(groupMembers.Where(record => record.GetKnownFareType() == fareTypeToSend));
        }

        return result;
    }
}
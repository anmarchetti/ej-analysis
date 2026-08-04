using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.External.AWS.DistressedTaxFile.Models;

namespace easyJet.Holidays.External.AWS.DistressedTaxFile.Mappers;

/// <summary>
/// DistressedFileMapper class
/// </summary>
public static class DistressedFileMapper
{
    /// <summary>
    /// Mapping input object to output with validation
    /// </summary>
    /// <param name="input">DistressedInputDataRow collection</param>
    /// <returns>IEnumerable of DistressedOutputDataRow</returns>
    public static IEnumerable<DistressedOutputDataRow> Map(IEnumerable<DistressedInputDataRow> input)
    {
        ArgumentNullException.ThrowIfNull(input);
        return MapRows(input);
    }

    /// <summary>
    /// Iterate through input and map each row
    /// </summary>
    /// <param name="input">DistressedInputDataRow collection</param>
    /// <returns>IEnumerable of DistressedOutputDataRow</returns>
    private static IEnumerable<DistressedOutputDataRow> MapRows(IEnumerable<DistressedInputDataRow> input)
    {
        foreach (var row in input)
        {
            yield return MapRow(row, Currency.GBP.Code, row.DiscountedFare_GBP);
            yield return MapRow(row, Currency.CHF.Code, row.DiscountedFare_CHF);
            yield return MapRow(row, Currency.EUR.Code, row.DiscountedFare_EUR);
        }
    }


    private static DistressedOutputDataRow MapRow(DistressedInputDataRow inputRow, string currency, string fare)
    {
        return new DistressedOutputDataRow
        {
            FlightKey = inputRow.Segment,
            DepartureAirport = inputRow.DepartureAirport,
            ArrivalAirport = inputRow.ArrivalAirport,
            FlightNumber = inputRow.FlightNumber,
            DepartureDate = inputRow.DepartureDate,
            DepartureTime = inputRow.DepartureTime,
            ArrivalDate = inputRow.ArrivalDate,
            ArrivalTime = inputRow.ArrivalTime,
            NumberOfDistressedSeats = inputRow.DiscountedSeats,
            Currency = currency,
            DistressedAdultFare = fare
        };
    }
}
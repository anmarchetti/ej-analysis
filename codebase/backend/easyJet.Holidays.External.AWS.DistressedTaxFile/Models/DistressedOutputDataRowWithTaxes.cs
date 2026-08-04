namespace easyJet.Holidays.External.AWS.DistressedTaxFile.Models;

/// <summary>
/// DistressedOutputDataRowWithTaxes class
/// </summary>
public class DistressedOutputDataRowWithTaxes
{
    /// <summary>
    /// DistressedOutputDataRowWithTaxes base constructor
    /// </summary>
    public DistressedOutputDataRowWithTaxes()
    {
    }

    /// <summary>
    /// DistressedOutputDataRowWithTaxes
    /// </summary>
    /// <param name="distressedOutputDataRow"></param>
    public DistressedOutputDataRowWithTaxes(DistressedOutputDataRow distressedOutputDataRow)
    {
        if (distressedOutputDataRow == null)
        {
            throw new ArgumentNullException(nameof(distressedOutputDataRow), "The distressedOutputDataRow parameter cannot be null.");
        }
        FlightKey = distressedOutputDataRow.FlightKey;
        FlightNumber = distressedOutputDataRow.FlightNumber;
        DepartureAirport = distressedOutputDataRow.DepartureAirport;
        ArrivalAirport = distressedOutputDataRow.ArrivalAirport;
        DepartureDate = distressedOutputDataRow.DepartureDate;
        DepartureTime = distressedOutputDataRow.DepartureTime;
        ArrivalDate = distressedOutputDataRow.ArrivalDate;
        ArrivalTime = distressedOutputDataRow.ArrivalTime;
        NumberOfDistressedSeats = distressedOutputDataRow.NumberOfDistressedSeats;
        Currency = distressedOutputDataRow.Currency;
        DistressedAdultFare = distressedOutputDataRow.DistressedAdultFare;
    }

    /// <summary>
    /// Flight key
    /// </summary>
    public string FlightKey { get; set; }

    /// <summary>
    /// Departure airport
    /// </summary>
    public string DepartureAirport { get; set; }

    /// <summary>
    /// Arrival airport
    /// </summary>
    public string ArrivalAirport { get; set; }

    /// <summary>
    /// Flight number
    /// </summary>
    public string FlightNumber { get; set; }

    /// <summary>
    /// Departure date
    /// </summary>
    public string DepartureDate { get; set; }

    /// <summary>
    /// Departure time
    /// </summary>
    public string DepartureTime { get; set; }

    /// <summary>
    /// Arrival date
    /// </summary>
    public string ArrivalDate { get; set; }

    /// <summary>
    /// Arrival time
    /// </summary>
    public string ArrivalTime { get; set; }

    /// <summary>
    /// Number of distressed seats
    /// </summary>
    public string NumberOfDistressedSeats { get; set; }

    /// <summary>
    /// Currency
    /// </summary>
    public string Currency { get; set; }

    /// <summary>
    /// Distressed Adult Fare
    /// </summary>
    public string DistressedAdultFare { get; set; }

    /// <summary>
    /// Adult Tax
    /// </summary>
    public string AdultTax { get; set; }

    /// <summary>
    /// Child Tax
    /// </summary>
    public string ChildTax { get; set; }
}
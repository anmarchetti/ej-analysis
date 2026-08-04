namespace easyJet.Holidays.Api.Domain.Data.Seats;

/// <summary>
/// Get seats map request
/// </summary>
public class GetSeatsMapResponse
{
    public string CurrencyCode { get; set; }
    public AircraftType AircraftType { get; set; }
    public string IsWrapped { get; set; }
    public List<SeatMapRow> Rows { get; set; }
    public List<Product> VisibleProducts { get; set; }
}
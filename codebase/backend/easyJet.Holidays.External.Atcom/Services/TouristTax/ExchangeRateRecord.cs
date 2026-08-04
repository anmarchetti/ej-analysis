namespace easyJet.Holidays.External.Atcom.Services.TouristTax;

internal sealed class ExchangeRateRecord
{
    public string UserCurrency { get; init; }
    public string HotelCurrency { get; init; }
    public decimal ExchangeRate { get; init; }
}

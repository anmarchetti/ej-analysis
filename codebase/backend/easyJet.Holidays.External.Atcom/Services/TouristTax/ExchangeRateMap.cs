using CsvHelper.Configuration;

namespace easyJet.Holidays.External.Atcom.Services.TouristTax;

internal sealed class ExchangeRateMap : ClassMap<ExchangeRateRecord>
{
    public ExchangeRateMap()
    {
        Map(m => m.UserCurrency).Name("UserCurrency");
        Map(m => m.HotelCurrency).Name("HotelCurrency");
        Map(m => m.ExchangeRate).Name("ExchangeRate");
    }
}

using CsvHelper.Configuration;
using System.Globalization;

namespace easyJet.Holidays.External.Atcom.Services.TouristTax;

internal sealed class TouristTaxRuleMap : ClassMap<TouristTaxRule>
{
    public TouristTaxRuleMap()
    {
        Map(m => m.ApplicationType).Name("Application Type");
        Map(m => m.Currency).Name("Currency");
        Map(m => m.CountryName).Name("Country Name");
        Map(m => m.CountryCode).Name("Country Code");
        Map(m => m.RegionName).Name("Region Name");
        Map(m => m.RegionCode).Name("Region Code");
        Map(m => m.ResortName).Name("Resort Name");
        Map(m => m.ResortCode).Name("Resort Code");
        Map(m => m.Geography).Name("Geography");
        Map(m => m.TravelFromDate)
            .Name("Travel From Date")
            .TypeConverterOption.CultureInfo(CultureInfo.GetCultureInfo("en-GB"))
            .TypeConverterOption.Format(
                "dd/MM/yyyy", "dd/MM/yy",     // Both with leading zeros
                "d/M/yyyy", "d/M/yy",         // Both without leading zeros
                "dd/M/yyyy", "dd/M/yy",       // Day with, month without leading zero
                "d/MM/yyyy", "d/MM/yy",       // Month with, day without leading zero
                "yyyy-MM-dd", "yyyy-M-d"      // ISO format with and without leading zeros
            )
            .Optional();
        Map(m => m.TravelToDate)
            .Name("Travel To Date")
            .TypeConverterOption.CultureInfo(CultureInfo.GetCultureInfo("en-GB"))
            .TypeConverterOption.Format(
                "dd/MM/yyyy", "dd/MM/yy",     // Both with leading zeros
                "d/M/yyyy", "d/M/yy",         // Both without leading zeros
                "dd/M/yyyy", "dd/M/yy",       // Day with, month without leading zero
                "d/MM/yyyy", "d/MM/yy",       // Month with, day without leading zero
                "yyyy-MM-dd", "yyyy-M-d"      // ISO format with and without leading zeros
            )
            .Optional();
        Map(m => m.PercentageRate0Star).Name("Percentage Rate 0 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PercentageRate1Star).Name("Percentage Rate 1 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PercentageRate2Star).Name("Percentage Rate 2 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PercentageRate3Star).Name("Percentage Rate 3 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PercentageRate4Star).Name("Percentage Rate 4 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PercentageRate5Star).Name("Percentage Rate 5 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.RoomRate0Star).Name("Room Rate 0 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.RoomRate1Star).Name("Room Rate 1 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.RoomRate2Star).Name("Room Rate 2 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.RoomRate3Star).Name("Room Rate 3 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.RoomRate4Star).Name("Room Rate 4 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.RoomRate5Star).Name("Room Rate 5 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PaxRateAdult0Star).Name("Pax Rate Adult 0 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PaxRateAdult1Star).Name("Pax Rate Adult 1 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PaxRateAdult2Star).Name("Pax Rate Adult 2 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PaxRateAdult3Star).Name("Pax Rate Adult 3 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PaxRateAdult4Star).Name("Pax Rate Adult 4 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PaxRateAdult5Star).Name("Pax Rate Adult 5 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PaxRateChild0Star).Name("Pax Rate Child 0 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PaxRateChild1Star).Name("Pax Rate Child 1 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PaxRateChild2Star).Name("Pax Rate Child 2 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PaxRateChild3Star).Name("Pax Rate Child 3 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PaxRateChild4Star).Name("Pax Rate Child 4 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PaxRateChild5Star).Name("Pax Rate Child 5 Star").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.PerNightOrPerStay).Name("Per Night / Per Stay").Optional();
        Map(m => m.MaximumNightsCap).Name("Maximum Nights Cap").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.MinimumValueCap).Name("Minimum Value Cap").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.MaximumValueCap).Name("Maximum Value Cap").TypeConverterOption.NullValues(string.Empty).Optional();
        Map(m => m.ChildAgeInclusive).Name("Child Age Inclusive").TypeConverterOption.NullValues(string.Empty).Optional();
    }
}

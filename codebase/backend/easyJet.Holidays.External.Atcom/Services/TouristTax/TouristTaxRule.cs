namespace easyJet.Holidays.External.Atcom.Services.TouristTax;

internal sealed class TouristTaxRule
{
    public TouristTaxRule() { }

    public string ApplicationType { get; init; }
    public string Currency { get; init; }
    public string CountryName { get; init; }
    public string CountryCode { get; init; }
    public string RegionName { get; init; }
    public string RegionCode { get; init; }
    public string ResortName { get; init; }
    public string ResortCode { get; init; }
    public string Geography { get; init; }
    public DateOnly TravelFromDate { get; init; }
    public DateOnly TravelToDate { get; init; }
    public decimal? PercentageRate3Star { get; init; }
    public decimal? PercentageRate4Star { get; init; }
    public decimal? PercentageRate5Star { get; init; }
    public decimal? RoomRate3Star { get; init; }
    public decimal? RoomRate4Star { get; init; }
    public decimal? RoomRate5Star { get; init; }
    public decimal? PaxRateAdult3Star { get; init; }
    public decimal? PaxRateAdult4Star { get; init; }
    public decimal? PaxRateAdult5Star { get; init; }
    public decimal? PaxRateChild3Star { get; init; }
    public decimal? PaxRateChild4Star { get; init; }
    public decimal? PaxRateChild5Star { get; init; }
    public string PerNightOrPerStay { get; init; }
    public int? MaximumNightsCap { get; init; }
    public decimal? MinimumValueCap { get; init; }
    public decimal? MaximumValueCap { get; init; }
    public decimal? PercentageRate0Star { get; init; }
    public decimal? PercentageRate1Star { get; init; }
    public decimal? PercentageRate2Star { get; init; }
    public decimal? RoomRate0Star { get; init; }
    public decimal? RoomRate1Star { get; init; }
    public decimal? RoomRate2Star { get; init; }
    public decimal? PaxRateAdult0Star { get; init; }
    public decimal? PaxRateAdult1Star { get; init; }
    public decimal? PaxRateAdult2Star { get; init; }
    public decimal? PaxRateChild0Star { get; init; }
    public decimal? PaxRateChild1Star { get; init; }
    public decimal? PaxRateChild2Star { get; init; }
    public string ChildAgeInclusive { get; init; }
}

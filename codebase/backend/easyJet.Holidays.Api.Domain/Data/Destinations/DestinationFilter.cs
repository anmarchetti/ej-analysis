namespace easyJet.Holidays.Api.Domain.Data.Destinations
{
    [Flags]
    public enum DestinationFilter
    {
        All = 0,
        Country = 1,
        Region = 2,
        Resort = 4,
        Accommodation = 8,
        VirtualCountry = 16,
        VirtualRegion = 32,
        /// <summary>
        /// VirtualResort
        /// </summary>
        VirtualResort = 64
    }
}

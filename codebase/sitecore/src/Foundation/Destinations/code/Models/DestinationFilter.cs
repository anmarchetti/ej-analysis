using System;

namespace easyJet.Foundation.Destinations.Models
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
        VirtualResort = 64
    }
}
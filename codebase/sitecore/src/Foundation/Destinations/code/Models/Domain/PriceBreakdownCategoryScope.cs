using System;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    /// <summary>
    /// Scope for price breakdown setting, to use it in different places
    /// </summary>
    [Flags]
    public enum PriceBreakdownCategoryScope
    {
        None = 0,
        BookingPage = 1,
        TradeAgentInfo = 2
    }
}
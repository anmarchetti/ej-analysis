namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler.Handlers
{
    /// <summary>
    /// 
    /// </summary>
    public interface IFlightCachePriceHandler
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        Task Handle(AlternativeFlightsCachePriceCalculationContext context);
    }
}

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler
{
    /// <summary>
    /// Interface for handling cache flight price
    /// </summary>
    public interface IAlternativeFlightsCachePriceService
    {
        /// <summary>
        /// Executes all handlers
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        Task Handle(AlternativeFlightsCachePriceCalculationContext context);
    }
}

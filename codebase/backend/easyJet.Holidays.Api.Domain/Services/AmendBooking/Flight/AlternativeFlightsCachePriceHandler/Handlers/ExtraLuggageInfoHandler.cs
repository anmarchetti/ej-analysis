namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler.Handlers
{
    /// <summary>
    /// While chainging a flight from ext to ext, extra luggage retains, we should get extra luggage price
    /// </summary>
    public class ExtraLuggageInfoHandler : IFlightCachePriceHandler
    {
        /// <inheritdoc />
        public Task Handle(AlternativeFlightsCachePriceCalculationContext context)
        {
            if (context.RequestOffer?.ExtraLuggageInfo?.Items?.Any() == true)
                ProcessExtraLuggage(context);
            return Task.CompletedTask;
        }

        private void ProcessExtraLuggage(AlternativeFlightsCachePriceCalculationContext context)
        {
            var sum = Convert.ToDecimal(context.RequestOffer?.ExtraLuggageInfo?.Items?.Sum(x => x.Price));

            foreach (var offer in context.AlternativeFlightOffers)
            {
                if (offer.Transport.Routes.All(x => x.IsExternal))
                {
                    offer.ExtraLuggagePrice = sum;
                }
            }
        }
    }
}

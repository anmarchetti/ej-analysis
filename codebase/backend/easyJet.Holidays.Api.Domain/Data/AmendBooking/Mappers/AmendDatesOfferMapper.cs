using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using Force.DeepCloner;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers
{
    /// <summary>
    /// 
    /// </summary>
    public static class AmendDatesOfferMapper
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <param name="alternativeFlightOffer"></param>
        /// <returns></returns>
        public static AmendDatesOffer CreateAmendDatesOffer(this AlternativeFlightOffer alternativeFlightOffer, AmendDatesOffer request)
        {
            var result = request.DeepClone();

            alternativeFlightOffer.Accom = request.Offer.Accom;
            alternativeFlightOffer.Transfers = request.Offer.Transfers;

            result.Offer = alternativeFlightOffer;
            result.MarketCode = request.MarketCode;

            return result;
        }
    }
}
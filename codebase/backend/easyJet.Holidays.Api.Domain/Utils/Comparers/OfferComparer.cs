using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Utils.Comparers
{
    /// <summary>
    /// Comparing offers
    /// </summary>
    public static class OfferComparer
    {
        /// <summary>
        /// Equals by transport, transfer and accomodation
        /// </summary>
        /// <param name="x"></param>
        /// <param name="y"></param>
        /// <returns></returns>
        /// <exception cref="NotImplementedException"></exception>
        public static bool Equals(Offer x, Offer y)
        {
            if (!UnitComparer.Equals(x.Accom.Unit, y.Accom.Unit))
                return false;

            if (!TransferComparer.Equals(x.Transfers, y.Transfers))
                return false;

            if (!AmendTransportComparer.Equals(x.Transport, y.Transport))
                return false;

            return true;
        }
    }
}

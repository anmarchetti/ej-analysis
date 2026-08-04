using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Services.Transfers
{
    public interface ITransfersFilterService
    {
        /// <summary>
        /// Filter booking trasnfers. Will return availalbe transfers for the booking.
        /// </summary>
        /// <param name="transfers">Transfers to filter</param>
        /// <param name="offer">offer</param>
        /// <param name="transferCodes">Offer transfer codes</param>
        /// <returns></returns>
        IEnumerable<TransferItem> FilterBookingTransfers(IEnumerable<TransferItem> transfers, Offer offer, IEnumerable<string> transferCodes = null);

        /// <summary>
        /// Hide transfers in offer
        /// </summary>
        /// <param name="offers">offers to modify</param>
        void HideTransfersIfNeeded(List<Offer> offers);


        /// <summary>
        /// Chet transfers visabiltity. Will check if need to hode transfers or not.
        /// </summary>
        /// <param name="offer">Offer to modify</param>
        /// <returns></returns>
        bool ShouldDisableTransfer(Offer offer);
    }
}

using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Transfers
{
    public class TransfersFilterService : ITransfersFilterService
    {

        private readonly AtcomSettings _atcomSettings;

        public TransfersFilterService(IOptions<AtcomSettings> atcomSettings)
        {
            _atcomSettings = atcomSettings.Value;
        }

        /// <inheritdoc />
        public IEnumerable<TransferItem> FilterBookingTransfers(IEnumerable<TransferItem> transfers, Offer offer, IEnumerable<string> transferCodes = null)
        {
            if (ShouldDisableTransfer(offer))
            {
                var filteredTransfer = transfers.Where(x => x.Type == TransferItemType.NoTransfer);
                HideTransfers(filteredTransfer);
                return filteredTransfer;
            }

            return transfers.Where(x => transferCodes?.Contains(x.Code) != false);
        }

        /// <inheritdoc />
        public void HideTransfersIfNeeded(List<Offer> offers)
        {
            offers.ForEach(offer =>
            {
                if (ShouldDisableTransfer(offer))
                {
                    HideTransfers(offer.Transfers);
                }
            });
        }

        /// <inheritdoc />
        public bool ShouldDisableTransfer(Offer offer)
        {
            return offer.Transport.Routes.FirstOrDefault(x => x.Direction == Direction.Outbound)?.DepDate?.DateTime < GetUkTime().AddHours(_atcomSettings.Transfers.DisableTransfersInHours);
        }


        /// <summary>
        /// Update visibility for transfers if needed
        /// </summary>
        /// <param name="transfers"></param>
        private void HideTransfers(IEnumerable<TransferItem> transfers)
        {
            transfers.ToList().ForEach(y =>
             {
                 y.IsHidden = true;
             });
        }

        /// <summary>
        /// UK time with timezone
        /// </summary>
        /// <returns></returns>
        private DateTime GetUkTime()
        {
            var ukTimeZone = TimeZoneInfo.FindSystemTimeZoneById(_atcomSettings.Transfers.DefaultTimezoneId);
            return TimeZoneInfo.ConvertTime(DateTime.Now, TimeZoneInfo.Local, ukTimeZone);
        }

    }
}

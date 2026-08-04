using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.Marketing;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Transfers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using System.Text.RegularExpressions;

namespace easyJet.Holidays.Api.Domain.Utils
{
    /// <summary>
    /// Static utils for transfers services. 
    /// Class is designed to be used in static context.
    /// </summary>
    public class TransfersServiceUtils
    {
        private static Regex DMCTransferCodeTemplate = new Regex("[A-z]{1,}[0-9]{1,}[A-z]{0,1}[NSPnsp]{2}$");

        /// <summary>
        /// Enrich transfer items with CMS data based on routes and departure date.
        /// </summary>
        /// <param name="transfers">Collection of transfers to update</param>
        /// <param name="transport">Routes information</param>
        /// <param name="hotelTransfers">Accommodation transfers from CMS</param>
        /// <param name="referenceDataService">Reference data provider to get default content if hotel transfers doesn't have data</param>
        public static async Task EnrichCmsData(IList<TransferItem> transfers, Transport transport, IEnumerable<HotelTransfer> hotelTransfers, IReferenceDataService referenceDataService)
        {
            var outboundRoute = transport?.Routes?.FirstOrDefault(r => r.Direction == Direction.Outbound);
            var departureDate = outboundRoute?.DepDate;
            var arrAirportCode = outboundRoute?.ArrPt;

            // We accept the fact that date and airport code can be null. It shouldn't happen, but method is designed to work fine with null values
            await ProcessCmsContent(transfers, departureDate, arrAirportCode, hotelTransfers, referenceDataService, (t, found, content) =>
            {
                t.Name = found.Name;
                t.Content = content;
                t.IconUrl = found.IconUrl;
            });
        }

        /// <summary>
        /// Get transfer content from CMS based on airport, departure date and run specific action
        /// </summary>
        /// <param name="transfers">Collection of transfers to process</param>
        /// <param name="departureDate">Departure date</param>
        /// <param name="arrAirportCode">Airport code</param>
        /// <param name="hotelTransfers">Hotel transfers from CMS</param>
        /// <param name="referenceDataService">Reference data service (get default transfers from CMS)</param>
        /// <param name="action">Action to run on each transfer</param>
        public static async Task ProcessCmsContent(
            IList<TransferItem> transfers,
            DateTimeOffset? departureDate,
            string arrAirportCode,
            IEnumerable<HotelTransfer> hotelTransfers,
            IReferenceDataService referenceDataService,
            Action<TransferItem, HotelTransfer, string> action)
        {
            // Group by code. Value is list because it can be multiple items with same code but different set of airports
            var hotelTransfersByCode = hotelTransfers?.GroupBy(x => x.Code).ToDictionary(k => k.Key, v => v.ToList())
                ?? new Dictionary<string, List<HotelTransfer>>();

            Dictionary<string, HotelTransfer> transferTypes = null;

            foreach (var t in transfers)
            {
                var tCode = GetTransferCode(t.Code);

                HotelTransfer found = null;
                hotelTransfersByCode.TryGetValue(tCode, out var foundList);

                if (foundList != null)
                {
                    // we are looking for item with a) empty airports list (means for all) OR b) airport in list
                    found = foundList.FirstOrDefault(x => x.Airports == null || x.Airports.Any() == false || x.Airports.Any(a => a.Code == arrAirportCode));
                }
                if (found == null)
                {
                    // Try to get it from reference data
                    transferTypes = transferTypes ?? (await referenceDataService.GetTransfers());
                    transferTypes.TryGetValue(tCode, out found);
                }

                if (found != null)
                {
                    var content = found.Content;

                    if (departureDate.HasValue)
                    {
                        var foundContentByDate = (found.ContentByDate ?? new List<ContentByDate>()).FirstOrDefault(x =>
                        {
                            // normalize end date: if it's 01-01-01 or null use max or min DateTime value
                            var end = (x.EndDate == null || x.EndDate?.Year < 1900) ? DateTimeOffset.MaxValue : x.EndDate.Value;
                            var start = x.StartDate == null ? DateTimeOffset.MinValue : x.StartDate.Value;

                            // compare dates only ignoring time
                            return (departureDate.Value.Date >= start.Date) && (departureDate.Value.Date <= end.Date);
                        });

                        if (foundContentByDate != null)
                        {
                            content = foundContentByDate.Content;
                        }
                    }

                    action(t, found, content);
                }
            }
        }

        /// <summary>
        /// HTX
        /// XXXX9999XXXX
        /// DMC
        /// XXXX999999BXX
        /// </summary>
        /// <param name="fullTransferCode">Code to parse</param>
        /// <returns></returns>
        public static string GetTransferCode(string fullTransferCode)
        {
            MatchCollection matches = DMCTransferCodeTemplate.Matches(fullTransferCode);
            if (matches.Count > 0)
            {
                return fullTransferCode.Substring(Math.Max(0, fullTransferCode.Length - 2));
            }
            return fullTransferCode.Last().ToString();
        }

        /// <summary>
        /// Get transfer code based on custom logic (will be changed in future, Atcom should do it for us)
        /// </summary>
        /// <param name="code"></param>
        /// <param name="types"></param>
        /// <returns></returns>
        public static TransferItemType GetTransferType(string code, TransferTypesSettings types)
        {
            if (types == null || string.IsNullOrEmpty(code)) return TransferItemType.Unknown;

            var tCode = GetTransferCode(code);
            if (types.Shared?.Contains(tCode) == true) return TransferItemType.Shared;
            if (types.Private?.Contains(tCode) == true) return TransferItemType.Private;
            if (types.NoTransfer?.Contains(tCode) == true) return TransferItemType.NoTransfer;

            return TransferItemType.Unknown;
        }

        /// <summary>
        /// Get included transfer type based fullTransferCode
        /// If fullTransferCode empty(null) or not find match will be returned the "Cheapest" type
        /// </summary>
        /// <param name="fullTransferCode">HTX XXXX9999XXXX DMC XXXX999999XX</param>
        /// <param name="types">Transfer types settings.</param>
        /// <param name="packageThemeType">Package themes.</param>
        /// <returns>Search transfer flag.</returns>
        public static string GetIncludedTransfer(
            string fullTransferCode,
            TransferTypesSettings types,
            PackageThemeType packageThemeType)
        {
            // If we don't receive transfer code, we shouldn't include it in Atcom request
            if (types == null || string.IsNullOrEmpty(fullTransferCode)) return IncludedTransferType.Cheapest;

            var transferCode = GetTransferCode(fullTransferCode);

            if (packageThemeType == PackageThemeType.Beach && types.NoTransfer?.Contains(transferCode) == true)
            {
                transferCode = transferCode[1].ToString();
            }

            if (packageThemeType == PackageThemeType.City)
            {
                transferCode = types.DefaultNoTransferCode;
            }

            if (types.Shared?.Contains(transferCode) == true) return IncludedTransferType.Shared;
            if (types.Private?.Contains(transferCode) == true) return IncludedTransferType.Private;
            if (types.NoTransfer?.Contains(transferCode) == true) return IncludedTransferType.NoTransfer;

            return IncludedTransferType.Cheapest;
        }

        /// <summary>
        /// Get included transfer type based on fullTransferCode

        /// If the fullTransferCode is empty (null) or no match is found, we will return the "Cheapest" type.
        /// </summary>
        /// <param name="fullTransferCode">HTX XXXX9999XXXX DMC XXXX999999XX</param>
        /// <param name="types">Transfer types settings.</param>
        /// <returns>Search transfer flag.</returns>
        public static string GetIncludedTransfer(string fullTransferCode, TransferTypesSettings types)
        {
            if (types == null || string.IsNullOrEmpty(fullTransferCode)) return IncludedTransferType.Cheapest;

            var transferCode = GetTransferCode(fullTransferCode);

            var result = types switch
            {
                _ when types.Shared?.Contains(transferCode) == true => IncludedTransferType.Shared,
                _ when types.Private?.Contains(transferCode) == true => IncludedTransferType.Private,
                _ when types.NoTransfer?.Contains(transferCode) == true => IncludedTransferType.NoTransfer,
                _ => IncludedTransferType.Cheapest
            };

            return result;
        }

        /// <summary>
        /// Get marketing transfer type based on custom logic
        /// </summary>
        /// <param name="code"></param>
        /// <param name="types"></param>
        /// <returns></returns>
        public static MarketingTransferType GetMarketingTransferType(string code, MarketingTransferTypesSettings types)
        {
            if (types == null || string.IsNullOrEmpty(code)) return MarketingTransferType.Unknown;

            var tCode = GetTransferCode(code);
            if (types.Shared?.Contains(tCode) == true) return MarketingTransferType.Shared;
            if (types.Private?.Contains(tCode) == true) return MarketingTransferType.Private;
            if (types.NoShared?.Contains(tCode) == true) return MarketingTransferType.NoShared;
            if (types.NoPrivate?.Contains(tCode) == true) return MarketingTransferType.NoPrivate;

            return MarketingTransferType.Unknown;
        }

        /// <summary>
        /// Build syntatic transfer object
        /// </summary>
        /// <param name="syntheticNoTransfer">syntatic transfer code</param>
        /// <param name="defaultNoTransferCode">default no transfer code</param>
        /// <returns></returns>
        public static TransferItem BuildSyntaticTransfer(string syntheticNoTransfer, string defaultNoTransferCode)
        {
            return new TransferItem
            {
                Type = TransferItemType.NoTransfer,
                Code = $"{syntheticNoTransfer}{defaultNoTransferCode}",
                Quantity = 1,
                Price = 0,
                Method = ItemMethod.PP,
                MaxPax = int.MaxValue
            };
        }

    }
}

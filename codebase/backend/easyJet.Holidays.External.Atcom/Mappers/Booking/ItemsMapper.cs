using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.ReferenceData.Themes;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using System.Globalization;

namespace easyJet.Holidays.External.Atcom.Mappers.Booking
{
    public class ItemsMapper
    {
        /// <summary>
        /// Map items. Optionally filter items by code if it's specified
        /// </summary>
        /// <param name="items"></param>
        /// <param name="code"></param>
        /// <returns></returns>
        public static List<BookingItem> Map(IEnumerable<Item> items, Currency currency, TransferSurchargeSettings surchargeSettings, string code = null)
        {
            // Get rid of CANCELLED items
            var allItems = (items ?? new Item[0]).Where(i => i.Ser_Sts == null || i.Ser_Sts.All(x => x != Ser_Sts.CANCELLED));

            var itemsByCode = string.IsNullOrEmpty(code) ? allItems : allItems.Where(i => i.Item_Type?.Code == code);

            var result = itemsByCode.Select(x =>
            {
                decimal.TryParse(x.From_Prc?.Value, CultureInfo.InvariantCulture, out var price);
                int.TryParse(x.Min_Pax, out var minPax);
                int.TryParse(x.Max_Pax, out var maxPax);

                var smallSeSurcharge = x.Prices?.FirstOrDefault(p =>
                    p.Prc_Cd == surchargeSettings?.SmallSeCode && p.Prc_Cd_Tp == surchargeSettings?.SmallSeType);
                var hasSmallSeSurcharge = decimal.TryParse(smallSeSurcharge?.Prc?.Value, CultureInfo.InvariantCulture, out var smallSeSurchargePrice);
                int.TryParse(smallSeSurcharge?.Qty, out int smallSeSurchargeQty);

                var largeSeSurcharge = x.Prices?.FirstOrDefault(p =>
                    p.Prc_Cd == surchargeSettings?.LargeSeCode && p.Prc_Cd_Tp == surchargeSettings?.LargeSeType);
                var hasLargeSeSurcharge = decimal.TryParse(largeSeSurcharge?.Prc?.Value, CultureInfo.InvariantCulture, out var largeSeSurchargePrice);
                int.TryParse(largeSeSurcharge?.Qty, out int largeSeSurchargeQty);

                return new BookingItem
                {
                    Code = x.Code,
                    Name = x.Name,
                    AutoInclude = x.Auto_Inc,
                    StartDate = DateFormatUtils.Parse(x.St_Dt).DateTime,
                    Method = x.Item_Method == ItemItem_Method.PI ? ItemMethod.PI : ItemMethod.PP,
                    MCMethod = x.MC_Method == MC_Method.PB ? MultiCentreMethod.PB : (x.MC_Method == MC_Method.PP ? MultiCentreMethod.PP : MultiCentreMethod.MANY),
                    Prom = (x.Item1 as Prom)?.Code,
                    Quantity = int.Parse(x.Bkg_Qty ?? "0"),
                    RateRule = x.Rate_Rule.ToString(),
                    ServiceStates = x.Ser_Sts?.Select(s => s.ToString()).ToList(),
                    SetType = x.Set_Type.ToString(),
                    TypeCode = x.Item_Type?.Code,
                    Paxs = x.SubServPaxs?.Select(p => p.Pax_Id).ToList(),
                    MinPax = minPax,
                    MaxPax = maxPax,
                    Price = price,
                    Currency = currency,
                    Id = x.Id,
                    ProductId = x.Crt_Cd,
                    SmallSeSurcharge = hasSmallSeSurcharge ? smallSeSurchargePrice : null,
                    SmallSeSurchargeQuantity = hasSmallSeSurcharge ? smallSeSurchargeQty : 0,
                    LargeSeSurcharge = hasLargeSeSurcharge ? largeSeSurchargePrice : null,
                    LargeSeSurchargeQuantity = hasLargeSeSurcharge ? largeSeSurchargeQty : 0
                };
            }).ToList();

            return result;
        }

        /// <summary>
        /// Map items. Optionally filter items by code if it's specified
        /// </summary>
        /// <param name="items"></param>
        /// <param name="code"></param>
        /// <returns></returns>
        public static List<TransferItem> MapTransfers(IEnumerable<BookingItem> items, TransferTypesSettings types)
        {
            var result = items.Select(x =>
            {
                return new TransferItem(x)
                {
                    Type = TransfersServiceUtils.GetTransferType(x.Code, types)
                };
            }).ToList();

            return result;
        }

        /// <summary>
        /// Map search response transfer items
        /// </summary>
        /// <param name="offerTransfers"></param>
        /// <param name="types"></param>
        /// <param name="currency"></param>
        /// <param name="translatedTransfers"></param>
        /// <returns></returns>
        public static IList<TransferItem> MapTransfers(AvCacheResultOffersOfferTransfers offerTransfers, TransferTypesSettings types, Currency currency, Dictionary<string, HotelTransfer> translatedTransfers)
        {
            return offerTransfers?.Transfer?.Select(t =>
            {
                var offerTransferTypeCode = TransfersServiceUtils.GetTransferCode(t.Code);
                var translatedTransferName = translatedTransfers?.TryGetValue(offerTransferTypeCode, out var hotelTransfer) == true ? hotelTransfer.Name : null;

                return new TransferItem
                {
                    Code = ExtractTransferCode(t.Code),
                    Name = translatedTransferName ?? t.Name,
                    Quantity = (int)t.Qty,
                    Price = t.Price,
                    Currency = currency,
                    Method = t.RateTpSpecified && t.RateTp == AvCacheResultOffersOfferTransfersTransferRateTp.PP ? ItemMethod.PP : ItemMethod.PI,
                    Type = TransfersServiceUtils.GetTransferType(t.Code, types)
                };
             }).ToList() ?? new List<TransferItem>();
        }

        /// <summary>
        /// Extract transfer code from search cache value: symbol after ~~
        /// </summary>
        /// <param name="code">Transfer code</param>
        /// <returns>Transfer item code</returns>
        public static string ExtractTransferCode(string code)
        {
            var split = code?.Split(["~~"], StringSplitOptions.None);
            return split?.Length > 1 ? split[1] : code;
        }
    }
}

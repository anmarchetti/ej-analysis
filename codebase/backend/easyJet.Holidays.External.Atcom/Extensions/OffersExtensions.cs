using easyJet.Holidays.External.Atcom.Models.Internal.Search;

namespace easyJet.Holidays.External.Atcom.Extensions
{
    public static class OffersExtensions
    {
        /// <summary>
        /// Return all matching offers matching a UnitCode
        /// </summary>
        /// <param name="offers"></param>
        /// <param name="unitCode"></param>
        /// <returns></returns>
        public static IEnumerable<AvCacheResultOffersOffer> ByUnitCode(
            this IEnumerable<AvCacheResultOffersOffer> offers, string unitCode)
        {
            return offers.Where(x =>
                {
                    var code = x.GetUnitCode() ?? string.Empty;

                    return code.Equals(unitCode, StringComparison.OrdinalIgnoreCase);
                });
        }

        public static IEnumerable<IGrouping<string?, AvCacheResultOffersOffer>> GroupByUnitCode(
            this IEnumerable<AvCacheResultOffersOffer> offers)
        {
            return offers.GroupBy(offer => offer.Accom?.FirstOrDefault()?.Unit?.FirstOrDefault()?.Code);
        }

        public static string GetAccommodationId(this AvCacheResultOffersOffer offer)
        {
            var accom = offer.Accom.FirstOrDefault();

            return accom?.Code ?? accom?.Id;
        }

        public static string GetPackageId(this AvCacheResultOffersOffer offer)
        {
            return offer.Accom.FirstOrDefault()?.AtcomId;
        }

        public static string GetSelectedBoardCode(this AvCacheResultOffersOffer offer)
        {
            return offer?.Accom.FirstOrDefault()?.Unit?.FirstOrDefault()?.Board;
        }

        public static string GetSystem(this AvCacheResultOffersOffer offer)
        {
            return offer.Accom.FirstOrDefault()?.Unit?.FirstOrDefault()?.SrcInfo?.System;
        }

        public static string GetSourceUnit(this AvCacheResultOffersOffer offer)
        {
            return offer.Accom.FirstOrDefault()?.Unit?.FirstOrDefault()?.SrcInfo?.Unit;
        }

        public static AvCacheResultOffersOfferAccomUnit GetUnit(this AvCacheResultOffersOffer offer)
        {
            return offer.Accom.FirstOrDefault()?.Unit?.FirstOrDefault();
        }

        public static decimal? GetUnitPrice(this AvCacheResultOffersOffer offer)
        {
            return offer.Accom.FirstOrDefault()?.Unit?.FirstOrDefault()?.Price;
        }

        public static string GetUnitCode(this AvCacheResultOffersOffer offer)
        {
            return offer.Accom?.FirstOrDefault()?.Unit?.FirstOrDefault()?.Code;
        }
        public static bool IsExternal(this AvCacheResultOffersOffer offer)
        {
            var accom = offer.Accom.FirstOrDefault();

            return accom != null && accom.ExtSpecified && accom.Ext == YesNo.Y;
        }
    }
}

using easyJet.Holidays.External.Atcom.Models.Internal.Search;

namespace easyJet.Holidays.External.Atcom.Extensions
{
    internal static class UnitExtensions
    {
        public static void AddPrice(this AvCacheResultOffersOfferAccomUnit unit, decimal value)
        {
            if (unit.Price < 0 || unit.PricePP < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(unit), "Price cannot be negative");
            }

            if (value == 0) return;

            if (unit.Price == 0 || unit.PricePP == 0)
            {
                unit.Price += value;
            }
            else
            {
                var numberOfPax = unit.Price / unit.PricePP;
                unit.Price += value;
                unit.PricePP = unit.Price / numberOfPax;
            }
        }
    }
}

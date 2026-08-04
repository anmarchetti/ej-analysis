using easyJet.Holidays.Api.Domain.Data;

namespace easyJet.Holidays.External.Atcom.Extensions
{
    internal static class PriceExtensions
    {
        public static void AddPrice(this IPriceModel model, decimal value)
        {
            if (model.Price < 0 || model.PricePP < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(model), "Price cannot be negative");
            }

            if (value == 0) return;

            if (model.Price == 0 || model.PricePP == 0)
            {
                model.Price += value;
            }
            else
            {
                var numberOfPax = model.Price / model.PricePP;
                model.Price += value;
                model.PricePP = model.Price / numberOfPax;
            }
        }

        public static void AddPrice(this IPriceModel model, IPriceModel add)
        {
            if (model.Price < 0 || model.PricePP < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(model), "Price cannot be negative");
            }

            if (add.Price < 0 || add.PricePP < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(add), "Price cannot be negative");
            }

            if (add.Price == 0) return;

            if (model.PricePP == 0 || add.PricePP == 0)
            {
                model.Price += add.Price;
            }
            else
            {
                var numberOfPax = model.Price / model.PricePP;
                var numberOfPaxAdd = add.Price / add.PricePP;
                model.Price += add.Price;
                model.PricePP = model.Price / (numberOfPax + numberOfPaxAdd);
            }
        }
    }
}

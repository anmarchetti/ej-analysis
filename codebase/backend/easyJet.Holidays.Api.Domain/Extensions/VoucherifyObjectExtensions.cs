using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;

namespace easyJet.Holidays.Api.Domain.Extensions
{
    public static class VoucherifyObjectExtensions
    {
        public static bool TryGetFromMetadata<T>(this IVoucherifyObject target, string name, out T value)
        {
            if (target.Metadata != null && target.Metadata.TryGetValue(name, out var meta))
            {
                value = (T)meta;
                return value != null;
            }

            value = default;
            return false;
        }

        public static Currency GetCurrency(this IVoucherifyObject target)
        {
            return TryGetFromMetadata<string>(target, VoucherifyMetaKeys.Currency, out var currency)
                ? new Currency { Code = currency }
                // vouchers without currency code should be considered as GBP vouchers.
                // default currency code for old vouchers
                : Currency.GBP;
        }
    }
}

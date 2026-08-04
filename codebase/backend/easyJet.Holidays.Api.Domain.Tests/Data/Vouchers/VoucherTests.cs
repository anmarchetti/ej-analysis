using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Voucherify.Core.DataModel;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests
{
    public class VoucherTests
    {
        [Fact]
        public void Voucher_HasCurrencyMeta_CurrencySet()
        {
            var voucher = new Voucher();
            voucher.SetProperty(x => x.Metadata, CreateMetadata("USD"));

            var sut = voucher.GetCurrency();

            Assert.NotNull(sut);
            sut.Code.Should().BeEquivalentTo("USD");
        }

        protected static Metadata CreateMetadata(string currency = null)
        {
            var meta = new Dictionary<string, object>();
            if (currency != null) meta.Add(VoucherifyMetaKeys.Currency, currency);
            return new Metadata(meta);
        }
    }
}

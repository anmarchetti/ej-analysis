using easyJet.Holidays.Api.Common.Exceptions;

namespace easyJet.Holidays.Api.Domain.Data.Vouchers
{
    public class VoucherRedeemExeption : ApiException
    {
        public VoucherRedeemExeption(ExceptionCode exCode) : base(exCode) { }

        public VoucherRedeemExeption(ExceptionCode exCode, Exception innerException) : base(exCode, null, null, innerException) { }
    }
}

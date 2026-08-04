using System.Threading.Tasks;
using easyJet.Foundation.Voucherify.Models.Domain;

namespace easyJet.Foundation.Voucherify.Services
{
    public interface IVoucherifyService
    {
        /// <summary>
        /// If voucher exists in Voucherify then update the voucher, otherwise create a new one.
        /// </summary>
        /// <param name="voucherInfo">Voucher Info.</param>
        /// <returns>Return created or updated voucher code.</returns>
        Task<string> CreateOrUpdate(VoucherInfo voucherInfo);
    }
}

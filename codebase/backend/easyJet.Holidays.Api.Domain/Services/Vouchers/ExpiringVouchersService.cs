using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Data.Vouchers.Expiring;

namespace easyJet.Holidays.Api.Domain.Services.Vouchers
{
    /// <inheritdoc />
    public class ExpiringVouchersService : IExpiringVouchersService
    {
        private readonly IExpiringVouchersRepository _expiringVouchersRepository;
        private readonly IVouchersCustomerRepository _customerRepository;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="expiringVouchersRepository"></param>
        /// <param name="customerRepository"></param>
        public ExpiringVouchersService(IExpiringVouchersRepository expiringVouchersRepository,
            IVouchersCustomerRepository customerRepository)
        {
            _expiringVouchersRepository = expiringVouchersRepository;
            _customerRepository = customerRepository;
        }

        /// <inheritdoc />
        public async Task<Dictionary<string, ExpiringVouchersGroup>> GetExpiringGroupedByCustomer(
            VoucherType voucherType,
            int days)
        {
            var vouchers =
                await _expiringVouchersRepository.GetAllExpiringVouchers(voucherType, days);

            //filter and group vouchers by customer and expiration date
            var groupedByCustomer = vouchers
                .Where(v => !string.IsNullOrEmpty(v.HolderId)) // exclude non published vouchers 
                .Where(v => (v.Gift?.Balance ?? 0) > 0) // exclude vouchers with no balance
                .GroupBy(v => v.HolderId)
                .ToDictionary(k => k.Key, v => new ExpiringVouchersGroup
                {
                    Customer = new VoucherCustomer(),
                    Vouchers = v.Select(x => new ExpiringVoucher
                    {
                        Code = x.Code,
                        Campaign = x.Campaign,
                        Category = x.Category,
                        Type = x.Type.ToString(),
                        ExpirationDate = x.ExpirationDate,
                        Metadata = x.Metadata.ToDictionary(k => k.Key, kv => kv.Value?.ToString()),
                        Balance = (decimal)(x.Gift?.Balance ?? 0) / 100 // Voucherify balance is in pennies
                    })
                });

            // Extend model customer details 
            var customers = await _customerRepository.Get(groupedByCustomer.Keys);

            foreach (var customer in customers)
            {
                if (groupedByCustomer.TryGetValue(customer.Id, out var dto))
                {
                    dto.Customer.Name = customer.Name;
                    dto.Customer.Email = customer.Email;
                }
            }

            // Exclude groups without customer (actually it's possible that voucher has HolderID but it's not available anymore in Voucherify system)
            groupedByCustomer = groupedByCustomer.Where(x => !string.IsNullOrEmpty((x.Value.Customer.Email)))
                .ToDictionary(k => k.Key, v => v.Value);

            return groupedByCustomer;
        }
    }
}
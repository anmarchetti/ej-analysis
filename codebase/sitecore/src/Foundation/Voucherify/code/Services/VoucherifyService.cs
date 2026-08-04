using System;
using System.Net;
using System.Threading.Tasks;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Utils;
using easyJet.Foundation.Voucherify.Extensions;
using easyJet.Foundation.Voucherify.Logging;
using easyJet.Foundation.Voucherify.Models.Domain;
using Newtonsoft.Json;
using Sitecore.Configuration;
using Voucherify;
using Voucherify.Core.DataModel;
using Voucherify.Core.Exceptions;
using Voucherify.DataModel;
using Voucherify.DataModel.Contexts;
using Voucher = Voucherify.DataModel.Voucher;
using VoucherRedemption = Voucherify.DataModel.Contexts.VoucherRedemption;

namespace easyJet.Foundation.Voucherify.Services
{
    [Service(typeof(IVoucherifyService), Lifetime = Lifetime.Singleton)]
    public class VoucherifyService : IVoucherifyService
    {
        private readonly Api api;
        private readonly IVoucherifyLogger logger;

        public VoucherifyService(IVoucherifyLogger logger)
        {
            api = new Api(SecretsManager.GetSecret("Voucherify.ApplicationId"), SecretsManager.GetSecret("Voucherify.SecretKey"))
                .WithSSL()
                .WithHost(Settings.GetSetting("Voucherify.HostName"));
            this.logger = logger;
        }

        /// <inheritdoc/>
        public async Task<string> CreateOrUpdate(VoucherInfo voucherInfo)
        {
            try
            {
                if (voucherInfo == null)
                {
                    return null;
                }

                logger.Debug($"Trying to get voucher {voucherInfo.VoucherCode}", this);
                var voucher = await GetVoucher(voucherInfo.VoucherCode);

                // If voucher exists in Voucherify
                if (voucher != null && voucher.Code == voucherInfo.VoucherCode)
                {
                    logger.Debug($"Trying to update voucher {voucherInfo.VoucherCode} {JsonConvert.SerializeObject(voucherInfo)}", this);
                    voucher = await UpdateVoucher(voucher, voucherInfo);
                }
                else
                {
                    logger.Debug($"Trying to create voucher {voucherInfo.VoucherCode} {JsonConvert.SerializeObject(voucherInfo)}", this);
                    voucher = await CreateVoucher(voucherInfo);
                }

                return voucher.Code;
            }
            catch (Exception ex)
            {
                logger.Error($"Unable to get update voucher for ID: {voucherInfo.VoucherCode}. {ex.Message}", ex, this);
                throw;
            }
        }

        private async Task<Voucher> GetVoucher(string voucherCode)
        {
            try
            {
                return await api.Vouchers.Get(voucherCode);
            }
            catch (VoucherifyClientException ex) when (ex.Code == (int)HttpStatusCode.NotFound)
            {
                logger.Debug($"Voucher was not found {voucherCode}", this);
                return null;
            }
        }

        private async Task<Voucher> UpdateVoucher(Voucher voucher, VoucherInfo voucherInfo)
        {
            var updateVoucher = VoucherUpdate.FromVoucher(voucher);
            updateVoucher.WithAdditionalInfo(voucherInfo.Title)
                .WithActive(true)
                .WithStartDate(voucherInfo.StartDate)
                .WithExpirationDate(voucherInfo.ExpirationDate)
                .WithMetadata(new Metadata(voucherInfo.Metadata));

            return await api.Vouchers.Update(voucherInfo.VoucherCode, updateVoucher);
        }

        private async Task<Voucher> CreateVoucher(VoucherInfo voucherInfo)
        {
            var voucher = new VoucherCreate()
            {
                AdditionalInfo = voucherInfo.Title,
                Redemption = new VoucherRedemption().VoucherRedemptionWithQuantity(voucherInfo.Redemption),
                StartDate = voucherInfo.StartDate,
                ExpirationDate = voucherInfo.ExpirationDate,
                Metadata = new Metadata(voucherInfo.Metadata),
                Active = true,
            }.WithDiscount(new Discount().WithAmountOff(1));

            return await api.Vouchers.Create(voucherInfo.VoucherCode, voucher);
        }
    }
}

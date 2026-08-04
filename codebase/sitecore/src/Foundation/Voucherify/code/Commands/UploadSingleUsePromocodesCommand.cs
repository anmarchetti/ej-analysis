using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.Voucherify.Logging;
using easyJet.Foundation.Voucherify.Models.SingleUsePromocodes;
using easyJet.Foundation.Voucherify.Services;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.Voucherify.Commands
{
    /// <summary>
    /// Upload single use promocodes command.
    /// </summary>
    public class UploadSingleUsePromocodesCommand : BaseCsvCommand
    {
        private readonly ISingleUsePromoCodeUploadService service;

        public UploadSingleUsePromocodesCommand(ISingleUsePromoCodeUploadService service, IDatabaseProvider databaseProvider, ICsvUtilsService csvUtilsService, IVoucherifyLogger logger, IUserCreationService userCreationService, ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService)
        {
            this.service = service;
        }

        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var data = GetFileData<SingleUsePromocodesCsv>(contextItem);

            if (data.Count <= 0)
            {
                yield break;
            }

            var campaignName = contextItem.Fields["CampaignName"].Value;
            var codes = data.Select(csv => csv.Code).ToList();

            try
            {
                service.UploadSingleUsePromoCodes(codes, campaignName);
            }
            catch (Exception ex)
            {
                Log.Error("[dynamodb] Error submitting codes.", ex, this);
            }
        }
    }
}
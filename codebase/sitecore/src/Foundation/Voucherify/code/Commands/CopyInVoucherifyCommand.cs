using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.Voucherify.Logging;
using easyJet.Foundation.Voucherify.Services;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.Voucherify.Commands
{
    /// <summary>
    /// Instance for 'Copy in Voucherify' command.
    /// </summary>
    public class CopyInVoucherifyCommand : BaseItemProgressReportingCommand
    {
        private readonly ISyncDataService syncDataService;

        public CopyInVoucherifyCommand(ISyncDataService syncDataService, IVoucherifyLogger logger, IDatabaseProvider databaseProvider, IUserCreationService userCreationService, ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
            this.syncDataService = syncDataService;
        }

        /// <inheritdoc />
        protected override bool IsCommandContextValid(CommandContext context)
        {
            return context.Items[0].TemplateID.Equals(Templates.Promotion.Id) && IsPromotionValid(context.Items[0]);
        }

        /// <inheritdoc />
        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            return syncDataService.SyncPromotionToVoucherifyAndEnforceSortOrder(contextItem);
        }

        /// <inheritdoc />
        protected override void PostAction(ClientPipelineArgs args)
        {
            base.PostAction(args);

            if (!bool.TryParse(args.Parameters[SitecoreExtensions.Constants.JobFailedIdentifier], out var result))
            {
                SheerResponse.Alert("Promotion item has been copied in Voucherify.");
            }
        }

        private bool IsPromotionValid(Item item)
        {
            return item.TemplateID.Equals(Templates.Promotion.Id) &&
                   !string.IsNullOrWhiteSpace(item.Fields[Templates.Promotion.Fields.CustomerPromoCode].Value) &&
                   !string.IsNullOrWhiteSpace(item.Fields[Templates.Promotion.Fields.DateValidityFrom].Value) &&
                   !string.IsNullOrWhiteSpace(item.Fields[Templates.Promotion.Fields.DateValidityTo].Value);
        }
    }
}
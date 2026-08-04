using System;
using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.XConnect.Common.Logging;
using easyJet.Foundation.XConnect.Common.Services;
using Sitecore;
using Sitecore.Text;
using Sitecore.XConnect;

namespace easyJet.Foundation.XConnect.Common.Commands
{
    public class CleanInteractionsCommand : XConnectCleanCommandBase<Interaction>
    {
        protected override string CommandTitle => "Clean Interactions";

        public CleanInteractionsCommand(
            IXConnectLogger logger,
            ICleanContactsService cleanContactsService,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, cleanContactsService, userCreationService, sitecoreUiService)
        {
        }

        protected override string FormUrl
            => new UrlString(UIUtil.GetUri("control:CleanInteractionsData")).ToString();

        protected override IEnumerable<Interaction> ExecuteCleanUp(DateTime inactiveDateTime, bool performDeletion = false)
            => CleanContactsService.CleanInteractions(inactiveDateTime, performDeletion);
    }
}
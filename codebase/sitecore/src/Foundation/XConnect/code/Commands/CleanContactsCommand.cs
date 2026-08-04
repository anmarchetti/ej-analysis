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
    public class CleanContactsCommand : XConnectCleanCommandBase<Contact>
    {
        protected override string CommandTitle => "Clean Anonymous Contacts";

        public CleanContactsCommand(
            IXConnectLogger logger,
            ICleanContactsService cleanContactsService,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, cleanContactsService, userCreationService, sitecoreUiService)
        {
        }

        protected override string FormUrl => new UrlString(UIUtil.GetUri("control:CleanContactsData")).ToString();

        protected override IEnumerable<Contact> ExecuteCleanUp(DateTime inactiveDateTime, bool performDeletion = false)
            => CleanContactsService.CleanContacts(inactiveDateTime, performDeletion);
    }
}
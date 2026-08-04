using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.XConnect.Common.Logging;
using easyJet.Foundation.XConnect.Common.Services;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.XConnect.Common.Commands
{
    public abstract class XConnectCleanCommandBase<T> : BaseProgressReportingCommand<T>
        where T : class
    {
        protected override string CommandCategory => "XConnect Cleanup Tasks";

        protected const string DialogWidth = "600";
        protected const string DialogHeight = "400";
        protected readonly ICleanContactsService CleanContactsService;
        protected bool isTestRun;

        public XConnectCleanCommandBase(
            IDatabaseProvider databaseProvider,
            IXConnectLogger logger,
            ICleanContactsService cleanContactsService,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
            CleanContactsService = cleanContactsService;
        }

        protected static (bool isDateParsed, DateTime startDate, bool performDeletion) ParseDate(string datesString)
        {
            var dates = datesString.Split('|');
            var startDateParsed = DateTime.TryParse(dates.First(), out var startDate);
            var deleteInteractionsParsed = bool.TryParse(dates.Last(), out var deleteInteractions);
            return (startDateParsed && deleteInteractionsParsed, startDate.ToUniversalTime(), deleteInteractions);
        }

        protected override string GetFinalStatusMessage(List<T> processedItems)
        {
            if (processedItems.Count == 0)
            {
                return $"No elements {(isTestRun ? "found" : "deleted")}!";
            }
            else
            {
                return $"{processedItems.Count} elements {(isTestRun ? "found" : "deleted")}!<br>Duration: {TotalExecutionDuration:c}";
            }
        }

        protected override bool IsCommandContextValid(CommandContext context) => true;

        protected override string GetStatusMessage(T item) => string.Empty;

        protected override void PostAction(ClientPipelineArgs args) => Context.ClientPage.SendMessage(this, "Finished cleaning elements");

        protected abstract string FormUrl { get; }

        protected override void ExecuteJob(ClientPipelineArgs args)
        {
            if (!args.IsPostBack)
            {
                SheerResponse.ShowModalDialog(FormUrl, DialogWidth, DialogHeight, string.Empty, true);
                args.WaitForPostBack();
            }
            else if (args.Result != "undefined")
            {
                args.Parameters.Add("dates", args.Result);
                base.ExecuteJob(args);
            }
        }

        protected abstract IEnumerable<T> ExecuteCleanUp(DateTime inactiveDateTime, bool performDeletion = false);

        protected override IEnumerable<T> ProcessItems(Item contextItem, ClientPipelineArgs args)
        {
            var datesString = args.Parameters["dates"];
            var (isDatesParsed, startDate, performDeletion) = ParseDate(datesString);

            if (!isDatesParsed)
            {
                return new List<T>();
            }

            isTestRun = !performDeletion;
            return ExecuteCleanUp(startDate, performDeletion);
        }
    }
}
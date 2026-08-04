using System.Web.Mvc;
using easyJet.Feature.Redirects.Logging;
using easyJet.Feature.Redirects.Services;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Tasks;

namespace easyJet.Feature.Redirects.Tasks.Commands
{
    public class ActivateRedirectRulesCommand
    {
        private const string MasterDatabaseName = "master";

        private readonly IRedirectRuleManagementService redirectRuleManagementService;
        private readonly IRedirectsLogger logger;

        public ActivateRedirectRulesCommand()
        {
            redirectRuleManagementService = DependencyResolver.Current.GetService<IRedirectRuleManagementService>();
            logger = DependencyResolver.Current.GetService<IRedirectsLogger>();
        }

        /// <summary>
        /// Promotes AwaitingPublish redirect rules to Active when their related items are published.
        /// </summary>
        /// <param name="items">Root items.</param>
        /// <param name="commandItem">Command item.</param>
        /// <param name="scheduleItem">Schedule item.</param>
        public void Execute(Item[] items, CommandItem commandItem, ScheduleItem scheduleItem)
        {
            var database = Context.ContentDatabase ?? Factory.GetDatabase(MasterDatabaseName);
            if (database == null)
            {
                logger.Error("ActivateRedirectRulesCommand: master database was not found.", this);
                return;
            }

            var activated = redirectRuleManagementService.ActivateReadyRules(database, out var error);
            if (!string.IsNullOrEmpty(error))
            {
                logger.Error($"ActivateRedirectRulesCommand failed: {error}", this);
                return;
            }

            if (activated > 0)
            {
                logger.Info($"ActivateRedirectRulesCommand activated {activated} redirect rule group(s).", this);
            }
        }
    }
}

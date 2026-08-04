using System;
using System.Xml.Linq;
using easyJet.Foundation.Presentation.Logging;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Pipelines.RequestBegin;
using Sitecore.LayoutService.Mvc.Routing;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;
using Sitecore.Rules;

namespace easyJet.Foundation.Presentation.Pipelines.RequestBegin
{
    public class RulesProcessor : ContextItemResolver
    {
        private static readonly string RulesPathPattern = Settings.GetSetting("Foundation.Presentation.RulesPathPattern");

        private readonly IPresentationLogger logger;

        public RulesProcessor(IItemResolver itemResolver, IRouteMapper routeMapper, IPresentationLogger logger)
            : base(itemResolver, routeMapper)
        {
            this.logger = logger;
        }

        /// <summary>
        /// Iterates trough all rules within Rules folder and run them.
        /// </summary>
        /// <param name="args">Request Begin Arguments.</param>
        public override void Process(RequestBeginArgs args)
        {
            try
            {
                if (Context.Item == null || Context.Item.Database.Name.Equals("core", StringComparison.OrdinalIgnoreCase))
                {
                    logger.Debug("Context Item was not found", this);
                    return;
                }

                var path = string.Format(RulesPathPattern, Context.Site.RootPath);
                var ruleItemFolder = Context.Item.Database.GetItem(path);

                if (ruleItemFolder == null)
                {
                    logger.Debug("Rules folder was not found", this);
                    return;
                }

                foreach (Item ruleItem in ruleItemFolder.Children)
                {
                    try
                    {
                        if (ruleItem == null)
                        {
                            continue;
                        }

                        var rule = ruleItem.Fields[Constants.Fields.RulesSettings.Rules].Value;
                        var rules = RuleFactory.ParseRules<RuleContext>(Context.Item.Database, XElement.Parse(rule));

                        var ruleContext = new RuleContext()
                        {
                            Item = Context.Item
                        };

                        ruleContext.Parameters.Add(Constants.RequestBeginArgsKey, args);

                        rules.Run(ruleContext);
                    }
                    catch (Exception exc)
                    {
                        logger.Error($"Error occured while processing rule {ruleItem.Name} ({ruleItem.ID})", exc, this);
                    }
                }
            }
            catch (Exception exc)
            {
                logger.Error("Error occured while processing rules", exc, this);
            }
        }
    }
}
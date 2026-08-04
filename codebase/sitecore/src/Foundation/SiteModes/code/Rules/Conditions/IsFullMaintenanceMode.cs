using System.Web.Mvc;
using easyJet.Foundation.SiteModes.Services;
using Sitecore.Rules;
using Sitecore.Rules.Conditions;

namespace easyJet.Foundation.SiteModes.Rules.Conditions
{
    public class IsFullMaintenanceMode<T> : OperatorCondition<T>
        where T : RuleContext
    {
        private readonly ISiteModeService service;

        public IsFullMaintenanceMode()
        {
            service = DependencyResolver.Current.GetService<ISiteModeService>();
        }

        /// <summary>
        /// Check in Full Mode is on.
        /// </summary>
        /// <param name="ruleContext">Rule Context.</param>
        /// <returns>True if Full Mode is on. Otherwise - false.</returns>
        protected override bool Execute(T ruleContext)
        {
            return service.IsFullMode();
        }
    }
}
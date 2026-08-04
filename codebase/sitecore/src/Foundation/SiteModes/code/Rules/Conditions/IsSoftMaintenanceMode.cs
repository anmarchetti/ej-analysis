using System.Web.Mvc;
using easyJet.Foundation.SiteModes.Services;
using Sitecore.Rules;
using Sitecore.Rules.Conditions;

namespace easyJet.Foundation.SiteModes.Rules.Conditions
{
    public class IsSoftMaintenanceMode<T> : OperatorCondition<T>
        where T : RuleContext
    {
        private readonly ISiteModeService service;

        public IsSoftMaintenanceMode()
        {
            service = DependencyResolver.Current.GetService<ISiteModeService>();
        }

        /// <summary>
        /// Check in Soft Mode is on.
        /// </summary>
        /// <param name="ruleContext">Rule Context.</param>
        /// <returns>True if Soft Mode is on. Otherwise - false.</returns>
        protected override bool Execute(T ruleContext)
        {
            return service.IsSoftMode();
        }
    }
}
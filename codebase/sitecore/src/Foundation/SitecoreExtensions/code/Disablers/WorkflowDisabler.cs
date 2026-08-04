using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.SitecoreExtensions.Disablers.States;
using Sitecore.Common;

namespace easyJet.Foundation.SitecoreExtensions.Disablers
{
    [ExcludeFromCodeCoverage]
    public sealed class WorkflowDisabler : Switcher<WorkflowDisablerState, WorkflowDisabler>
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="WorkflowDisabler"/> class.
        /// </summary>
        public WorkflowDisabler()
        : base(WorkflowDisablerState.Enabled)
        {
        }

        /// <summary>
        /// Gets a value indicating whether this instance is active.
        /// </summary>
        public static bool IsActive => CurrentValue == WorkflowDisablerState.Enabled;
    }
}
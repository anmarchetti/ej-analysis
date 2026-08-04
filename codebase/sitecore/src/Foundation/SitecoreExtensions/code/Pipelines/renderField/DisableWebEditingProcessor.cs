using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.SitecoreExtensions.Disablers;
using Sitecore.Pipelines.RenderField;

namespace easyJet.Foundation.SitecoreExtensions.Pipelines.renderField
{
    [ExcludeFromCodeCoverage]
    public class DisableWebEditingProcessor
    {
        /// <summary>
        /// Disable WebEdit when disabler is used
        /// </summary>
        /// <param name="args">RenderFieldArgs</param>
        public void Process(RenderFieldArgs args)
        {
            if (WebEditDisabler.CurrentValue)
            {
                args.DisableWebEdit = true;
            }
        }
    }
}
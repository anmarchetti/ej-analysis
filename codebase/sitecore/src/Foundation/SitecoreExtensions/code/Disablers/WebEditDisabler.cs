using System.Diagnostics.CodeAnalysis;
using Sitecore.Common;

namespace easyJet.Foundation.SitecoreExtensions.Disablers
{
    [ExcludeFromCodeCoverage]
    public class WebEditDisabler : Switcher<bool>
    {
        public WebEditDisabler()
            : base(true)
        {
        }
    }
}

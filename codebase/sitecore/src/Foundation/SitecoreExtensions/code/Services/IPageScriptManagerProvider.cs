using Sitecore.Web.UI.HtmlControls;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    // [ExcludeFromCodeCoverage]
    public interface IPageScriptManagerProvider
    {
        PageScriptManager Current { get; }
    }
}
using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Web.UI.HtmlControls;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IPageScriptManagerProvider), Lifetime = Lifetime.Singleton)]
    public class PageScriptManagerProvider : IPageScriptManagerProvider
    {
        public PageScriptManager Current => PageScriptManager.Current;
    }
}
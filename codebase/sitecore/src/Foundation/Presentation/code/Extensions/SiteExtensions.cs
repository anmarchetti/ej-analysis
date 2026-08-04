using Sitecore.Web;

namespace easyJet.Foundation.Presentation.Extensions
{
    public static class SiteExtensions
    {
        public static string GetPresentationFolderQuery(this SiteInfo siteInfo)
        {
            return $"{siteInfo?.RootPath}/*[@@templateid ='{Templates.Presentation.Id}']";
        }

        public static string GetHideRenderingsQuery(this SiteInfo siteInfo)
        {
            return $"{siteInfo?.GetPresentationFolderQuery()}/*[@@templateid ='{Templates.HideRendering.Id}']";
        }

        public static string GetPageDesignsFolderQuery(this SiteInfo siteInfo)
        {
            return $"{siteInfo?.GetPresentationFolderQuery()}/*[@@templateid ='{Templates.PageDesignsFolder.Id}']";
        }
    }
}

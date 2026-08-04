using System.Net;
using easyJet.Foundation.Multisite.Pipelines.HttpRequestBegin;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Pipelines.HttpRequest;

namespace easyJet.Foundation.Multisite.Pipelines.MvcRequestBegin
{
    public class HandleMaintenancePageProcessor : SiteSpecificHttpRequestProcessor
    {
        public override void HandleRequest(HttpRequestArgs args)
        {
            var settings = Context.Database.SelectSingleItem($"{Context.Site.RootPath}/*[@@templateid='{Templates.Settings.Id}']");
            if (settings != null)
            {
                CheckboxField maintenancePageEnabledField = settings.Fields["Maintenance Page Enabled"];
                if (maintenancePageEnabledField.Checked)
                {
                    LookupField maintenancePageField = settings.Fields["Maintenance Page"];
                    var maintenancePage = maintenancePageField.TargetItem;

                    if (maintenancePage != null)
                    {
                        Context.Item = maintenancePage;

                        Context.Items["httpStatus"] = HttpStatusCode.OK;
                        args.HttpContext.Response.TrySkipIisCustomErrors = true;
                    }
                }
            }
        }
    }
}
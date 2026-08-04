using System.Diagnostics.CodeAnalysis;
using System.Web.Mvc;
using easyJet.Feature.ChangeTracking.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Globalization;
using Version = Sitecore.Data.Version;

namespace easyJet.Feature.ChangeTracking.Controllers
{
    [ExcludeFromCodeCoverage]
    public class ChangeTrackingController : Controller
    {
        private readonly IChangeTrackingTabContentService changeTrackingTabContentService;
        private readonly IDatabaseProvider databaseProvider;

        public ChangeTrackingController(IChangeTrackingTabContentService changeTrackingTabContentService, IDatabaseProvider databaseProvider)
        {
            this.changeTrackingTabContentService = changeTrackingTabContentService;
            this.databaseProvider = databaseProvider;
        }

        public ActionResult Index()
        {
            var uri = string.IsNullOrEmpty(Request["uri"]) ? new ItemUri(ID.Parse(Request["id"]), Language.Parse(Request["la"]), Version.Parse(Request["vs"]), Request["db"]) : ItemUri.Parse(Request["uri"]);
            var item = databaseProvider.GetItem(uri);

            if (item == null)
            {
                return new HttpNotFoundResult($"Item not found for URI: {uri}");
            }

            return Content($"<html><head><link rel=\"stylesheet\" type=\"text/css\" href=\"/sitecore modules/easyJet/changetracking/history.css\"></head><body data-uri='{item.Uri}'>" +
                           "<div id='container'></div><div id='reloadButton'>Refresh</div>" +
                           "<script src='/sitecore modules/easyJet/changetracking/moment.js'></script>" +
                           "<script src='/sitecore modules/easyJet/changetracking/jsdiff.js'></script>" +
                           "<script src='/sitecore modules/easyJet/changetracking/history.js'></script>" +
                           "</body></html>");
        }

        public ActionResult Data()
        {
            var itemUri = ItemUri.Parse(Request["uri"]);
            return Json(changeTrackingTabContentService.GetModels(itemUri), JsonRequestBehavior.AllowGet);
        }
    }
}

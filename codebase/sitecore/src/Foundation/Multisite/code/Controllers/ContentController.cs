using System;
using System.Web.Mvc;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;

namespace easyJet.Foundation.Multisite.Controllers
{
    public class ContentController : BaseServicesApiController
    {
        private readonly IContentService service;

        public ContentController(IContentService service)
        {
            this.service = service;
        }

        [HttpGet]
        public ActionResult ByPath(string path, bool withChildren = false, bool readAll = false)
        {
            if (string.IsNullOrEmpty(path))
            {
                throw new ArgumentException($"Argument {path} cannot be null or empty");
            }

            var content = service.GetContentByPath(path, withChildren, readAll);
            return Json(content, JsonRequestBehavior.AllowGet);
        }
    }
}
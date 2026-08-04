using System;
using System.Web.Mvc;
using easyJet.Foundation.SitecoreExtensions.Logger;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.SitecoreExtensions.Controllers
{
    public class BaseServicesApiController : Controller
    {
        public BaseServicesApiController()
        {
        }

        public BaseServicesApiController(ILogger logger)
        {
           Logger = logger;
        }

        protected ILogger Logger { get; private set; }

        /// <summary>
        /// Method lets return Json response which length equals to int.MaxValue.
        /// </summary>
        /// <param name="data">Objects to serialize to Json.</param>
        /// <param name="behavior">Specifies whether HTTP GET requests from the client are allowed.</param>
        /// <returns>Json object.</returns>
        public JsonResult UnlimitedJson(object data, JsonRequestBehavior behavior)
        {
            return new JsonResult()
            {
                Data = data,
                JsonRequestBehavior = behavior,
                MaxJsonLength = int.MaxValue
            };
        }

        /// <summary>
        /// Method lets return excel file.
        /// </summary>
        /// <param name="data">Excel data.</param>
        /// <param name="fileName">Name of excel file.</param>
        /// <returns>Excel file.</returns>
        public FileContentResult ExcelFile(byte[] data, string fileName)
        {
            return File(data, Constants.ContentTypes.ExcelResponse, $"{fileName}_{DateTime.UtcNow.ToShortDateString()}.csv");
        }

        /// <summary>
        /// Logs exception depending on custom logger exists or not.
        /// </summary>
        /// <param name="exceptionMessage">Exception message.</param>
        /// <param name="exception">Exception object.</param>
        private void LogException(string exceptionMessage, Exception exception)
        {
            if (Logger != null)
            {
                Logger.Error(exceptionMessage, exception, this);
            }
            else
            {
                Log.Error(exceptionMessage, exception, this);
            }
        }
    }
}
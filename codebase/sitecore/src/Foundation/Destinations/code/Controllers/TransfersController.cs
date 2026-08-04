using System;
using System.Linq;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.SitecoreExtensions.Controllers;

namespace easyJet.Foundation.Destinations.Controllers
{
    public class TransfersController : BaseServicesApiController
    {
        private readonly ITransferInfoRepository transferInfoRepository;

        public TransfersController(ITransferInfoRepository transferInfoRepository, IDestinationsLogger logger)
            : base(logger)
        {
            this.transferInfoRepository = transferInfoRepository;
        }

        /// <summary>
        /// Get holidays transfer info by product id.
        /// </summary>
        /// <param name="productId">Product id.</param>
        /// <returns>Return transfer info in JSON format.</returns>
        [HttpGet]
        public ActionResult GetHolidayTransferByProductId(string productId)
        {
            if (string.IsNullOrWhiteSpace(productId))
            {
                throw new ArgumentException($"Arguments {nameof(productId)} cannot be null.");
            }

            var searchResults = transferInfoRepository.GetTransfersByProductIds(new string[] { productId });
            var transferInfo = searchResults.Hits.Select(x => new HolidayTransferModel
            {
                ArrivalInstr = x.Document.ArrivalInstr,
                DepInstr = x.Document.DepInstr,
                Lang = x.Document.Language,
                Duration = x.Document.Duration,
            }).FirstOrDefault();

            return Json(transferInfo, JsonRequestBehavior.AllowGet);
        }

        public class HolidayTransferModel
        {
            public string ArrivalInstr { get; set; }

            public string DepInstr { get; set; }

            public string Lang { get; set; }

            public int Duration { get; set; }
        }
    }
}
using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Results;
using easyJet.Foundation.SitecoreExtensions.Cache.Providers;
using easyJet.Foundation.SitecoreExtensions.Logging;
using easyJet.Foundation.SitecoreExtensions.Models;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.Maintenance;
using Sitecore.Data;

namespace easyJet.Foundation.SitecoreExtensions.Controllers
{
    [RoutePrefix("api/utilities")]
    public class UtilitiesController : BaseServicesApiController
    {
        private readonly ISitecoreExtensionsLogger logger;

        public UtilitiesController()
        {
        }

        public UtilitiesController(ISitecoreExtensionsLogger logger)
        {
            this.logger = logger;
        }

        /// <summary>
        /// Run index rebuild and return job id.
        /// </summary>
        /// <param name="indexName">Index name.</param>
        /// <returns>Job id.</returns>
        [HttpGet]
        [Route("indexrebuild")]
        public string IndexRebuild(string indexName)
        {
            try
            {
                var index = ContentSearchManager.GetIndex(indexName);
                if (index != null)
                {
                    var job = IndexCustodian.FullRebuild(index, true);
                    var jobId = $"{job.Name}-{job.QueueTime.Ticks}";
                    return jobId;
                }
                else
                {
                    return $"Index {indexName} was not found.";
                }
            }
            catch (Exception exc)
            {
                Sitecore.Diagnostics.Log.Error($"[Utilities IndexRebuild]: Fail while rebuilding {indexName} index. {exc.Message}", exc, this);
                return $"Fail while rebuilding {indexName} index.";
            }
        }

        /// <summary>
        /// Get Job status by JobId.
        /// </summary>
        /// <param name="jobId">Job id.</param>
        /// <returns>Job status.</returns>
        [HttpGet]
        [Route("GetJobStatus")]
        public string GetJobStatus(string jobId)
        {
            try
            {
                // Sitecore JobName can be not unique, so JobId consists of JobName and JobTicks.
                var jobIdSegments = jobId.Split('-');
                var jobName = jobIdSegments.FirstOrDefault();
                BaseJob job;

                // If JobId contains JobTicks.
                if (jobIdSegments.Length > 1)
                {
                    var jobTicks = long.Parse(jobIdSegments[1]);
                    job = Sitecore.Jobs.JobManager.GetJobs().FirstOrDefault(x => x.QueueTime.Ticks == jobTicks && x.Name == jobName);
                }

                // If JobId contains only JobName.
                else
                {
                    job = Sitecore.Jobs.JobManager.GetJobs().FirstOrDefault(x => x.Name == jobName);
                }

                return job?.Status.State.ToString() ?? $"Job {jobId} was not found.";
            }
            catch (Exception exc)
            {
                Sitecore.Diagnostics.Log.Error($"[Utilities GetJobStatus]: Fail while get job {jobId}. {exc.Message}", exc, this);
                return $"Fail while get job {jobId}.";
            }
        }

        /// <summary>
        /// Sets item's sortorder by item id.
        /// </summary>
        /// <param name="sortItems">SortItems parameters.</param>
        /// <returns>Status code.</returns>
        [HttpPost]
        [Route("SortItems")]
        public HttpResponseMessage SortItems(SortItems sortItems)
        {
            if (sortItems?.ItemIds == null || sortItems.SortOrders == null)
            {
                return new HttpResponseMessage(HttpStatusCode.BadRequest);
            }

            var itemsAndOrders = sortItems.ItemIds.Zip(
                sortItems.SortOrders,
                (i, o) => new { SItem = Context.Database.GetItem(new ID(i)), Order = o });

            using (new BulkUpdateContext())
            {
                foreach (var itemAndOrder in itemsAndOrders)
                {
                    try
                    {
                        itemAndOrder.SItem.Editing.BeginEdit();
                        itemAndOrder.SItem.Fields[FieldIDs.Sortorder].Value = itemAndOrder.Order;
                        itemAndOrder.SItem.Editing.EndEdit();
                    }
                    catch (Exception ex)
                    {
                        itemAndOrder.SItem.Editing.CancelEdit();
                        logger.Error($"Error is thrown while change order of item with ID: {itemAndOrder.SItem.ID} attempt", ex, this);
                    }
                }
            }

            return new HttpResponseMessage(HttpStatusCode.NoContent);
        }

        /// <summary>
        /// Delete items by item id.
        /// </summary>
        /// <param name="itemIds">Collection of Item Id's parameters.</param>
        /// <returns>Status code.</returns>
        [HttpPost]
        [Route("DeleteItems")]
        public HttpResponseMessage DeleteItems(string[] itemIds)
        {
            var items = itemIds.Select(x => Context.Database.GetItem(new ID(x)));

            using (new BulkUpdateContext())
            {
                foreach (var item in items)
                {
                    try
                    {
                        item.Recycle();
                    }
                    catch (Exception ex)
                    {
                        logger.Error($"Error is thrown while deleting item with ID: {item.ID}", ex, this);
                    }
                }
            }

            return new HttpResponseMessage(HttpStatusCode.NoContent);
        }

        [HttpPost]
        [Route("ClearCustomCacheProvider")]
        public HttpResponseMessage ClearCustomCacheProvider()
        {
            CustomCacheProvider.Clear();
            return new HttpResponseMessage(HttpStatusCode.NoContent);
        }
    }
}
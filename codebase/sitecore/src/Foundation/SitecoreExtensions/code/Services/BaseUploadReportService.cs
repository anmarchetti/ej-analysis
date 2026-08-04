using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Logger;
using Sitecore.Data;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    public abstract class BaseUploadReportService<TModel, TRecord>
    {
        private readonly ILogger logger;
        private readonly IReportRepository<TRecord> reportRepository;

        protected BaseUploadReportService(IReportRepository<TRecord> reportRepository, ILogger logger)
        {
            this.reportRepository = reportRepository;
            this.logger = logger;
        }

        /// <summary>
        /// Add report records.
        /// </summary>
        /// <param name="uploadedData">Collection of uploaded data.</param>
        /// <param name="message">Reason message.</param>
        protected void AddRecords(IEnumerable<TModel> uploadedData, string message)
        {
            using (new BulkUpdateContext())
            {
                foreach (var uploadedItem in uploadedData)
                {
                    AddRecord(uploadedItem, message);
                }
            }
        }

        /// <summary>
        /// Add report record.
        /// </summary>
        /// <param name="uploadedItem">Uploaded item.</param>
        /// <param name="message">Reason message.</param>
        protected void AddRecord(TModel uploadedItem, string message)
        {
            reportRepository.Add(BuildReportRecord(uploadedItem, message));
            logger.Warn(BuildLogRecord(uploadedItem, message), this);
        }

        /// <summary>
        /// Build report record model.
        /// </summary>
        /// <param name="uploadedItem">Uploaded item model.</param>
        /// <param name="message">Reason message.</param>
        /// <returns>Record model.</returns>
        protected abstract TRecord BuildReportRecord(TModel uploadedItem, string message);

        /// <summary>
        /// Build message to log.
        /// </summary>
        /// <param name="uploadedItem">Uploaded item model.</param>
        /// <param name="message">Reason message.</param>
        /// <returns>Log message.</returns>
        protected abstract string BuildLogRecord(TModel uploadedItem, string message);
    }
}
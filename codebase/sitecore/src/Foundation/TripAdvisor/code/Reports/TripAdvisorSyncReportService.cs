using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using CsvHelper;
using CsvHelper.Configuration;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.TripAdvisor.Logging;
using easyJet.Foundation.TripAdvisor.Models;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.TripAdvisor.Reports
{
    [Service(typeof(ITripAdvisorSyncReportService), Lifetime = Lifetime.Singleton)]
    public class TripAdvisorSyncReportService : ITripAdvisorSyncReportService
    {
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IDatabaseProvider databaseProvider;
        private readonly BaseMediaManager mediaManager;
        private readonly ITripAdvisorLogger logger;

        public TripAdvisorSyncReportService(
            IDatasourceRepository datasourceRepository,
            IDatabaseProvider databaseProvider,
            BaseMediaManager mediaManager,
            ITripAdvisorLogger logger)
        {
            this.datasourceRepository = datasourceRepository;
            this.databaseProvider = databaseProvider;
            this.mediaManager = mediaManager;
            this.logger = logger;
        }

        public void CreateReport(IEnumerable<SyncResult> failedResults)
        {
            var records = failedResults
                .Where(r => r.Error != null)
                .Select(r => new TripAdvisorSyncRecord
                {
                    HotelItemId = r.Item?.ID?.ToString(),
                    HotelName = r.Item?.Name,
                    TripAdvisorId = r.Item?[Destinations.Constants.Fields.AccommodationItem.TripAdvisorId],
                    ErrorCode = r.Error.Code,
                    ErrorType = r.Error.Type,
                    ErrorMessage = r.Error.Message
                })
                .ToList();

            if (!records.Any())
            {
                logger.Info("No failed sync results to report", this);
                return;
            }

            var reportFolder = GetOrCreateReportFolder();
            if (reportFolder == null)
            {
                logger.Warn("TripAdvisor sync report folder not found. Check TripAdvisor.SyncReportPath setting.", this);
                return;
            }

            var reportName = $"{DateTime.Now:yyyyMMdd-HHmmss}";
            try
            {
                var reportItem = datasourceRepository.GetOrCreateItem(reportName, TemplateIDs.UnversionedFile, reportFolder);
                var mediaItem = (MediaItem)reportItem;
                var media = mediaManager.GetMedia(mediaItem);
                var configuration = new Configuration { Delimiter = "," };

                using (var stream = new MemoryStream())
                using (var writer = new StreamWriter(stream))
                using (var csv = new CsvWriter(writer, configuration))
                {
                    csv.WriteHeader<TripAdvisorSyncRecord>();
                    csv.NextRecord();

                    foreach (var record in records)
                    {
                        csv.WriteRecord(record);
                        csv.NextRecord();
                    }

                    csv.Flush();
                    writer.Flush();
                    stream.Position = 0;
                    media.SetStream(stream, "csv");
                }

                logger.Info($"TripAdvisor sync report saved to {reportItem.Paths.FullPath} ({records.Count} failures)", this);
            }
            catch (Exception ex)
            {
                logger.Error("Failed to create TripAdvisor sync report", ex, this);
            }
        }

        internal Item GetOrCreateReportFolder()
        {
            var reportPath = Sitecore.Configuration.Settings.GetSetting(TripAdvisor.Constants.Settings.SyncReportPath);
            if (string.IsNullOrEmpty(reportPath))
            {
                return null;
            }

            var existing = databaseProvider.GetItem(reportPath, DatabaseType.Master);
            if (existing != null)
            {
                return existing;
            }

            var mediaLibrary = databaseProvider.GetItem(ItemIDs.MediaLibraryRoot, DatabaseType.Master);
            if (mediaLibrary == null)
            {
                return null;
            }

            var relativePath = reportPath
                .Replace(mediaLibrary.Paths.FullPath, string.Empty)
                .TrimStart('/');

            var current = mediaLibrary;
            using (new SecurityDisabler())
            {
                foreach (var segment in relativePath.Split('/'))
                {
                    if (string.IsNullOrWhiteSpace(segment))
                    {
                        continue;
                    }

                    var child = current.Children[segment];
                    current = child ?? current.Add(segment, new TemplateID(TemplateIDs.MediaFolder));
                }
            }

            return current;
        }
    }
}

using System.Linq;
using System.Text;
using easyJet.Foundation.Publishing.Logging;
using Sitecore.Publishing.Service.Pipelines.BulkPublishingEnd;

namespace easyJet.Foundation.Publishing.Pipelines
{
    public class LogPublishingEndProcessor
    {
        private readonly IPublishingLogger logger;

        public LogPublishingEndProcessor(IPublishingLogger logger)
        {
            this.logger = logger;
        }

        public void Process(PublishEndResultBatchArgs args)
        {
            if (args?.Batch == null || args.Aborted || args.Suspended || args.Batch.Length == 0)
            {
                return;
            }

            var jobData = args.JobData;
            var languages = jobData?.LanguageNames != null
                ? string.Join(", ", jobData.LanguageNames)
                : "N/A";
            var distinctCount = args.Batch.Select(manifestOperationResult => manifestOperationResult.EntityId).Distinct().Count();

            var sb = new StringBuilder();
            var targetInfo = args.TargetInfo;
            var metadata = jobData?.Metadata != null
                ? string.Join(", ", jobData.Metadata.Select(kv => $"{kv.Key}={kv.Value}"))
                : "N/A";

            sb.AppendLine($"Publish batch completed | JobId: {jobData?.JobId} | ManifestId: {targetInfo?.ManifestId} | User: {jobData?.Username} | PublishDate: {jobData?.PublishDate:u} | Type: {jobData?.PublishType} | Descendants: {jobData?.IncludeDescendants} | CompareRevisions: {jobData?.CompareRevisions}");
            sb.AppendLine($"  Root: {jobData?.ItemId} | Languages: {languages} | Source: {jobData?.SourceDatabaseName} | Target: {targetInfo?.TargetDatabaseName} ({targetInfo?.TargetName}, {targetInfo?.TargetId}) | Succeeded: {targetInfo?.Succeeded} | Items: {args.Batch.Length} raw, {distinctCount} distinct");
            sb.AppendLine($"  Metadata: {metadata}");

            foreach (var manifestOperationResult in args.Batch)
            {
                var propertyChanges = manifestOperationResult.Metadata?.PropertyChanges?.Current;
                var properties = propertyChanges != null
                    ? $"Name: {propertyChanges.Name} | Template: {propertyChanges.TemplateId} | Parent: {propertyChanges.ParentId}"
                    : "(no properties)";
                sb.AppendLine($"  [{manifestOperationResult.Metadata?.ChangeType}] [{manifestOperationResult.Type}] {manifestOperationResult.EntityId} | {properties}");
            }

            logger.Info(sb.ToString(), this);
        }
    }
}

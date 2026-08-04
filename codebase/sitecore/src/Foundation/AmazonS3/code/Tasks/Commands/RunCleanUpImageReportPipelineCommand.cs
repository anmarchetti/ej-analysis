using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Sitecore.Data.Items;
using Sitecore.Pipelines;
using Sitecore.Tasks;

namespace easyJet.Foundation.AmazonS3.Tasks.Commands
{
    [ExcludeFromCodeCoverage]
    public class RunCleanUpImageReportPipelineCommand
    {
        /// <summary>
        /// Run AmazonS3CleanUpImagesReportPipeline pipeline.
        /// </summary>
        /// <param name="items">Root Items.</param>
        /// <param name="commandItem">Command Item.</param>
        /// <param name="scheduleItem">Schedule Item.</param>
        public void Execute(Item[] items, CommandItem commandItem, ScheduleItem scheduleItem)
        {
            CorePipeline.Run("AmazonS3CleanUpImagesReportPipeline", new PipelineArgs() { ProcessorItem = items.FirstOrDefault() });
        }
    }
}
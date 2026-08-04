using Sitecore.Data.Items;
using Sitecore.Pipelines;
using Sitecore.Tasks;

namespace easyJet.Foundation.Destinations.Tasks.Commands
{
    public class RunCleanUpReportsPipelineCommand
    {
        /// <summary>
        /// Run CleanUpReportsPipeline pipeline.
        /// </summary>
        /// <param name="items">Root Items.</param>
        /// <param name="commandItem">Command Item.</param>
        /// <param name="scheduleItem">Schedule Item.</param>
        public void Execute(Item[] items, CommandItem commandItem, ScheduleItem scheduleItem)
        {
            foreach (var item in items)
            {
                CorePipeline.Run("CleanUpReportsPipeline", new PipelineArgs() { ProcessorItem = item });
            }
        }
    }
}
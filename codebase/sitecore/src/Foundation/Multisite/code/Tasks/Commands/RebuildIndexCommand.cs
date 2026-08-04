using Sitecore.Data.Items;
using Sitecore.Pipelines;
using Sitecore.Tasks;

namespace easyJet.Foundation.Multisite.Tasks.Commands
{
    public class RebuildIndexCommand
    {
        public void Execute(Item[] items, CommandItem command, ScheduleItem schedule)
        {
            if (schedule?.InnerItem?.Template.ID == Templates.IndexRebuildSchedule.Id)
            {
                CorePipeline.Run("RebuildIndex", new PipelineArgs() { ProcessorItem = schedule?.InnerItem });
            }
        }
    }
}
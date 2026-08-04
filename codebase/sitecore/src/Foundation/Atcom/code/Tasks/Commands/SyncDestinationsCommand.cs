using System.Linq;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using Sitecore.Data.Items;
using Sitecore.Pipelines;
using Sitecore.Tasks;

namespace easyJet.Foundation.Atcom.Tasks.Commands
{
    /// <summary>
    /// Command that runs AtcomDestinationsSynciPeline.
    /// </summary>
    public class SyncDestinationsCommand
    {
        /// <summary>
        /// Sync Countries, Regions, Resorts and Hotels from ATcom.
        /// </summary>
        /// <param name="items">Sitecore items.</param>
        /// <param name="command">Command item.</param>
        /// <param name="schedule">Schedule Item.</param>
        public void Execute(Item[] items, CommandItem command, ScheduleItem schedule)
        {
            CorePipeline.Run("AtcomDestinationsSyncPipeline", new DestinationPipelineArgs() { Parent = items.FirstOrDefault(), LastUpdateTime = schedule.LastRun });
        }
    }
}
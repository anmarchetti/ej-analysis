using System.Linq;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using Sitecore.Data.Items;
using Sitecore.Pipelines;
using Sitecore.Tasks;

namespace easyJet.Foundation.TripAdvisor.Tasks.Commands
{
    public class SyncReviewsCommand
    {
        /// <summary>
        /// Updates current Hotels with Data from TripAdvisor.
        /// </summary>
        /// <param name="items">Sitecore items.</param>
        /// <param name="command">Command item.</param>
        /// <param name="schedule">Schedule Item.</param>
        public void Execute(Item[] items, CommandItem command, ScheduleItem schedule)
        {
            CorePipeline.Run("TripAdvisorReviewUpdateSyncPipeline", new DestinationPipelineArgs() { Parent = items.FirstOrDefault(), LastUpdateTime = schedule.LastRun });
        }
    }
}
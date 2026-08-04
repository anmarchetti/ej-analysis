using System.Linq;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using Sitecore.Data.Items;
using Sitecore.Pipelines;
using Sitecore.Tasks;

namespace easyJet.Foundation.Atcom.Tasks.Commands
{
    /// <summary>
    /// Command that runs AtcomRoomTypesSyncPipline.
    /// </summary>
    public class SyncRoomTypesCommand
    {
        /// <summary>
        /// Sync RoomTypes from ATcom.
        /// </summary>
        /// <param name="items">Sitecore items.</param>
        /// <param name="command">Command item.</param>
        /// <param name="schedule">Schedule Item.</param>
        public void Execute(Item[] items, CommandItem command, ScheduleItem schedule)
        {
            CorePipeline.Run("AtcomRoomTypesSyncPipeline", new DestinationPipelineArgs() { Parent = items.FirstOrDefault(), LastUpdateTime = schedule.LastRun });
        }
    }
}
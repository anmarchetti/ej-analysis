using System.Linq;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.Pipelines;
using Sitecore.Security.Accounts;
using Sitecore.Tasks;

namespace easyJet.Foundation.Atcom.Tasks.Commands
{
    public class SyncRoomTypeFacilitiesCommand
    {
        public void Execute(Item[] items, CommandItem command, ScheduleItem schedule)
        {
            var imageFixerUser = User.FromName(Settings.GetSetting("Atcom.AtcomRoomSync"), false) ?? Sitecore.Context.User;
            using (new UserSwitcher(imageFixerUser))
            {
                CorePipeline.Run("AtcomRoomTypeFacilitiesSyncPipeline", new DestinationPipelineArgs() { Parent = items.FirstOrDefault(), LastUpdateTime = schedule.LastRun });
            }
        }
    }
}
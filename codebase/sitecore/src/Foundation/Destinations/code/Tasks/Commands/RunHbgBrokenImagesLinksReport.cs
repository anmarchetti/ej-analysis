using System.Diagnostics.CodeAnalysis;
using System.Linq;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using Sitecore.Data.Items;
using Sitecore.Pipelines;
using Sitecore.Tasks;

namespace easyJet.Foundation.Destinations.Tasks.Commands
{
    [ExcludeFromCodeCoverage]
    public class RunHbgBrokenImagesLinksReport
    {
        /// <summary>
        /// Create broken images links report for HBG images
        /// </summary>
        /// <param name="items">Sitecore items.</param>
        /// <param name="command">Command item.</param>
        /// <param name="schedule">Schedule Item.</param>
 #pragma warning disable S2325 // Methods and properties that don't access instance data should be static
        public void Execute(Item[] items, CommandItem command, ScheduleItem schedule)
        {
            CorePipeline.Run("HbgBrokenImagesLinksReport", new DestinationPipelineArgs() { Parent = items.FirstOrDefault() });
        }
#pragma warning restore S2325
    }
}
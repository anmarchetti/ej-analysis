using System.Diagnostics.CodeAnalysis;
using Sitecore.Data.Items;
using Sitecore.Pipelines;
using Sitecore.Tasks;

namespace easyJet.Foundation.BeCause.Commands
{
    [ExcludeFromCodeCoverage]
    public class SyncEcoCertificatesCommand
    {
#pragma warning disable S2325 // Methods and properties that don't access instance data should be static
        public void Execute(Item[] items, CommandItem commandItem, ScheduleItem scheduleItem)
        {
            CorePipeline.Run("SyncEcoCertificatesPipeline", new PipelineArgs());
        }
#pragma warning restore S2325
    }
}

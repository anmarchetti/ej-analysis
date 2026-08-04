namespace easyJet.Foundation.Multisite.Pipelines.PushCloneChanges
{
    public abstract class PushCloneChangesProcessorBase
    {
        public abstract void Process(PushCloneChangesArgs args);
    }
}
namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public class StandardCreateResolveItemResultProcessor : CreateResolveItemResultProcessor
    {
        public override void Process(CreateResolveItemResultArgs args)
        {
            if (args.Result != null)
            {
                return;
            }

            var isValidItem = PipelineExecutionWrapper(new IsValidItemArgs(args.Item, args.Settings));
            args.Result = isValidItem ? new ResolveItemResult(args.Item) : ResolveItemResult.NoItemFound;
        }

        public virtual bool PipelineExecutionWrapper(IsValidItemArgs args)
        {
            return IsValidItem.RunPipeline(args);
        }
    }
}
namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public class StandardValidatorResultProcessor : CreateResolveItemResultProcessor
    {
        public override void Process(CreateResolveItemResultArgs args)
        {
            if (args.Result.Item == null)
            {
                return;
            }

            var isValidItem = PipelineExecutionWrapper(new IsValidItemArgs(args.Result.Item, args.Settings));
            if (!isValidItem)
            {
                args.Result = ResolveItemResult.NoItemFound;
            }
        }

        public virtual bool PipelineExecutionWrapper(IsValidItemArgs args)
        {
            return IsValidItem.RunPipeline(args);
        }
    }
}
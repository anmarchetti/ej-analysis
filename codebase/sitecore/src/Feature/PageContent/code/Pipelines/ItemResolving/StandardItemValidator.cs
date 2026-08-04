namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public class StandardItemValidator : IsValidItemProcessor
    {
        public override void Process(IsValidItemArgs args)
        {
            args.Result = !args.Settings.RequireLanguageVersion || args.Item.Versions.Count > 0;
        }
    }
}
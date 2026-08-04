using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Pipelines.PushCloneChanges
{
    public class ResetFields : PushCloneChangesProcessorBase
    {
        /// <summary>
        /// Reset fields for cloned item.
        /// </summary>
        /// <param name="args">PushCloneChangesArgs args.</param>
        public override void Process(PushCloneChangesArgs args)
        {
            foreach (FieldChange fieldChange in args.Changes.FieldChanges)
            {
                Field field = args.Clone.Fields[fieldChange.FieldID];
                args.Clone.Editing.BeginEdit();
                field.Reset();
                args.Clone.Editing.EndEdit();
            }
        }
    }
}
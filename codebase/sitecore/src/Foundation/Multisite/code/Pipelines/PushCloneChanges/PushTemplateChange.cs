using Sitecore.Data;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.Multisite.Pipelines.PushCloneChanges
{
    public class PushTemplateChange : PushCloneChangesProcessorBase
    {
        protected const string TemplateIdKey = "templateid";

        /// <summary>
        /// Update cloned templated if source template has been changed.
        /// </summary>
        /// <param name="args">PushCloneChangesArgs args.</param>
        public override void Process(PushCloneChangesArgs args)
        {
            if (!args.Changes.Properties.ContainsKey(TemplateIdKey))
            {
                return;
            }

            using (new SecurityDisabler())
            {
                args.Clone.Editing.BeginEdit();
                args.Clone.TemplateID = (ID)args.Changes.Properties[TemplateIdKey].Value;
                args.Clone.Editing.EndEdit();
            }
        }
    }
}
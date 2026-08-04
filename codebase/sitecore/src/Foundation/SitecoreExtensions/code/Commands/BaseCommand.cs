using System.Runtime.CompilerServices;
using Sitecore;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;

[assembly: InternalsVisibleTo("easyJet.Foundation.SitecoreExtensions.Tests")]

namespace easyJet.Foundation.SitecoreExtensions.Commands
{
    public abstract class BaseCommand : Command
    {
        /// <inheritdoc />
        public override CommandState QueryState(CommandContext context)
        {
            if (context.Items.Length > 0 && IsCommandContextValid(context) && !IsItemCloned(context))
            {
                return base.QueryState(context);
            }

            return CommandState.Hidden;
        }

        /// <inheritdoc />
        public override void Execute(CommandContext context)
        {
            Context.ClientPage.Start(this, nameof(ExecuteJob), InitalizeClientPipelineArgs(context));
        }

        /// <summary>
        /// Validate command context QueryState.
        /// </summary>
        /// <param name="context">CommandContext.</param>
        /// <returns>bool.</returns>
        protected internal abstract bool IsCommandContextValid(CommandContext context);

        /// <summary>
        /// Initialize ClientPipelineArgs from CommandContext.
        /// </summary>
        /// <param name="context">CommandContext.</param>
        /// <returns>ClientPipelineArgs.</returns>
        protected internal ClientPipelineArgs InitalizeClientPipelineArgs(CommandContext context)
        {
            var sourceItem = context.Items[0];
            var args = new ClientPipelineArgs();

            args.Parameters.Add(SourceId, sourceItem.ID.ToString());
            args.Parameters.Add(SourceLanguage, sourceItem.Language.ToString());

            SetClientPipelineArgs(context);

            return args;
        }

        protected const string SourceId = "id";
        protected const string SourceLanguage = "language";

        protected static bool IsItemCloned(CommandContext context)
        {
            return context.Items[0].IsItemClone;
        }

        /// <summary>
        /// Execute command within the Sheer UI pipeline.
        /// </summary>
        /// <param name="args">ClientPipelineArgs.</param>
        protected abstract void ExecuteJob(ClientPipelineArgs args);

        /// <summary>
        /// Set ClientPipelineArgs from CommandContext.
        /// </summary>
        /// <param name="context">CommandContext.</param>
        protected virtual void SetClientPipelineArgs(CommandContext context)
        {
        }
    }
}

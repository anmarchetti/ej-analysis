using System;
using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using Sitecore.Shell.Framework.Commands;

[assembly: InternalsVisibleTo("easyJet.Feature.SitecoreEnhancment.Tests")]

namespace easyJet.Foundation.SitecoreExtensions.Commands
{
    [ExcludeFromCodeCoverage]
    public abstract class BaseSubMenuContainerCommand : Command
    {
        protected const string SourceId = "id";

        public override void Execute(CommandContext context)
        {
            throw new NotImplementedException();
        }

        /// <inheritdoc />
        public override CommandState QueryState(CommandContext context)
        {
            if (context.Items.Length > 0 && IsCommandContextValid(context) && !IsItemCloned(context))
            {
                return base.QueryState(context);
            }

            return CommandState.Hidden;
        }

        public override string GetClick(CommandContext context, string click) => string.Empty;

        protected internal abstract bool IsCommandContextValid(CommandContext context);

        protected bool IsItemCloned(CommandContext context)
        {
            return context.Items[0].IsItemClone;
        }
    }
}
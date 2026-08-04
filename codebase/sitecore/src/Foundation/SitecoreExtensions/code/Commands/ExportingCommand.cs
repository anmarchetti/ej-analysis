using System.Linq;
using System.Runtime.CompilerServices;
using easyJet.Foundation.SitecoreExtensions.Configuration;
using easyJet.Foundation.SitecoreExtensions.Logger;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Text;
using Sitecore.Web;

[assembly: InternalsVisibleTo("easyJet.Foundation.Destinations.Tests")]

namespace easyJet.Foundation.SitecoreExtensions.Commands
{
    public class ExportingCommand : Command
    {
        private const string EmptyEndpointWarn = "Command cannot be executed due to configuration issue";

        protected ISitecoreUIService SitecoreUIService { get; }

        private readonly ILogger logger;

        protected ExportingCommand(ISitecoreUIService sitecoreUIService, ILogger logger)
        {
            SitecoreUIService = sitecoreUIService;
            this.logger = logger;
        }

        protected virtual ExportingCommandParam Settings => ExportingCommandParamConfiguration.GetItemByCommandName(Name);

        /// <summary>
        /// Hide or show command in context menu.
        /// </summary>
        /// <param name="context">Context item.</param>
        /// <returns>Command state.</returns>
        public override CommandState QueryState(CommandContext context)
        {
            var item = context.Items.FirstOrDefault();

            if (item == null)
            {
                return CommandState.Hidden;
            }

            return item.TemplateID.Equals(Settings?.TemplateId) && IsCommandContextValid(context) && !IsItemClone(context) ? base.QueryState(context) : CommandState.Hidden;
        }

        /// <summary>
        /// Execute command if param endpoint exist.
        /// </summary>
        /// <param name="context">Context item.</param>
        public override void Execute(CommandContext context)
        {
            var item = context.Items.FirstOrDefault();
            var endpoint = context.Parameters.Get(Constants.QueryStringParams.Endpoint);

            if (item == null || string.IsNullOrEmpty(endpoint))
            {
                logger.Warn(EmptyEndpointWarn, this);
                SitecoreUIService.SheerResponse_ShowError("Configuration issue", EmptyEndpointWarn);
                return;
            }

            OpenNewWindow(item.ID, endpoint, item.Language.Name, item.Database.Name);
        }

        /// <summary>
        /// Default command validator.
        /// </summary>
        /// <param name="context">Context item.</param>
        /// <returns>Command valid result.</returns>
        protected internal virtual bool IsCommandContextValid(CommandContext context)
        {
            return true;
        }

        /// <summary>
        /// Open new browser window.
        /// </summary>
        /// <param name="id">Item id.</param>
        /// <param name="endpoint">Endpoint url.</param>
        /// <param name="lang">Item language.</param>
        /// <param name="db">Db name.</param>
        protected void OpenNewWindow(ID id, string endpoint, string lang, string db)
        {
            var urlWithParameters = WebUtil.AddQueryString(
                                                           endpoint,
                                                           Constants.QueryStringParams.ItemId,
                                                           id.ToString(),
                                                           Constants.QueryStringParams.Language,
                                                           lang,
                                                           Constants.QueryStringParams.DataBase,
                                                           db);
            var url = new UrlString(urlWithParameters);
            SitecoreUIService.SheerResponse_Eval($"window.open('{url}');");
        }

        /// <summary>
        /// Checks if the item is a clone.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <returns>true if this entire item is a clone; otherwise, false.</returns>
        protected bool IsItemClone(CommandContext context)
        {
            return context.Items[0].IsItemClone;
        }
    }
}
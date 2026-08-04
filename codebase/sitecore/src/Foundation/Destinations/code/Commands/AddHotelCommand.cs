using System;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.Destinations.Commands
{
    public class AddHotelCommand : BaseAsyncCommand
    {
        private const string SourceName = "name";

        private readonly IDatasourceRepository datasourceRepository;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IDestinationsLogger logger;
        private readonly ISitecoreUIService sitecoreUIService;

        private string HotelBranchTemplatePath { get; }

        public AddHotelCommand(
            IDatasourceRepository datasourceRepository,
            IDatabaseProvider databaseProvider,
            IDestinationsLogger logger,
            IUserCreationService userCreationService,
            BaseSettings settings,
            ISitecoreUIService sitecoreUIService)
            : base(userCreationService)
        {
            this.datasourceRepository = datasourceRepository;
            this.databaseProvider = databaseProvider;
            this.logger = logger;
            this.sitecoreUIService = sitecoreUIService;
            HotelBranchTemplatePath = settings.GetSetting("Destinations.HotelBranchTemplatePath");
        }

        protected override string CommandTitle => "Hotel Creation";

        protected override void Action(ClientPipelineArgs args)
        {
            var name = args.Parameters[SourceName];

            try
            {
                var resort = databaseProvider.GetDatabase(DatabaseType.Content).GetItem(new ID(args.Parameters[SourceId]));
                var branchItem = databaseProvider.GetDatabase(DatabaseType.Content).GetItem(HotelBranchTemplatePath);
                datasourceRepository.GetOrCreateFromHotelBranchTemplate(name, resort, branchItem);
            }
            catch (Exception exc)
            {
                logger.Error($"Error occured while creating '{name}' hotel", exc, this);
                throw;
            }
        }

        protected override bool IsCommandContextValid(CommandContext context)
        {
            return context.Items[0].TemplateID.Equals(Constants.TemplateIds.Resort);
        }

        protected override void PostAction(ClientPipelineArgs args)
        {
            sitecoreUIService.ClientPage_SendMessage(this, $"item:refreshchildren(id={args.Parameters[SourceId]})");
        }

        protected override void ExecuteJob(ClientPipelineArgs args)
        {
            if (!args.IsPostBack)
            {
                sitecoreUIService.SheerResponse_Input("Please specify the name of new Hotel", string.Empty);
                args.WaitForPostBack();
                return;
            }

            if (!args.HasResult)
            {
                return;
            }

            args.Parameters.Add(SourceName, args.Result);
            base.ExecuteJob(args);
        }
    }
}
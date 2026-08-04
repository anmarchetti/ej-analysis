using System.Diagnostics.CodeAnalysis;
using System.Web.Mvc;
using System.Web.Routing;
using easyJet.Feature.ChangeTracking.Logging;
using easyJet.Feature.ChangeTracking.Services;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Engines.DataCommands;
using Sitecore.Data.Events;
using Sitecore.Events.Hooks;

namespace easyJet.Feature.ChangeTracking.Hooks
{
    [ExcludeFromCodeCoverage]
    public class ChangeTrackerHook : IHook
    {
        private readonly IChangeTrackingTrackerService changeTrackingTrackerService;
        private readonly IChangeTrackingLogger logger;

        public ChangeTrackerHook(IChangeTrackingTrackerService changeTrackingTrackerService, IChangeTrackingLogger logger)
        {
            this.changeTrackingTrackerService = changeTrackingTrackerService;
            this.logger = logger;
        }

        public void Initialize()
        {
            logger.Info("Start Initialize", this);

            RouteTable.Routes.MapRoute("easyJet.Feature.ChangeTracking.history", "easyJet/changetracking/history", new { Controller = "ChangeTracking", action = "Index" }, namespaces: new[] { "easyJet.Feature.ChangeTracking.Controllers" });
            RouteTable.Routes.MapRoute("easyJet.Feature.ChangeTracking.history.data", "easyJet/changetracking/history/data", new { Controller = "ChangeTracking", action = "Data" }, namespaces: new[] { "easyJet.Feature.ChangeTracking.Controllers" });

            if (Factory.GetDatabase("master", false) != null)
            {
                Attach("master");
                logger.Info("Events to MasterDb Attached", this);
            }

            logger.Info("End Initialize", this);
        }

        private void Attach(string dbName)
        {
            var db = Database.GetDatabase(dbName);
            var engine = db.Engines.DataEngine;

            engine.SavingItem += Engine_SavingItem;
            engine.CreatedItem += EngineOnCreatedItem;
            engine.AddedVersion += EngineOnAddedVersion;
        }

        private void EngineOnAddedVersion(object sender, ExecutedEventArgs<AddVersionCommand> executedEventArgs)
        {
            changeTrackingTrackerService.VersionAdded(executedEventArgs);
        }

        private void EngineOnCreatedItem(object sender, ExecutedEventArgs<CreateItemCommand> e)
        {
            changeTrackingTrackerService.ItemCreated(e);
        }

        private void Engine_SavingItem(object sender, ExecutingEventArgs<SaveItemCommand> e)
        {
            changeTrackingTrackerService.ItemSaving(e);
        }
    }
}
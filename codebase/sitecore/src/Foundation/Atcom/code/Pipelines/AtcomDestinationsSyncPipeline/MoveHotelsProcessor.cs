using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Models.Sitecore;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Atcom.Pipelines.AtcomDestinationsSyncPipeline
{
    public class MoveHotelsProcessor : BaseAtcomSyncProcessor
    {
        public MoveHotelsProcessor(ISyncDataService syncDataService, IAtcomLogger logger, IUserCreationService userCreationService)
            : base(syncDataService, logger, userCreationService)
        {
        }

        protected override void ProcessSync(DestinationPipelineArgs args)
        {
            Logger.Info($"Hotels movement started", this);
            var movedHotels = new List<Item>();

            // If CustomData pipeline arg doesn't have "Region" key or if it can't be cast to List<Destination> - skip this pipeline step
            if (!args.CustomData.TryGetValue(RegionsCustomDataKey, out var resortsData) || !(resortsData is List<Destination> resorts))
            {
                Logger.Warn($"Destinations args are empty", this);
                return;
            }

            // Iterate through all resorts and get hotels which exist in Sitecore but not in ATcom under each region
            foreach (var resort in resorts)
            {
                var hotels = GetMovedHotels(resort)?.ToList();
                if (hotels != null && hotels.Any())
                {
                    movedHotels.AddRange(hotels);
                }
            }

            var atcomHotelsFlatList = resorts.SelectMany(res => res.Children).ToList();

            int movedHotelsCount = 0;
            // Iterate through moved hotels and try to find resort where it was moved. If resort found - move
            foreach (var oldHotel in movedHotels)
            {
                // Get hotel with Same ATcom code and different ID
                var newHotel = atcomHotelsFlatList
                    .FirstOrDefault(x => x.Item[Constants.Fields.DatasourceItem.Code].Equals(oldHotel[Constants.Fields.DatasourceItem.Code]) &&
                                    !x.Item.ID.Equals(oldHotel.ID))?.Item;

                if (newHotel == null)
                {
                    Logger.Debug($"Hotel '{oldHotel.Name}' ({oldHotel.ID}) does not have duplicate", this);
                    continue;
                }

                var targetResort = newHotel.Parent;

                try
                {
                    Logger.Info($"Moving hotel '{oldHotel.Name}' ({oldHotel.ID}) from {oldHotel.Parent.Paths.FullPath} to {targetResort.Paths.FullPath}", this);
                    oldHotel.MoveTo(targetResort);

                    oldHotel.Editing.BeginEdit();
                    oldHotel.Fields[Constants.Fields.DatasourceItem.Name].Value = newHotel.Fields[Constants.Fields.DatasourceItem.Name]?.Value;
                    oldHotel.Editing.EndEdit();

                    newHotel.Recycle();
                    Logger.Debug($"Hotel '{newHotel.Name}' ({newHotel.ID}) was removed", this);

                    movedHotelsCount++;
                }
                catch (Exception exc)
                {
                    Logger.Error($"Error occured while moving {oldHotel.Name} ({oldHotel.ID}) hotel", exc, this);
                }
            }

            Logger.Info($"{movedHotelsCount} hotels were moved", this);
        }

        /// <summary>
        /// Compare resort's children got from ATcom sync and real resort's children
        /// If hotel is no longer under current resort in ATcom's - assume that it was moved to other resorts.
        /// Getting collection of moved hotels.
        /// </summary>
        /// <param name="resort">Resort object.</param>
        /// <returns>Collection of hotel items.</returns>
        private IEnumerable<Item> GetMovedHotels(Destination resort)
        {
            // Hotels from ATcom
            var atcomHotels = resort.Children;

            var codes = new HashSet<string>(from x in atcomHotels select x.Item[Constants.Fields.DatasourceItem.Code]);

            // Hotels from Sitecore
            var sitecoreHotels = resort.Item.Children;

            if (sitecoreHotels == null || !sitecoreHotels.Any())
            {
                yield break;
            }

            // If Hotel exist in Sitecore but not in ATcom - return
            foreach (Item item in sitecoreHotels)
            {
                var hotelCode = item[Constants.Fields.DatasourceItem.Code];
                if (!string.IsNullOrWhiteSpace(hotelCode) && !codes.Contains(hotelCode))
                {
                    yield return item;
                }
            }
        }
    }
}
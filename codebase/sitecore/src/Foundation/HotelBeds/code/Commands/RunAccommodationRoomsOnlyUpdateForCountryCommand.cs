using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.HotelBeds.Commands
{
    public class RunAccommodationRoomsOnlyUpdateForCountryCommand : BaseRunAccommodationUpdateCommand
    {
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IMasterDataService masterDataService;

        public RunAccommodationRoomsOnlyUpdateForCountryCommand(
            IMasterDataService masterDataService,
            ISyncDataService syncDataService,
            IDatabaseProvider databaseProvider,
            IHotelBedsLogger logger,
            IDestinationsRepository destinationsRepository,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(syncDataService, logger, databaseProvider, userCreationService, sitecoreUiService)
        {
            this.destinationsRepository = destinationsRepository;
            this.masterDataService = masterDataService;
        }

        protected override string CommandTitle => "Update Hotel Rooms for Country From HG";

        protected override bool IsCommandContextValid(CommandContext context)
        {
            return context.Items[0].TemplateID.Equals(Destinations.Constants.TemplateIds.Country);
        }

        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            Logger.Info($"Rooms sync from HotelBeds for {contextItem.Name}<br>fetching hotels...", this);
            var items = destinationsRepository.GetAllHotels(contextItem.Paths.Path)
                .Where(x => x != null && !string.IsNullOrWhiteSpace(x.Document.HotelBedsCode)).ToList();
            var accommodations = masterDataService.GetAccommodations(items.Select(i => i.Document.HotelBedsCode).ToArray()).ToDictionary(i => i.Code, i => i);

            var results = new List<Item>();
            var countHotels = 0;
            Context.Job.Status.Processed = 0;
            Context.Job.Status.Total = items.Count;
            foreach (var accommodationItem in items)
            {
                try
                {
                    countHotels++;
                    Context.Job?.Status?.AddMessage($"Importing rooms for {accommodationItem.Document.Name}");
                    if (!accommodations.ContainsKey(accommodationItem.Document.HotelBedsCode))
                    {
                        var message = $"No Accommodation Found!<br>HBGCode:{accommodationItem.Document.HotelBedsCode}";
                        Context.Job?.Status?.AddMessage(message);
                        Logger.Warn(message, this);
                        continue;
                    }

                    var hotelItem = DatabaseProvider.GetItem(accommodationItem.Document.Uri);
                    results.AddRange(SyncDataService.SyncAccommodationRooms(accommodations[accommodationItem.Document.HotelBedsCode], hotelItem));
                    SyncDataService.UpdateMasterIndexes(hotelItem);

                    if (Context.Job?.Status != null)
                    {
                        Context.Job.Status.Processed++;
                    }
                }
                catch (Exception e)
                {
                    Logger.Error($"Error while synchronizing rooms for accommodation: {accommodationItem.Document.HotelBedsCode}", e, this);
                    return new List<Item>();
                }
            }

            Logger.Info($"{results.Count()} rooms was synchronized for {countHotels} accommodations from HotelBeds", this);
            return results;
        }

        protected override string GetStatusMessage(Item item) => $"Room {item.Name} has been successfully synchronized. Item ID: {item.ID}";

        protected override string GetFinalStatusMessage(List<Item> processedItems) => $"{processedItems.Count} Rooms successfully synchronized.";
    }
}
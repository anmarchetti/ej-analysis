using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Models.Domain;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.Security.Accounts;

namespace easyJet.Foundation.HotelBeds.Pipelines.HotelBedsImagesResync
{
    public class CleanUpBrokenImagesProcessor
    {
        private readonly IDestinationsRepository hotelsRepository;
        private readonly ISyncDataService syncDataService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IHotelBedsLogger logger;
        private readonly IImagesService imagesService;

        public CleanUpBrokenImagesProcessor(
            IDestinationsRepository hotelsRepository,
            ISyncDataService syncDataService,
            IDatabaseProvider databaseProvider,
            IHotelBedsLogger logger,
            IImagesService imagesService)
        {
            this.hotelsRepository = hotelsRepository;
            this.syncDataService = syncDataService;
            this.databaseProvider = databaseProvider;
            this.logger = logger;
            this.imagesService = imagesService;
        }

        /// <summary>
        /// Clean up broken images from external hotels.
        /// </summary>
        /// <param name="args">Pipeline argument.</param>
        public void Process(DestinationPipelineArgs args)
        {
            try
            {
                if (args.Parent != null)
                {
                    logger.Info("Clean up broken images process has been started.", this);
                    var hotelItems = hotelsRepository.GetAllHotels(args.Parent.Paths.FullPath).Select(x => databaseProvider.GetItem(x.Document.Uri)).Where(x => x != null);
                    var candidatesForDeleting = new Dictionary<string, HotelItem>();
                    var hbgImagePrefix = Settings.GetSetting("HotelBeds.ImageSizePrefixUrl.Small");
                    foreach (var hotelItem in hotelItems)
                    {
                        // WP-268 filter out not HBG images
                        var images = hotelItem
                            .GetDescendantsByTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                            .Where(d => (d[Destinations.Constants.Fields.ExternalImageItem.Small]?.StartsWith(hbgImagePrefix) ?? false)
                                        || (d[Destinations.Constants.Fields.ExternalImageItem.Medium]?.StartsWith(hbgImagePrefix) ?? false)
                                        || (d[Destinations.Constants.Fields.ExternalImageItem.Large]?.StartsWith(hbgImagePrefix) ?? false))
                            .ToList();

                        var imageItems = new List<Item>();
                        foreach (var image in images)
                        {
                            var isImageBroken = imagesService.CheckIfImagesAreBroken(
                                   image[Destinations.Constants.Fields.ExternalImageItem.Small],
                                   image[Destinations.Constants.Fields.ExternalImageItem.Medium],
                                   image[Destinations.Constants.Fields.ExternalImageItem.Large])
                               .GetAwaiter().GetResult();

                            if (isImageBroken)
                            {
                                imageItems.Add(image);
                            }
                        }

                        if (imageItems.Any())
                        {
                            var hotelBedsCode = hotelItem.Fields[Destinations.Constants.Fields.AccommodationItem.HotelBedsCode]?.Value;
                            if (string.IsNullOrWhiteSpace(hotelBedsCode))
                            {
                                logger.Warn($"HBG code was empty for item: {hotelItem.Paths.FullPath} - number of broken images: {imageItems.Count}", this);
                                continue;
                            }

                            var hotelImages = new HotelItem
                            {
                                Images = imageItems,
                                Item = hotelItem
                            };

                            candidatesForDeleting[hotelBedsCode] = hotelImages;
                        }
                    }

                    logger.Debug($"{candidatesForDeleting.Keys.Count} number of hotel's which have potentially broken images", this);

                    var proccededItems = new List<Item>();
                    if (candidatesForDeleting.Any())
                    {
                        var imageFixerUser = User.FromName(Settings.GetSetting("HotelBeds.ImageFixerUser"), false) ?? Context.User;
                        using (new UserSwitcher(imageFixerUser))
                        {
                            proccededItems = syncDataService.ResyncImages(candidatesForDeleting);
                        }
                    }

                    logger.Info($"Clean up broken images proccess has been finished ({proccededItems.Count} images were deleted).", this);
                }
            }
            catch (Exception e)
            {
                logger.Error(nameof(CleanUpBrokenImagesProcessor), e, this);
                args.AbortPipeline();
            }
        }
    }
}
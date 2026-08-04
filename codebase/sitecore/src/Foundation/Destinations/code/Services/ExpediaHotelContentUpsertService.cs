using System;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Helpers;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IExpediaHotelContentUpsertService), Lifetime = Lifetime.Transient)]
    public class ExpediaHotelContentUpsertService : IExpediaHotelContentUpsertService
    {
        private readonly IHotelStructureBuilderService hotelStructureBuilderService;
        private readonly IExpediaHotelContentResolverService expediaHotelContentResolverService;
        private readonly IHotelContentFieldsService hotelContentFieldsService;
        private readonly IHotelFacilitiesService hotelFacilitiesService;
        private readonly IHotelImagesService hotelImagesService;
        private readonly IHotelRoomsService hotelRoomsService;
        private readonly IDestinationsLogger logger;

        public ExpediaHotelContentUpsertService(
            IHotelStructureBuilderService hotelStructureBuilderService,
            IExpediaHotelContentResolverService expediaHotelContentResolverService,
            IHotelContentFieldsService hotelContentFieldsService,
            IHotelFacilitiesService hotelFacilitiesService,
            IHotelImagesService hotelImagesService,
            IHotelRoomsService hotelRoomsService,
            IDestinationsLogger logger)
        {
            this.hotelStructureBuilderService = hotelStructureBuilderService;
            this.expediaHotelContentResolverService = expediaHotelContentResolverService;
            this.hotelContentFieldsService = hotelContentFieldsService;
            this.hotelFacilitiesService = hotelFacilitiesService;
            this.hotelImagesService = hotelImagesService;
            this.hotelRoomsService = hotelRoomsService;
            this.logger = logger;
        }

        public HotelUpsertResult UpsertFromExpedia(UpsertHotelRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var existingItem = expediaHotelContentResolverService.ResolveHotelItem(request);

            Item targetItem;
            bool isNew;

            if (existingItem == null)
            {
                if (string.IsNullOrWhiteSpace(request.Resort?.Code))
                {
                    throw new ArgumentException("Resort Code must be provided when creating a new hotel.");
                }

                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    throw new ArgumentException("Hotel Name must be provided when creating a new hotel.");
                }

                targetItem = hotelStructureBuilderService.CreateHotel(request);
                UpsertExpediaHotel(targetItem, request, isNewItem: true);

                isNew = true;

                logger.Info($"Hotel created. SitecoreId: '{targetItem.ID}', GiataCode: '{request.GiataCode}'.", this);
            }
            else
            {
                targetItem = existingItem;
                var hotelType = HotelTypeHelper.ResolveHotelType(targetItem);

                switch (hotelType)
                {
                    case HotelSourceType.Expedia:
                        UpsertExpediaHotel(targetItem, request, isNewItem: false);
                        break;

                    case HotelSourceType.HotelBeds:
                        UpsertHotelBedsContent(targetItem, request);
                        break;

                    case HotelSourceType.Regular:
                        UpsertRegularHotelRooms(targetItem, request);
                        break;

                    default:
                        throw new NotSupportedException($"Hotel type '{hotelType}' is not supported.");
                }

                isNew = false;
            }

            ApproveHotelWorkflow(targetItem);

            return new HotelUpsertResult { Created = isNew, SitecoreId = targetItem.ID.ToString() };
        }

        private static Item GetLatestVersion(Item item)
        {
            return item.Versions.GetLatestVersion() ?? item;
        }

        private void UpsertExpediaHotel(Item hotelItem, UpsertHotelRequest request, bool isNewItem)
        {
            if (isNewItem)
            {
                hotelFacilitiesService.Create(hotelItem, request.Facilities, Constants.TemplateIds.AccommodationFacilitiesFolder, Constants.TemplateIds.AccommodationFacility);

                hotelImagesService.Create(hotelItem, request.HotelCarouselImages);

                hotelRoomsService.Create(hotelItem, request.Rooms, request.GiataCode);
            }
            else
            {
                hotelFacilitiesService.Upsert(hotelItem, request.Facilities, Constants.TemplateIds.AccommodationFacilitiesFolder, Constants.TemplateIds.AccommodationFacility);

                hotelImagesService.AddMissing(hotelItem, request.HotelCarouselImages);

                hotelRoomsService.Upsert(hotelItem, request.Rooms, request.GiataCode);
            }

            hotelContentFieldsService.Populate(GetLatestVersion(hotelItem), request, !isNewItem, isNewItem);
        }

        private void UpsertHotelBedsContent(Item hotelItem, UpsertHotelRequest request)
        {
            hotelImagesService.ReplaceAll(hotelItem, request.HotelCarouselImages);
            hotelRoomsService.Upsert(hotelItem, request.Rooms, request.ExpediaCode);
        }

        private void UpsertRegularHotelRooms(Item hotelItem, UpsertHotelRequest request)
        {
            hotelRoomsService.Upsert(hotelItem, request.Rooms, request.ExpediaCode);
        }

        private void ApproveHotelWorkflow(Item hotelItem)
        {
            if (hotelItem == null)
            {
                throw new ArgumentNullException(nameof(hotelItem));
            }

            var latestVersion = GetLatestVersion(hotelItem);

            if (latestVersion == null)
            {
                logger.Warn($"Cannot approve workflow. No version for item '{hotelItem.ID}'.", this);
                return;
            }

            using (new EditContext(latestVersion, SecurityCheck.Disable))
            {
                latestVersion[FieldIDs.WorkflowState] = Constants.WorkflowsStateIds.DestinationsWorkflowApprovedId.ToString();
            }
        }
    }
}
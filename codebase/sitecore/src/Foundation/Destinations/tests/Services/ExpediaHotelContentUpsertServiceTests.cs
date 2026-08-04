using System;
using System.Collections.Generic;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class ExpediaHotelContentUpsertServiceTests
    {
        private readonly IHotelStructureBuilderService hotelStructureBuilderService;
        private readonly IExpediaHotelContentResolverService expediaHotelContentResolverService;
        private readonly IHotelContentFieldsService hotelContentFieldsService;
        private readonly IHotelFacilitiesService hotelFacilitiesService;
        private readonly IHotelImagesService hotelImagesService;
        private readonly IHotelRoomsService hotelRoomsService;
        private readonly IDestinationsLogger logger;
        private readonly IExpediaHotelContentUpsertService service;

        public ExpediaHotelContentUpsertServiceTests()
        {
            hotelStructureBuilderService = Substitute.For<IHotelStructureBuilderService>();
            expediaHotelContentResolverService = Substitute.For<IExpediaHotelContentResolverService>();
            hotelContentFieldsService = Substitute.For<IHotelContentFieldsService>();
            hotelFacilitiesService = Substitute.For<IHotelFacilitiesService>();
            hotelImagesService = Substitute.For<IHotelImagesService>();
            hotelRoomsService = Substitute.For<IHotelRoomsService>();
            logger = Substitute.For<IDestinationsLogger>();

            service = new ExpediaHotelContentUpsertService(
                hotelStructureBuilderService,
                expediaHotelContentResolverService,
                hotelContentFieldsService,
                hotelFacilitiesService,
                hotelImagesService,
                hotelRoomsService,
                logger);
        }

        [Fact]
        public void UpsertHotel_ShouldThrowArgumentNullException_WhenRequestIsNull()
        {
            Action act = () => service.UpsertFromExpedia(null);

            act.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void UpsertHotel_ShouldCreateNewExpediaHotel_WhenExistingHotelIsNotFound()
        {
            using (var db = CreateHotelDb())
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var request = CreateRequest();

                expediaHotelContentResolverService
                    .ResolveHotelItem(request)
                    .Returns((Sitecore.Data.Items.Item)null);

                hotelStructureBuilderService.CreateHotel(request).Returns(hotelItem);

                var result = service.UpsertFromExpedia(request);

                result.Should().NotBeNull();
                result.Created.Should().BeTrue();
                result.SitecoreId.Should().Be(hotelItem.ID.ToString());

                expediaHotelContentResolverService.Received(1).ResolveHotelItem(request);
                hotelStructureBuilderService.Received(1).CreateHotel(request);

                hotelFacilitiesService.Received(1).Create(
                    hotelItem,
                    request.Facilities,
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                hotelImagesService.Received(1).Create(
                    hotelItem,
                    request.HotelCarouselImages);

                hotelRoomsService.Received(1).Create(
                    hotelItem,
                    request.Rooms,
                    request.GiataCode);

                hotelContentFieldsService.Received(1).Populate(
                    Arg.Any<Sitecore.Data.Items.Item>(),
                    request,
                    false,
                    true);

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("Hotel created")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void UpsertHotel_ShouldUpdateExistingExpediaHotel_WhenSitecoreIdExists()
        {
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    { FieldIDs.WorkflowState, string.Empty },
                    new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, "W0080001" }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = CreateRequest();
                request.SitecoreId = hotelItem.ID.ToString();

                expediaHotelContentResolverService
                    .ResolveHotelItem(request)
                    .Returns(hotelItem);

                var result = service.UpsertFromExpedia(request);

                result.Should().NotBeNull();
                result.Created.Should().BeFalse();
                result.SitecoreId.Should().Be(hotelItem.ID.ToString());

                hotelStructureBuilderService.DidNotReceive().CreateHotel(Arg.Any<UpsertHotelRequest>());

                hotelFacilitiesService.Received(1).Upsert(
                    hotelItem,
                    request.Facilities,
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                hotelImagesService.Received(1).AddMissing(
                    hotelItem,
                    request.HotelCarouselImages);

                hotelRoomsService.Received(1).Upsert(
                    hotelItem,
                    request.Rooms,
                    request.GiataCode);

                hotelContentFieldsService.Received(1).Populate(
                    Arg.Any<Sitecore.Data.Items.Item>(),
                    request,
                    true,
                    false);
            }
        }

        [Fact]
        public void UpsertHotel_ShouldUpdateExistingHotelBedsHotel_WithImagesAndRoomsOnly()
        {
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    { FieldIDs.WorkflowState, string.Empty },
                    new DbItem("Rooms - HotelBeds", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, "X0080001" }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = CreateRequest();
                request.SitecoreId = hotelItem.ID.ToString();

                expediaHotelContentResolverService
                    .ResolveHotelItem(request)
                    .Returns(hotelItem);

                var result = service.UpsertFromExpedia(request);

                result.Should().NotBeNull();
                result.Created.Should().BeFalse();

                hotelStructureBuilderService.DidNotReceive().CreateHotel(Arg.Any<UpsertHotelRequest>());

                hotelImagesService.Received(1).ReplaceAll(
                    hotelItem,
                    request.HotelCarouselImages);

                hotelImagesService.DidNotReceive().AddMissing(
                    Arg.Any<Sitecore.Data.Items.Item>(),
                    Arg.Any<List<string>>());

                hotelRoomsService.Received(1).Upsert(
                    hotelItem,
                    request.Rooms,
                    request.ExpediaCode);

                hotelFacilitiesService.DidNotReceiveWithAnyArgs()
                    .Upsert(default(Sitecore.Data.Items.Item), default(List<FacilityContent>), default(ID), default(ID));

                hotelContentFieldsService.DidNotReceiveWithAnyArgs()
                    .Populate(default(Sitecore.Data.Items.Item), default(UpsertHotelRequest), default(bool), default(bool));
            }
        }

        [Fact]
        public void UpsertHotel_ShouldUpdateExistingRegularHotel_WithRoomsOnly()
        {
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    { FieldIDs.WorkflowState, string.Empty },
                    new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, "W0080001" }
                    },
                    new DbItem("Rooms - HotelBeds", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, "X0080001" }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = CreateRequest();
                request.SitecoreId = hotelItem.ID.ToString();

                expediaHotelContentResolverService
                    .ResolveHotelItem(request)
                    .Returns(hotelItem);

                var result = service.UpsertFromExpedia(request);

                result.Should().NotBeNull();
                result.Created.Should().BeFalse();

                hotelStructureBuilderService.DidNotReceive().CreateHotel(Arg.Any<UpsertHotelRequest>());

                hotelRoomsService.Received(1).Upsert(
                    hotelItem,
                    request.Rooms,
                    request.ExpediaCode);

                hotelImagesService.DidNotReceiveWithAnyArgs()
                    .AddMissing(default(Sitecore.Data.Items.Item), default(List<string>));

                hotelImagesService.DidNotReceiveWithAnyArgs()
                    .ReplaceAll(default(Sitecore.Data.Items.Item), default(List<string>));

                hotelFacilitiesService.DidNotReceiveWithAnyArgs()
                    .Upsert(default(Sitecore.Data.Items.Item), default(List<FacilityContent>), default(ID), default(ID));

                hotelContentFieldsService.DidNotReceiveWithAnyArgs()
                    .Populate(default(Sitecore.Data.Items.Item), default(UpsertHotelRequest), default(bool), default(bool));
            }
        }

        [Fact]
        public void UpsertHotel_ShouldCreateNewHotel_WhenResolverDoesNotFindExistingHotel()
        {
            using (var db = CreateHotelDb())
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var request = CreateRequest();

                expediaHotelContentResolverService
                    .ResolveHotelItem(request)
                    .Returns((Sitecore.Data.Items.Item)null);

                hotelStructureBuilderService.CreateHotel(request).Returns(hotelItem);

                var result = service.UpsertFromExpedia(request);

                result.Should().NotBeNull();
                result.Created.Should().BeTrue();

                expediaHotelContentResolverService.Received(1).ResolveHotelItem(request);
                hotelStructureBuilderService.Received(1).CreateHotel(request);
            }
        }

        [Fact]
        public void UpsertHotel_ShouldPopulateNewExpediaDefaults_WhenCreatingNewHotel()
        {
            using (var db = CreateHotelDb())
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var request = CreateRequest();

                expediaHotelContentResolverService
                    .ResolveHotelItem(request)
                    .Returns((Sitecore.Data.Items.Item)null);

                hotelStructureBuilderService.CreateHotel(request).Returns(hotelItem);

                service.UpsertFromExpedia(request);

                hotelContentFieldsService.Received(1).Populate(
                    Arg.Any<Sitecore.Data.Items.Item>(),
                    request,
                    false,
                    true);
            }
        }

        private static Db CreateHotelDb()
        {
            return new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    { FieldIDs.WorkflowState, string.Empty },
                    { Constants.Fields.DatasourceItem.Code, string.Empty },
                    { Constants.Fields.AccommodationItem.GiataCode, string.Empty }
                }
            };
        }

        private static UpsertHotelRequest CreateRequest()
        {
            return new UpsertHotelRequest
            {
                GiataCode = "36363636",
                Code = "W0080001",
                ExpediaCode = "W0080001",
                Name = "Demo Krakow Hotel One",
                HotelDescription = "Demo hotel created under existing resort.",
                Country = new DestinationBase
                {
                    Code = "PL",
                    Name = "Poland"
                },
                Location = new DestinationBase
                {
                    Code = "PLKR",
                    Name = "Krakow"
                },
                Resort = new DestinationBase
                {
                    Code = "PLKRKR",
                    Name = "Krakow City"
                },
                HotelCarouselImages = new List<string>
                {
                    "https://photos.hotelbeds.com/giata/xl/02/024457/024457a_hb_r_071.jpg"
                },
                Facilities = new List<FacilityContent>
                {
                    new FacilityContent
                    {
                        Code = "130",
                        Name = "Bar",
                        Value = "Hotel-level Bar facility"
                    }
                },
                Rooms = new List<RoomContent>
                {
                    new RoomContent
                    {
                        VendorRoomCode = "1234",
                        Name = "Demo Standard Room",
                        Description = "Demo standard room.",
                        Facilities = new List<FacilityContent>
                        {
                            new FacilityContent
                            {
                                Code = "279",
                                Name = "Desk",
                                Value = "Desk facility"
                            }
                        },
                        Images = new List<string>
                        {
                            "https://photos.hotelbeds.com/giata/xl/02/024457/024457a_hb_r_081.jpg"
                        }
                    }
                }
            };
        }
    }
}
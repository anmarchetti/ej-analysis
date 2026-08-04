using System;
using System.Collections.Generic;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class HotelRoomsServiceTests
    {
        private static readonly ID CodeFieldId = ID.NewID;
        private static readonly ID DescriptionFieldId = ID.NewID;
        private static readonly ID NameFieldId = ID.NewID;

        private readonly IDatasourceRepository datasourceRepository;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IHotelImagesService hotelImagesService;
        private readonly IHotelFacilitiesService hotelFacilitiesService;
        private readonly IDestinationsLogger logger;
        private readonly HotelRoomsService sut;

        public HotelRoomsServiceTests()
        {
            datasourceRepository = Substitute.For<IDatasourceRepository>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            hotelImagesService = Substitute.For<IHotelImagesService>();
            hotelFacilitiesService = Substitute.For<IHotelFacilitiesService>();
            logger = Substitute.For<IDestinationsLogger>();

            sut = new HotelRoomsService(
                datasourceRepository,
                hotelImagesService,
                hotelFacilitiesService,
                databaseProvider,
                logger);
        }

        [Fact]
        public void Create_ShouldThrowArgumentNullException_WhenHotelItemIsNull()
        {
            // Act
            Action act = () => sut.Create(null, new List<RoomContent>(), "W0080001");

            // Assert
            act.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void Upsert_ShouldThrowArgumentNullException_WhenHotelItemIsNull()
        {
            // Act
            Action act = () => sut.Upsert(null, new List<RoomContent>(), "W0080001");

            // Assert
            act.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void Create_ShouldSkip_WhenRoomsAreNull()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                sut.Create(hotelItem, null, "W0080001");

                // Assert
                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .CreateItem(default(string), default(ID), default(Sitecore.Data.Items.Item), default(bool));

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("No rooms found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void Create_ShouldSkip_WhenRoomsAreEmpty()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                sut.Create(hotelItem, new List<RoomContent>(), "W0080001");

                // Assert
                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .CreateItem(default(string), default(ID), default(Sitecore.Data.Items.Item), default(bool));

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("No rooms found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void Upsert_ShouldSkip_WhenRoomsAreNull()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                sut.Upsert(hotelItem, null, "W0080001");

                // Assert
                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetOrCreateItem(default(string), default(ID), default(Sitecore.Data.Items.Item));

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("No rooms found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void Upsert_ShouldSkip_WhenRoomsAreEmpty()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                sut.Upsert(hotelItem, new List<RoomContent>(), "W0080001");

                // Assert
                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetOrCreateItem(default(string), default(ID), default(Sitecore.Data.Items.Item));

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("No rooms found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void Create_ShouldCreateRoomsFolderAndRoom_WhenRoomsProvided()
        {
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
            {
                { Constants.Fields.DatasourceItem.Code, string.Empty }
            }
        },
        new DbItem("Created Room", ID.NewID, Constants.TemplateIds.AccommodationRoom)
        {
            { Constants.Fields.DatasourceItem.Code, string.Empty },
            { Constants.Fields.DatasourceItem.Name, string.Empty },
            { Constants.Fields.AccommodationReferenceItem.Description, string.Empty },
            { Constants.Fields.StandardFields.DisplayName, string.Empty }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var roomsFolder = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia");
                var roomItem = db.GetItem("/sitecore/content/Created Room");

                var rooms = new List<RoomContent>
        {
            new RoomContent
            {
                VendorRoomCode = "1234",
                Name = "Demo Standard Room",
                Description = "Created room description.",
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
        };

                datasourceRepository.GetOrCreateItem(
                        "Rooms - Expedia",
                        Constants.TemplateIds.AccommodationRoomsFolder,
                        hotelItem)
                    .Returns(roomsFolder);

                datasourceRepository.GetOrCreateItem(
                        "Demo Standard Room - 1234",
                        Constants.TemplateIds.AccommodationRoom,
                        roomsFolder,
                        false)
                    .Returns(roomItem);

                sut.Create(hotelItem, rooms, "W0080001");

                datasourceRepository.Received(1).GetOrCreateItem(
                    "Demo Standard Room - 1234",
                    Constants.TemplateIds.AccommodationRoom,
                    roomsFolder,
                    false);

                roomsFolder[Constants.Fields.DatasourceItem.Code].Should().Be("W0080001");
                roomItem[Constants.Fields.DatasourceItem.Code].Should().Be("1234");
                roomItem[Constants.Fields.DatasourceItem.Name].Should().Be("Demo Standard Room");
                roomItem[Constants.Fields.AccommodationReferenceItem.Description].Should().Be("Created room description.");
                roomItem[Constants.Fields.StandardFields.DisplayName].Should().Be("Demo Standard Room");

                hotelFacilitiesService.Received(1).Create(
                    roomItem,
                    rooms[0].Facilities,
                    Constants.TemplateIds.RoomFacilitiesFolder,
                    Constants.TemplateIds.RoomFacility);

                hotelImagesService.Received(1).Create(roomItem, rooms[0].Images);
            }
        }

        [Fact]
        public void Create_ShouldNotCallFacilitiesOrImages_WhenRoomFacilitiesAndImagesAreEmpty()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, string.Empty },
                        new DbItem("Demo Standard Room", ID.NewID, Constants.TemplateIds.AccommodationRoom)
                        {
                            { Constants.Fields.DatasourceItem.Code, string.Empty },
                            { Constants.Fields.DatasourceItem.Name, string.Empty },
                            { Constants.Fields.AccommodationReferenceItem.Description, string.Empty }
                        }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var roomsFolder = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia");
                var roomItem = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia/Demo Standard Room");

                var rooms = new List<RoomContent>
                {
                    new RoomContent
                    {
                        VendorRoomCode = "1234",
                        Name = "Demo Standard Room",
                        Description = "Created room description.",
                        Facilities = new List<FacilityContent>(),
                        Images = new List<string>()
                    }
                };

                datasourceRepository.GetOrCreateItem(
                    "Rooms - Expedia",
                    Constants.TemplateIds.AccommodationRoomsFolder,
                    hotelItem)
                    .Returns(roomsFolder);

                datasourceRepository.CreateItem(
                        "Demo Standard Room - 1234",
                        Constants.TemplateIds.AccommodationRoom,
                        roomsFolder,
                        false)
                    .Returns(roomItem);

                // Act
                sut.Create(hotelItem, rooms, "W0080001");

                // Assert
                hotelFacilitiesService.DidNotReceiveWithAnyArgs()
                    .Create(default(Sitecore.Data.Items.Item), default(List<FacilityContent>), default(ID), default(ID));

                hotelImagesService.DidNotReceiveWithAnyArgs()
                    .Create(default(Sitecore.Data.Items.Item), default(List<string>));
            }
        }

        [Fact]
        public void Create_ShouldThrowArgumentException_WhenRequestCodeIsEmpty()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, string.Empty },
                        new DbItem("Demo Standard Room", ID.NewID, Constants.TemplateIds.AccommodationRoom)
                        {
                            { Constants.Fields.DatasourceItem.Code, string.Empty },
                            { Constants.Fields.DatasourceItem.Name, string.Empty },
                            { Constants.Fields.AccommodationReferenceItem.Description, string.Empty }
                        }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var roomsFolder = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia");

                var rooms = new List<RoomContent>
                {
                    new RoomContent
                    {
                        VendorRoomCode = "1234",
                        Name = "Demo Standard Room",
                        Description = "Created room description."
                    }
                };

                datasourceRepository.GetOrCreateItem(
                        "Rooms - Expedia",
                        Constants.TemplateIds.AccommodationRoomsFolder,
                        hotelItem)
                    .Returns(roomsFolder);

                // Act
                Action act = () => sut.Create(hotelItem, rooms, " ");

                // Assert
                act.Should()
                    .Throw<ArgumentException>()
                    .WithMessage("Code is required.*")
                    .And.ParamName.Should().Be("code");

                roomsFolder[Constants.Fields.DatasourceItem.Code].Should().BeEmpty();
            }
        }

        [Fact]
        public void Upsert_ShouldUpdateExistingRoom_WhenRoomNameExists()
        {
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
            {
                { Constants.Fields.DatasourceItem.Code, string.Empty },
                new DbItem("Demo Standard Room", ID.NewID, Constants.TemplateIds.AccommodationRoom)
                {
                    { Constants.Fields.DatasourceItem.Code, "1234" },
                    { Constants.Fields.DatasourceItem.Name, "Old room name" },
                    { Constants.Fields.AccommodationReferenceItem.Description, "Old description" }
                }
            }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var roomsFolder = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia");
                var roomItem = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia/Demo Standard Room");

                var rooms = new List<RoomContent>
        {
            new RoomContent
            {
                VendorRoomCode = "1234",
                Name = "Demo Standard Room",
                Description = "Updated room description.",
                Facilities = new List<FacilityContent>
                {
                    new FacilityContent
                    {
                        Code = "279",
                        Name = "Desk",
                        Value = "Updated desk facility"
                    }
                },
                Images = new List<string>
                {
                    "https://photos.hotelbeds.com/giata/xl/02/024457/024457a_hb_r_081.jpg"
                }
            }
        };

                datasourceRepository.GetOrCreateItem(
                        "Rooms - Expedia",
                        Constants.TemplateIds.AccommodationRoomsFolder,
                        hotelItem)
                    .Returns(roomsFolder);

                sut.Upsert(hotelItem, rooms, "W0080001");

                datasourceRepository.DidNotReceive().CreateItem(
                    Arg.Any<string>(),
                    Constants.TemplateIds.AccommodationRoom,
                    roomsFolder,
                    Arg.Any<bool>());

                var latestRoomItem = roomItem.Versions.GetLatestVersion();

                latestRoomItem[Constants.Fields.DatasourceItem.Name].Should().Be("Demo Standard Room");
                latestRoomItem[Constants.Fields.AccommodationReferenceItem.Description].Should().Be("Updated room description.");

                hotelFacilitiesService.Received(1).Upsert(
                    Arg.Is<Sitecore.Data.Items.Item>(x => x.ID == roomItem.ID),
                    rooms[0].Facilities,
                    Constants.TemplateIds.RoomFacilitiesFolder,
                    Constants.TemplateIds.RoomFacility);

                hotelImagesService.Received(1).AddMissing(
                    Arg.Is<Sitecore.Data.Items.Item>(x => x.ID == roomItem.ID),
                    rooms[0].Images);
            }
        }

        [Fact]
        public void Upsert_ShouldCreateMissingRoom_WhenRoomNameDoesNotExist()
        {
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
            {
                { Constants.Fields.DatasourceItem.Code, string.Empty }
            }
        },
        new DbItem("Created Room", ID.NewID, Constants.TemplateIds.AccommodationRoom)
        {
            { Constants.Fields.DatasourceItem.Code, string.Empty },
            { Constants.Fields.DatasourceItem.Name, string.Empty },
            { Constants.Fields.AccommodationReferenceItem.Description, string.Empty },
            { Constants.Fields.StandardFields.DisplayName, string.Empty }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var roomsFolder = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia");
                var roomItem = db.GetItem("/sitecore/content/Created Room");

                var rooms = new List<RoomContent>
        {
            new RoomContent
            {
                VendorRoomCode = "9999",
                Name = "New Room",
                Description = "New room description."
            }
        };

                datasourceRepository.GetOrCreateItem(
                        "Rooms - Expedia",
                        Constants.TemplateIds.AccommodationRoomsFolder,
                        hotelItem)
                    .Returns(roomsFolder);

                datasourceRepository.GetOrCreateItem(
                        "New Room - 9999",
                        Constants.TemplateIds.AccommodationRoom,
                        roomsFolder,
                        false)
                    .Returns(roomItem);

                sut.Upsert(hotelItem, rooms, "W0080001");

                datasourceRepository.Received(1).GetOrCreateItem(
                    "New Room - 9999",
                    Constants.TemplateIds.AccommodationRoom,
                    roomsFolder,
                    false);

                var latestRoomItem = roomItem.Versions.GetLatestVersion();
                latestRoomItem[Constants.Fields.DatasourceItem.Code].Should().Be("9999");
                latestRoomItem[Constants.Fields.DatasourceItem.Name].Should().Be("New Room");
                latestRoomItem[Constants.Fields.AccommodationReferenceItem.Description].Should().Be("New room description.");
            }
        }

        [Fact]
        public void Upsert_ShouldSkipRoom_WhenRoomNameIsMissing()
        {
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
            {
                { Constants.Fields.DatasourceItem.Code, string.Empty }
            }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var roomsFolder = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia");

                var rooms = new List<RoomContent>
        {
            new RoomContent
            {
                VendorRoomCode = "1234",
                Name = " "
            }
        };

                datasourceRepository.GetOrCreateItem(
                        "Rooms - Expedia",
                        Constants.TemplateIds.AccommodationRoomsFolder,
                        hotelItem)
                    .Returns(roomsFolder);

                sut.Upsert(hotelItem, rooms, "W0080001");

                datasourceRepository.DidNotReceive().CreateItem(
                    Arg.Any<string>(),
                    Constants.TemplateIds.AccommodationRoom,
                    roomsFolder,
                    Arg.Any<bool>());

                logger.Received(1).Warn(
                    Arg.Is<string>(x => x.Contains("Room without name")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void Upsert_ShouldNotCallFacilitiesOrImages_WhenRoomFacilitiesAndImagesAreNull()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, string.Empty },
                        new DbItem("Demo Standard Room", ID.NewID, Constants.TemplateIds.AccommodationRoom)
                        {
                            { Constants.Fields.DatasourceItem.Code, "1234" },
                            { Constants.Fields.DatasourceItem.Name, "Old room name" },
                            { Constants.Fields.AccommodationReferenceItem.Description, "Old description" }
                        }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var roomsFolder = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia");

                var rooms = new List<RoomContent>
                {
                    new RoomContent
                    {
                        VendorRoomCode = "1234",
                        Name = "Demo Standard Room",
                        Description = "Updated room description.",
                        Facilities = null,
                        Images = null
                    }
                };

                datasourceRepository.GetOrCreateItem(
                    "Rooms - Expedia",
                    Constants.TemplateIds.AccommodationRoomsFolder,
                    hotelItem)
                    .Returns(roomsFolder);

                // Act
                sut.Upsert(hotelItem, rooms, "W0080001");

                // Assert
                hotelFacilitiesService.DidNotReceiveWithAnyArgs()
                    .Upsert(default(Sitecore.Data.Items.Item), default(List<FacilityContent>), default(ID), default(ID));

                hotelImagesService.DidNotReceiveWithAnyArgs()
                    .AddMissing(default(Sitecore.Data.Items.Item), default(List<string>));
            }
        }

        [Fact]
        public void Upsert_ShouldSkipRoom_WhenVendorRoomCodeIsMissing()
        {
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
            {
                { Constants.Fields.DatasourceItem.Code, string.Empty }
            }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var roomsFolder =
                    db.GetItem("/sitecore/content/Hotel/Rooms - Expedia");

                var rooms = new List<RoomContent>
        {
            new RoomContent
            {
                VendorRoomCode = " ",
                Name = "Room Without Vendor Code",
                Description = "Description."
            }
        };

                datasourceRepository.GetOrCreateItem(
                        "Rooms - Expedia",
                        Constants.TemplateIds.AccommodationRoomsFolder,
                        hotelItem)
                    .Returns(roomsFolder);

                sut.Upsert(hotelItem, rooms, "W0080001");

                datasourceRepository.DidNotReceive().GetOrCreateItem(
                    Arg.Any<string>(),
                    Constants.TemplateIds.AccommodationRoom,
                    roomsFolder,
                    Arg.Any<bool>());

                logger.Received(1).Warn(
                    Arg.Is<string>(x =>
                        x.Contains("without vendor room code")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void Create_ShouldUpdateExistingRoom_WhenRoomNameAlreadyExists()
        {
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
            {
                { Constants.Fields.DatasourceItem.Code, string.Empty },
                new DbItem("Demo Deluxe Room Two", ID.NewID, Constants.TemplateIds.AccommodationRoom)
                {
                    { Constants.Fields.DatasourceItem.Code, "5678" },
                    { Constants.Fields.DatasourceItem.Name, string.Empty },
                    { Constants.Fields.AccommodationReferenceItem.Description, string.Empty },
                    { Constants.Fields.StandardFields.DisplayName, string.Empty }
                }
            }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var roomsFolder = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia");
                var existingRoom = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia/Demo Deluxe Room Two");

                var rooms = new List<RoomContent>
        {
            new RoomContent
            {
                VendorRoomCode = "5678",
                Name = "Demo Deluxe Room Two",
                Description = "Updated room description."
            }
        };

                datasourceRepository.GetOrCreateItem(
                        "Rooms - Expedia",
                        Constants.TemplateIds.AccommodationRoomsFolder,
                        hotelItem)
                    .Returns(roomsFolder);

                sut.Create(hotelItem, rooms, "W0080001");

                datasourceRepository.DidNotReceive().CreateItem(
                    "Demo Deluxe Room Two - 5678",
                    Constants.TemplateIds.AccommodationRoom,
                    roomsFolder,
                    false);

                var latestExistingRoom = existingRoom.Versions.GetLatestVersion();

                latestExistingRoom[Constants.Fields.DatasourceItem.Name].Should().Be("Demo Deluxe Room Two");
                latestExistingRoom[Constants.Fields.AccommodationReferenceItem.Description].Should().Be("Updated room description.");
                latestExistingRoom[Constants.Fields.DatasourceItem.Code].Should().Be("5678");
                latestExistingRoom[Constants.Fields.StandardFields.DisplayName].Should().Be("Demo Deluxe Room Two");
            }
        }

        [Fact]
        public void Create_ShouldCreateBothRooms_WhenSameRoomNameHasDifferentCodes()
        {
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
            {
                { Constants.Fields.DatasourceItem.Code, string.Empty }
            }
        },
        new DbItem("Created Room One", ID.NewID, Constants.TemplateIds.AccommodationRoom)
        {
            { Constants.Fields.DatasourceItem.Code, string.Empty },
            { Constants.Fields.DatasourceItem.Name, string.Empty },
            { Constants.Fields.AccommodationReferenceItem.Description, string.Empty },
            { Constants.Fields.StandardFields.DisplayName, string.Empty }
        },
        new DbItem("Created Room Two", ID.NewID, Constants.TemplateIds.AccommodationRoom)
        {
            { Constants.Fields.DatasourceItem.Code, string.Empty },
            { Constants.Fields.DatasourceItem.Name, string.Empty },
            { Constants.Fields.AccommodationReferenceItem.Description, string.Empty },
            { Constants.Fields.StandardFields.DisplayName, string.Empty }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var roomsFolder = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia");
                var firstRoomItem = db.GetItem("/sitecore/content/Created Room One");
                var secondRoomItem = db.GetItem("/sitecore/content/Created Room Two");

                var rooms = new List<RoomContent>
        {
            new RoomContent
            {
                VendorRoomCode = "1001",
                Name = "Duplicate Room",
                Description = "First room description."
            },
            new RoomContent
            {
                VendorRoomCode = "1002",
                Name = "Duplicate Room",
                Description = "Second room description."
            }
        };

                datasourceRepository.GetOrCreateItem(
                        "Rooms - Expedia",
                        Constants.TemplateIds.AccommodationRoomsFolder,
                        hotelItem)
                    .Returns(roomsFolder);

                datasourceRepository.GetOrCreateItem(
                        "Duplicate Room - 1001",
                        Constants.TemplateIds.AccommodationRoom,
                        roomsFolder,
                        false)
                    .Returns(firstRoomItem);

                datasourceRepository.GetOrCreateItem(
                        "Duplicate Room - 1002",
                        Constants.TemplateIds.AccommodationRoom,
                        roomsFolder,
                        false)
                    .Returns(secondRoomItem);

                sut.Create(hotelItem, rooms, "W0080001");

                datasourceRepository.Received(1).GetOrCreateItem(
                    "Duplicate Room - 1001",
                    Constants.TemplateIds.AccommodationRoom,
                    roomsFolder,
                    false);

                datasourceRepository.Received(1).GetOrCreateItem(
                    "Duplicate Room - 1002",
                    Constants.TemplateIds.AccommodationRoom,
                    roomsFolder,
                    false);

                logger.DidNotReceive().Warn(
                    Arg.Is<string>(x => x.Contains("Duplicate room code")),
                    Arg.Any<object>());

                firstRoomItem[Constants.Fields.DatasourceItem.Code]
                    .Should().Be("1001");

                firstRoomItem[Constants.Fields.DatasourceItem.Name]
                    .Should().Be("Duplicate Room");

                firstRoomItem[Constants.Fields.AccommodationReferenceItem.Description]
                    .Should().Be("First room description.");

                secondRoomItem[Constants.Fields.DatasourceItem.Code]
                    .Should().Be("1002");

                secondRoomItem[Constants.Fields.DatasourceItem.Name]
                    .Should().Be("Duplicate Room");

                secondRoomItem[Constants.Fields.AccommodationReferenceItem.Description]
                    .Should().Be("Second room description.");
            }
        }

        [Fact]
        public void Create_ShouldPrefixRoomsFolderCodeWithW_WhenExpediaCodeDoesNotStartWithW()
        {
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
            {
                { Constants.Fields.DatasourceItem.Code, string.Empty }
            }
        },
        new DbItem("Created Room", ID.NewID, Constants.TemplateIds.AccommodationRoom)
        {
            { Constants.Fields.DatasourceItem.Code, string.Empty },
            { Constants.Fields.DatasourceItem.Name, string.Empty },
            { Constants.Fields.AccommodationReferenceItem.Description, string.Empty }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var roomsFolder = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia");
                var roomItem = db.GetItem("/sitecore/content/Created Room");

                var rooms = new List<RoomContent>
        {
            new RoomContent
            {
                VendorRoomCode = "1234",
                Name = "Demo Standard Room",
                Description = "Created room description."
            }
        };

                datasourceRepository.GetOrCreateItem(
                        "Rooms - Expedia",
                        Constants.TemplateIds.AccommodationRoomsFolder,
                        hotelItem)
                    .Returns(roomsFolder);

                datasourceRepository.CreateItem(
                        "Demo Standard Room",
                        Constants.TemplateIds.AccommodationRoom,
                        roomsFolder,
                        false)
                    .Returns(roomItem);

                sut.Create(hotelItem, rooms, "0080001");

                roomsFolder[Constants.Fields.DatasourceItem.Code].Should().Be("W0080001");
            }
        }

        [Fact]
        public void Create_ShouldOnlyPrefixRoomsFolderCode_WhenExpediaCodeIsShort()
        {
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, string.Empty }
                    }
                },
                new DbItem("Created Room", ID.NewID, Constants.TemplateIds.AccommodationRoom)
                {
                    { Constants.Fields.DatasourceItem.Code, string.Empty },
                    { Constants.Fields.DatasourceItem.Name, string.Empty },
                    { Constants.Fields.AccommodationReferenceItem.Description, string.Empty }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var roomsFolder = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia");
                var roomItem = db.GetItem("/sitecore/content/Created Room");

                var rooms = new List<RoomContent>
        {
            new RoomContent
            {
                VendorRoomCode = "1234",
                Name = "Demo Standard Room",
                Description = "Created room description."
            }
        };

                datasourceRepository.GetOrCreateItem(
                        "Rooms - Expedia",
                        Constants.TemplateIds.AccommodationRoomsFolder,
                        hotelItem)
                    .Returns(roomsFolder);

                datasourceRepository.CreateItem(
                        "Demo Standard Room",
                        Constants.TemplateIds.AccommodationRoom,
                        roomsFolder,
                        false)
                    .Returns(roomItem);

                sut.Create(hotelItem, rooms, "123");

                roomsFolder[Constants.Fields.DatasourceItem.Code].Should().Be("W0000123");
            }
        }

        [Fact]
        public void Create_ShouldKeepRoomsFolderCode_WhenExpediaCodeAlreadyStartsWithW()
        {
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
            {
                { Constants.Fields.DatasourceItem.Code, string.Empty }
            }
        },
        new DbItem("Created Room", ID.NewID, Constants.TemplateIds.AccommodationRoom)
        {
            { Constants.Fields.DatasourceItem.Code, string.Empty },
            { Constants.Fields.DatasourceItem.Name, string.Empty },
            { Constants.Fields.AccommodationReferenceItem.Description, string.Empty }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var roomsFolder = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia");
                var roomItem = db.GetItem("/sitecore/content/Created Room");

                var rooms = new List<RoomContent>
        {
            new RoomContent
            {
                VendorRoomCode = "1234",
                Name = "Demo Standard Room",
                Description = "Created room description."
            }
        };

                datasourceRepository.GetOrCreateItem(
                        "Rooms - Expedia",
                        Constants.TemplateIds.AccommodationRoomsFolder,
                        hotelItem)
                    .Returns(roomsFolder);

                datasourceRepository.CreateItem(
                        "Demo Standard Room",
                        Constants.TemplateIds.AccommodationRoom,
                        roomsFolder,
                        false)
                    .Returns(roomItem);

                sut.Create(hotelItem, rooms, "W0080001");

                roomsFolder[Constants.Fields.DatasourceItem.Code].Should().Be("W0080001");
            }
        }

        [Fact]
        public void Create_ShouldCreateBedGroupInRepository_WhenRoomHasBedGroups()
        {
            // Arrange
            var hotelItem = CreateFakeItem("Hotel", Constants.TemplateIds.Accommodation).ToSitecoreItem();
            var roomsFolder = CreateRoomsFolderFakeItem()
                .ToSitecoreItem();
            var roomItem = CreateAccommodationRoomFakeItem("Created Room").ToSitecoreItem();
            var bedGroupsFolder = CreateFakeItem("Room Bed Groups", Constants.TemplateIds.BedGroupsFolder).ToSitecoreItem();
            var bedGroupItem = CreateRoomBedGroupFakeItem("37341").ToSitecoreItem();

            var rooms = new List<RoomContent>
            {
                new RoomContent
                {
                    VendorRoomCode = "1234",
                    Name = "Demo Standard Room",
                    Description = "Room with bed groups.",
                    BedGroups = new List<BedGroupContent>
                    {
                        new BedGroupContent
                        {
                            BedGroupId = "37341",
                            Description = "2 Single Beds"
                        }
                    }
                }
            };

            datasourceRepository.GetOrCreateItem(
                    "Rooms - Expedia",
                    Constants.TemplateIds.AccommodationRoomsFolder,
                    hotelItem)
                .Returns(roomsFolder);

            datasourceRepository.GetOrCreateItem(
                    "Demo Standard Room - 1234",
                    Constants.TemplateIds.AccommodationRoom,
                    roomsFolder,
                    false)
                .Returns(roomItem);

            databaseProvider.GetItem(Constants.ItemIds.BedGroupsRepository, DatabaseType.Master)
                .Returns(bedGroupsFolder);

            datasourceRepository.GetOrCreateItem(
                    "37341",
                    Constants.TemplateIds.BedGroup,
                    bedGroupsFolder)
                .Returns(bedGroupItem);

            // Act
            sut.Create(hotelItem, rooms, "W0080001");

            // Assert
            datasourceRepository.Received(1).GetOrCreateItem(
                "37341",
                Constants.TemplateIds.BedGroup,
                bedGroupsFolder);

            bedGroupItem.Fields[Constants.FieldsIds.BedGroupItem.BedGroupId].Value.Should().Be("37341");
            bedGroupItem.Fields[Constants.FieldsIds.BedGroupItem.Description].Value.Should().Be("2 Single Beds");
            roomItem.Fields[Constants.FieldsIds.AccommodationRoomItem.BedGroupTypes].Value.Should().Be(bedGroupItem.ID.ToString());
        }

        [Fact]
        public void Create_ShouldSkipBedGroups_WhenBedGroupsListIsEmpty()
        {
            // Arrange
            var hotelItem = CreateFakeItem("Hotel", Constants.TemplateIds.Accommodation).ToSitecoreItem();
            var roomsFolder = CreateRoomsFolderFakeItem()
                .ToSitecoreItem();
            var roomItem = CreateAccommodationRoomFakeItem("Created Room").ToSitecoreItem();

            var rooms = new List<RoomContent>
            {
                new RoomContent
                {
                    VendorRoomCode = "1234",
                    Name = "Demo Standard Room",
                    Description = "Room description.",
                    BedGroups = new List<BedGroupContent>()
                }
            };

            datasourceRepository.GetOrCreateItem(
                    "Rooms - Expedia",
                    Constants.TemplateIds.AccommodationRoomsFolder,
                    hotelItem)
                .Returns(roomsFolder);

            datasourceRepository.CreateItem(
                    "Demo Standard Room",
                    Constants.TemplateIds.AccommodationRoom,
                    roomsFolder,
                    false)
                .Returns(roomItem);

            // Act
            sut.Create(hotelItem, rooms, "W0080001");

            // Assert
            databaseProvider.DidNotReceive().GetItem(Constants.ItemIds.BedGroupsRepository, DatabaseType.Master);
            roomItem.Fields[Constants.FieldsIds.AccommodationRoomItem.BedGroupTypes].Value.Should().BeEmpty();
        }

        [Fact]
        public void Create_ShouldSkipBedGroup_WhenBedGroupIdIsNullOrWhitespace()
        {
            // Arrange
            var hotelItem = CreateFakeItem("Hotel", Constants.TemplateIds.Accommodation).ToSitecoreItem();
            var roomsFolder = CreateRoomsFolderFakeItem()
                .ToSitecoreItem();
            var roomItem = CreateAccommodationRoomFakeItem("Created Room").ToSitecoreItem();
            var bedGroupsFolder = CreateFakeItem("Room Bed Groups", Constants.TemplateIds.BedGroupsFolder).ToSitecoreItem();

            var rooms = new List<RoomContent>
            {
                new RoomContent
                {
                    VendorRoomCode = "1234",
                    Name = "Demo Standard Room",
                    Description = "Room description.",
                    BedGroups = new List<BedGroupContent>
                    {
                        new BedGroupContent { BedGroupId = "   ", Description = "Some bed group" }
                    }
                }
            };

            datasourceRepository.GetOrCreateItem(
                    "Rooms - Expedia",
                    Constants.TemplateIds.AccommodationRoomsFolder,
                    hotelItem)
                .Returns(roomsFolder);

            datasourceRepository.GetOrCreateItem(
                    "Demo Standard Room - 1234",
                    Constants.TemplateIds.AccommodationRoom,
                    roomsFolder,
                    false)
                .Returns(roomItem);

            databaseProvider.GetItem(Constants.ItemIds.BedGroupsRepository, DatabaseType.Master)
                .Returns(bedGroupsFolder);

            // Act
            sut.Create(hotelItem, rooms, "W0080001");

            // Assert
            datasourceRepository.DidNotReceive().GetOrCreateItem(
                Arg.Any<string>(),
                Constants.TemplateIds.BedGroup,
                bedGroupsFolder);

            logger.Received(1).Warn(
                Arg.Is<string>(x => x.Contains("Bed group with missing BedGroupId")),
                Arg.Any<object>());

            roomItem.Fields[Constants.FieldsIds.AccommodationRoomItem.BedGroupTypes].Value.Should().BeEmpty();
        }

        [Fact]
        public void Upsert_ShouldUpdateExistingRepositoryBedGroup_WhenBedGroupIdAlreadyExists()
        {
            // Arrange
            var hotelItem = CreateFakeItem("Hotel", Constants.TemplateIds.Accommodation).ToSitecoreItem();
            var roomFakeItem = CreateAccommodationRoomFakeItem("Demo Standard Room", "1234");
            var roomItem = roomFakeItem.ToSitecoreItem();
            roomItem.Versions.AddVersion().Returns(roomItem);
            var roomsFolder = CreateRoomsFolderFakeItem()
                .WithChild(roomFakeItem)
                .ToSitecoreItem();
            var bedGroupFakeItem = CreateRoomBedGroupFakeItem("BG001")
                .WithField(Constants.FieldsIds.BedGroupItem.BedGroupId, Constants.Fields.BedGroupItem.BedGroupId, "BG001")
                .WithField(Constants.FieldsIds.BedGroupItem.Description, Constants.Fields.BedGroupItem.Description, "Old description");
            var bedGroupItem = bedGroupFakeItem.ToSitecoreItem();
            bedGroupItem.Versions.AddVersion().Returns(bedGroupItem);
            var bedGroupsFolder = CreateFakeItem("Room Bed Groups", Constants.TemplateIds.BedGroupsFolder)
                .WithChild(bedGroupFakeItem)
                .ToSitecoreItem();

            var rooms = new List<RoomContent>
            {
                new RoomContent
                {
                    VendorRoomCode = "1234",
                    Name = "Demo Standard Room",
                    Description = "Room description.",
                    BedGroups = new List<BedGroupContent>
                    {
                        new BedGroupContent { BedGroupId = "BG001", Description = "Updated description" }
                    }
                }
            };

            datasourceRepository.GetOrCreateItem(
                    "Rooms - Expedia",
                    Constants.TemplateIds.AccommodationRoomsFolder,
                    hotelItem)
                .Returns(roomsFolder);

            databaseProvider.GetItem(Constants.ItemIds.BedGroupsRepository, DatabaseType.Master)
                .Returns(bedGroupsFolder);

            datasourceRepository.GetOrCreateItem(
                    "BG001",
                    Constants.TemplateIds.BedGroup,
                    bedGroupsFolder)
                .Returns(bedGroupItem);

            // Act
            sut.Upsert(hotelItem, rooms, "W0080001");

            // Assert
            datasourceRepository.Received(1).GetOrCreateItem(
                "BG001",
                Constants.TemplateIds.BedGroup,
                bedGroupsFolder);

            bedGroupItem.Fields[Constants.FieldsIds.BedGroupItem.BedGroupId].Value.Should().Be("BG001");
            bedGroupItem.Fields[Constants.FieldsIds.BedGroupItem.Description].Value.Should().Be("Updated description");
            roomItem.Fields[Constants.FieldsIds.AccommodationRoomItem.BedGroupTypes].Value.Should().Be(bedGroupItem.ID.ToString());
        }

        [Fact]
        public void Upsert_ShouldCreateMissingRepositoryBedGroup_WhenBedGroupIdDoesNotExist()
        {
            // Arrange
            var hotelItem = CreateFakeItem("Hotel", Constants.TemplateIds.Accommodation).ToSitecoreItem();
            var roomFakeItem = CreateAccommodationRoomFakeItem("Demo Standard Room")
                .WithField(CodeFieldId, Constants.Fields.DatasourceItem.Code, "1234");
            var roomItem = roomFakeItem.ToSitecoreItem();
            roomItem.Versions.AddVersion().Returns(roomItem);
            var roomsFolder = CreateRoomsFolderFakeItem()
                .WithChild(roomFakeItem)
                .ToSitecoreItem();
            var bedGroupsFolder = CreateFakeItem("Room Bed Groups", Constants.TemplateIds.BedGroupsFolder).ToSitecoreItem();
            var newBedGroupItem = CreateRoomBedGroupFakeItem("New BedGroup").ToSitecoreItem();
            newBedGroupItem.Versions.AddVersion().Returns(newBedGroupItem);

            var rooms = new List<RoomContent>
            {
                new RoomContent
                {
                    VendorRoomCode = "1234",
                    Name = "Demo Standard Room",
                    Description = "Room description.",
                    BedGroups = new List<BedGroupContent>
                    {
                        new BedGroupContent { BedGroupId = "BG001", Description = "King Bed" }
                    }
                }
            };

            datasourceRepository.GetOrCreateItem(
                    "Rooms - Expedia",
                    Constants.TemplateIds.AccommodationRoomsFolder,
                    hotelItem)
                .Returns(roomsFolder);

            databaseProvider.GetItem(Constants.ItemIds.BedGroupsRepository, DatabaseType.Master)
                .Returns(bedGroupsFolder);

            datasourceRepository.GetOrCreateItem(
                    "BG001",
                    Constants.TemplateIds.BedGroup,
                    bedGroupsFolder)
                .Returns(newBedGroupItem);

            // Act
            sut.Upsert(hotelItem, rooms, "W0080001");

            // Assert
            datasourceRepository.Received(1).GetOrCreateItem(
                "BG001",
                Constants.TemplateIds.BedGroup,
                bedGroupsFolder);

            newBedGroupItem.Fields[Constants.FieldsIds.BedGroupItem.BedGroupId].Value.Should().Be("BG001");
            newBedGroupItem.Fields[Constants.FieldsIds.BedGroupItem.Description].Value.Should().Be("King Bed");
            roomItem.Fields[Constants.FieldsIds.AccommodationRoomItem.BedGroupTypes].Value.Should().Be(newBedGroupItem.ID.ToString());
        }

        [Fact]
        public void Upsert_ShouldRetainExistingRepositoryBedGroup_WhenBedGroupIdNotInPayload()
        {
            // Arrange
            var hotelItem = CreateFakeItem("Hotel", Constants.TemplateIds.Accommodation).ToSitecoreItem();
            var roomFakeItem = CreateAccommodationRoomFakeItem("Demo Standard Room", "1234");
            var roomItem = roomFakeItem.ToSitecoreItem();
            roomItem.Versions.AddVersion().Returns(roomItem);
            var roomsFolder = CreateRoomsFolderFakeItem()
                .WithChild(roomFakeItem)
                .ToSitecoreItem();
            var existingBedGroupFakeItem = CreateRoomBedGroupFakeItem("King Bed")
                .WithField(Constants.FieldsIds.BedGroupItem.BedGroupId, Constants.Fields.BedGroupItem.BedGroupId, "BG_KING")
                .WithField(Constants.FieldsIds.BedGroupItem.Description, Constants.Fields.BedGroupItem.Description, "King Bed");
            var existingBedGroup = existingBedGroupFakeItem.ToSitecoreItem();
            var bedGroupsFolder = CreateFakeItem("Room Bed Groups", Constants.TemplateIds.BedGroupsFolder)
                .WithChild(existingBedGroupFakeItem)
                .ToSitecoreItem();
            var newBedGroup = CreateRoomBedGroupFakeItem("Queen Bed").ToSitecoreItem();
            newBedGroup.Versions.AddVersion().Returns(newBedGroup);

            var rooms = new List<RoomContent>
            {
                new RoomContent
                {
                    VendorRoomCode = "1234",
                    Name = "Demo Standard Room",
                    Description = "Room description.",
                    BedGroups = new List<BedGroupContent>
                    {
                        new BedGroupContent { BedGroupId = "BG_QUEEN", Description = "Queen Bed" }
                    }
                }
            };

            datasourceRepository.GetOrCreateItem(
                    "Rooms - Expedia",
                    Constants.TemplateIds.AccommodationRoomsFolder,
                    hotelItem)
                .Returns(roomsFolder);

            databaseProvider.GetItem(Constants.ItemIds.BedGroupsRepository, DatabaseType.Master)
                .Returns(bedGroupsFolder);

            datasourceRepository.GetOrCreateItem(
                    "BG_QUEEN",
                    Constants.TemplateIds.BedGroup,
                    bedGroupsFolder)
                .Returns(newBedGroup);

            // Act
            sut.Upsert(hotelItem, rooms, "W0080001");

            // Assert
            existingBedGroup.Should().NotBeNull();
            roomItem.Fields[Constants.FieldsIds.AccommodationRoomItem.BedGroupTypes].Value.Should().Be(newBedGroup.ID.ToString());
        }

        [Fact]
        public void Create_ShouldSkipDuplicateBedGroupId_WhenSameBedGroupIdAppearsMoreThanOnce()
        {
            // Arrange
            var hotelItem = CreateFakeItem("Hotel", Constants.TemplateIds.Accommodation).ToSitecoreItem();
            var roomsFolder = CreateRoomsFolderFakeItem()
                .ToSitecoreItem();
            var roomItem = CreateAccommodationRoomFakeItem("Created Room").ToSitecoreItem();
            var bedGroupsFolder = CreateFakeItem("Room Bed Groups", Constants.TemplateIds.BedGroupsFolder).ToSitecoreItem();
            var bedGroupItem = CreateRoomBedGroupFakeItem("King Bed").ToSitecoreItem();

            var rooms = new List<RoomContent>
            {
                new RoomContent
                {
                    VendorRoomCode = "1234",
                    Name = "Demo Standard Room",
                    Description = "Room description.",
                    BedGroups = new List<BedGroupContent>
                    {
                        new BedGroupContent { BedGroupId = "BG001", Description = "King Bed" },
                        new BedGroupContent { BedGroupId = "BG001", Description = "King Bed Duplicate" }
                    }
                }
            };

            datasourceRepository.GetOrCreateItem(
                    "Rooms - Expedia",
                    Constants.TemplateIds.AccommodationRoomsFolder,
                    hotelItem)
                .Returns(roomsFolder);

            datasourceRepository.GetOrCreateItem(
                    "Demo Standard Room - 1234",
                    Constants.TemplateIds.AccommodationRoom,
                    roomsFolder,
                    false)
                .Returns(roomItem);

            databaseProvider.GetItem(Constants.ItemIds.BedGroupsRepository, DatabaseType.Master)
                .Returns(bedGroupsFolder);

            datasourceRepository.GetOrCreateItem(
                    "BG001",
                    Constants.TemplateIds.BedGroup,
                    bedGroupsFolder)
                .Returns(bedGroupItem);

            // Act
            sut.Create(hotelItem, rooms, "W0080001");

            // Assert
            datasourceRepository.Received(1).GetOrCreateItem(
                "BG001",
                Constants.TemplateIds.BedGroup,
                bedGroupsFolder);

            logger.Received(1).Warn(
                Arg.Is<string>(x => x.Contains("Duplicate BedGroupId")),
                Arg.Any<object>());

            bedGroupItem.Fields[Constants.FieldsIds.BedGroupItem.BedGroupId].Value.Should().Be("BG001");
            bedGroupItem.Fields[Constants.FieldsIds.BedGroupItem.Description].Value.Should().Be("King Bed");
            roomItem.Fields[Constants.FieldsIds.AccommodationRoomItem.BedGroupTypes].Value.Should().Be(bedGroupItem.ID.ToString());
        }

        [Fact]
        public void Upsert_ShouldRetainExistingRoom_WhenRoomNotInPayload()
        {
            // DECISION: same applies to room types — do not delete (Teams chat 2026-06-19)
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, string.Empty },
                        new DbItem("King Suite", ID.NewID, Constants.TemplateIds.AccommodationRoom)
                        {
                            { Constants.Fields.DatasourceItem.Code, string.Empty },
                            { Constants.Fields.DatasourceItem.Name, "King Suite" },
                            { Constants.Fields.AccommodationReferenceItem.Description, string.Empty }
                        }
                    }
                },
                new DbItem("Standard Room", ID.NewID, Constants.TemplateIds.AccommodationRoom)
                {
                    { Constants.Fields.DatasourceItem.Code, string.Empty },
                    { Constants.Fields.DatasourceItem.Name, string.Empty },
                    { Constants.Fields.AccommodationReferenceItem.Description, string.Empty }
                }
            })
            {
                // Arrange
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var roomsFolder = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia");
                var existingRoom = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia/King Suite");

                // Payload does NOT contain "King Suite" — only a different room
                var rooms = new List<RoomContent>
                {
                    new RoomContent { Name = "Standard Room", Description = "New room." }
                };

                datasourceRepository.GetOrCreateItem(
                        "Rooms - Expedia",
                        Constants.TemplateIds.AccommodationRoomsFolder,
                        hotelItem)
                    .Returns(roomsFolder);

                datasourceRepository.CreateItem(
                        "Standard Room",
                        Constants.TemplateIds.AccommodationRoom,
                        roomsFolder,
                        false)
                    .Returns(db.GetItem("/sitecore/content/Standard Room"));

                // Act
                sut.Upsert(hotelItem, rooms, "W0080001");

                // Assert — existing "King Suite" room is NOT deleted
                db.GetItem(existingRoom.ID).Should().NotBeNull();
            }
        }

        private static FakeItem CreateFakeItem(string name, ID templateId)
        {
            return new FakeItem()
                .WithName(name)
                .WithTemplate(templateId);
        }

        private static FakeItem CreateAccommodationRoomFakeItem(string name, string code = "")
        {
            return CreateFakeItem(name, Constants.TemplateIds.AccommodationRoom)
                .WithField(CodeFieldId, Constants.Fields.DatasourceItem.Code, code)
                .WithField(NameFieldId, Constants.Fields.DatasourceItem.Name, string.Empty)
                .WithField(DescriptionFieldId, Constants.Fields.AccommodationReferenceItem.Description, string.Empty)
                .WithField(Sitecore.FieldIDs.DisplayName, Constants.Fields.StandardFields.DisplayName, string.Empty)
                .WithField(Constants.FieldsIds.AccommodationRoomItem.BedGroupTypes, Constants.Fields.AccommodationRoomItem.BedGroupTypes, string.Empty)
                .WithItemVersions()
                .WithItemEditing();
        }

        private static FakeItem CreateRoomsFolderFakeItem()
        {
            return CreateFakeItem("Rooms - Expedia", Constants.TemplateIds.AccommodationRoomsFolder)
                .WithField(CodeFieldId, Constants.Fields.DatasourceItem.Code, string.Empty)
                .WithItemEditing();
        }

        private static FakeItem CreateRoomBedGroupFakeItem(string name)
        {
            return CreateFakeItem(name, Constants.TemplateIds.BedGroup)
                .WithField(Constants.FieldsIds.BedGroupItem.BedGroupId, Constants.Fields.BedGroupItem.BedGroupId, string.Empty)
                .WithField(Constants.FieldsIds.BedGroupItem.Description, Constants.Fields.BedGroupItem.Description, string.Empty)
                .WithItemVersions()
                .WithItemEditing();
        }
    }
}

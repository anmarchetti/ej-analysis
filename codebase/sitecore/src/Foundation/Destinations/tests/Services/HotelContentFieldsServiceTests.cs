using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class HotelContentFieldsServiceTests
    {
        private readonly IAirportsService airportsService;
        private readonly HotelContentFieldsService service;

        public HotelContentFieldsServiceTests()
        {
            airportsService = Substitute.For<IAirportsService>();
            service = new HotelContentFieldsService(airportsService);
        }

        [Fact]
        public void Populate_ShouldUpdateHotelFields_WhenRequestContainsValues()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel")
                {
                    { Constants.Fields.DatasourceItem.Name, string.Empty },
                    { Constants.Fields.DatasourceItem.Code, string.Empty },
                    { Constants.Fields.AccommodationItem.GiataCode, string.Empty },
                    { Constants.Fields.AccommodationItem.Description, string.Empty },
                    { Constants.Fields.AccommodationItem.StarRating, string.Empty },
                    { Constants.Fields.AccommodationItem.Address, string.Empty },
                    { Constants.Fields.AccommodationItem.City, string.Empty },
                    { Constants.Fields.AccommodationItem.PostalCode, string.Empty },
                    { Constants.Fields.AccommodationItem.Resort, string.Empty },
                    { Constants.Fields.AccommodationItem.Website, string.Empty },
                    { Constants.Fields.AccommodationItem.Email, string.Empty },
                    { Constants.Fields.AccommodationItem.BookingPhone, string.Empty },
                    { Constants.Fields.AccommodationItem.HotelPhone, string.Empty },
                    { Constants.Fields.AccommodationItem.FaxNumber, string.Empty },
                    { Constants.Fields.AccommodationItem.Longitude, string.Empty },
                    { Constants.Fields.AccommodationItem.Latitude, string.Empty },
                    { Constants.Fields.AccommodationItem.Strapline, string.Empty },
                    { Constants.Fields.AccommodationItem.KeySellingPoint1, string.Empty },
                    { Constants.Fields.MetaData.TrackingPageTitle, string.Empty },
                    { Constants.Fields.AccommodationItem.TripAdvisorId, string.Empty },
                    { Constants.Fields.POIs.Subtitle, string.Empty }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = new UpsertHotelRequest
                {
                    Name = "Demo Krakow Hotel One",
                    Code = "W0080001",
                    GiataCode = "36363636",
                    HotelDescription = "Updated description",
                    StarRating = 4,
                    Address = "Demo Krakow Street 10",
                    City = "Krakow",
                    PostalCode = "310001",
                    Website = "https://demo-krakow-hotel-one.com",
                    Email = "demo-krakow-one@hotel.com",
                    BookingPhone = "+48111222335",
                    Phone = "+48111222333",
                    FaxNumber = "+48111222334",
                    Longitude = 19.944m,
                    Latitude = 50.064m,
                    StrapLine = "Demo Expedia hotel in Krakow City",
                    KeySellingPoint1 = "Created under an existing resort hierarchy",
                    TrackingPageTitle = "Demo Krakow Hotel One Tracking Page Title",
                    TripAdvisorId = "TA123456",
                    Subtitle = "Demo subtitle",
                    Resort = new DestinationBase
                    {
                        Code = "PLKRKR",
                        Name = "Krakow City"
                    }
                };

                // Act
                service.Populate(hotelItem, request, createNewVersion: false, populateNewExpediaDefaults: false);

                // Assert
                hotelItem[Constants.Fields.DatasourceItem.Name].Should().Be(request.Name);
                hotelItem[Constants.Fields.DatasourceItem.Code].Should().Be(request.Code);
                hotelItem[Constants.Fields.AccommodationItem.GiataCode].Should().Be(request.GiataCode);
                hotelItem[Constants.Fields.AccommodationItem.Description].Should().Be(request.HotelDescription);
                hotelItem[Constants.Fields.AccommodationItem.StarRating].Should().Be("4");
                hotelItem[Constants.Fields.AccommodationItem.Address].Should().Be(request.Address);
                hotelItem[Constants.Fields.AccommodationItem.City].Should().Be(request.City);
                hotelItem[Constants.Fields.AccommodationItem.PostalCode].Should().Be(request.PostalCode);
                hotelItem[Constants.Fields.AccommodationItem.Resort].Should().Be(request.Resort.Name);
                hotelItem[Constants.Fields.AccommodationItem.Website].Should().Be(request.Website);
                hotelItem[Constants.Fields.AccommodationItem.Email].Should().Be(request.Email);
                hotelItem[Constants.Fields.AccommodationItem.BookingPhone].Should().Be(request.BookingPhone);
                hotelItem[Constants.Fields.AccommodationItem.HotelPhone].Should().Be(request.Phone);
                hotelItem[Constants.Fields.AccommodationItem.FaxNumber].Should().Be(request.FaxNumber);
                hotelItem[Constants.Fields.AccommodationItem.Longitude].Should().Be("19.944");
                hotelItem[Constants.Fields.AccommodationItem.Latitude].Should().Be("50.064");
                hotelItem[Constants.Fields.AccommodationItem.Strapline].Should().Be(request.StrapLine);
                hotelItem[Constants.Fields.AccommodationItem.KeySellingPoint1].Should().Be(request.KeySellingPoint1);
                hotelItem[Constants.Fields.MetaData.TrackingPageTitle].Should().Be(request.TrackingPageTitle);
                hotelItem[Constants.Fields.AccommodationItem.TripAdvisorId].Should().Be(request.TripAdvisorId);
                hotelItem[Constants.Fields.POIs.Subtitle].Should().Be(request.Subtitle);

                airportsService.DidNotReceiveWithAnyArgs()
                    .GetAccommodationAirportsField(default(Sitecore.Data.Items.Item), default(IEnumerable<string>), default(string));
            }
        }

        [Fact]
        public void Populate_ShouldPopulateAirports_WhenAirportCodesAreProvided()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel")
                {
                    { Constants.Fields.AccommodationItem.Airports, string.Empty }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = new UpsertHotelRequest
                {
                    AirportCodes = new List<string> { "cdg", " ORY ", "CDG" }
                };

                var expectedAirportsValue = "{11111111-1111-1111-1111-111111111111}|{22222222-2222-2222-2222-222222222222}";

                airportsService
                    .GetAccommodationAirportsField(
                        hotelItem,
                        Arg.Is<IEnumerable<string>>(x =>
                            x != null &&
                            x.Contains("CDG") &&
                            x.Contains("ORY")),
                        null)
                    .Returns(expectedAirportsValue);

                // Act
                service.Populate(hotelItem, request, createNewVersion: false, populateNewExpediaDefaults: false);

                // Assert
                hotelItem[Constants.Fields.AccommodationItem.Airports].Should().Be(expectedAirportsValue);

                airportsService.Received(1)
                    .GetAccommodationAirportsField(
                        hotelItem,
                        Arg.Is<IEnumerable<string>>(x =>
                            x != null &&
                            x.Contains("CDG") &&
                            x.Contains("ORY")),
                        null);
            }
        }

        [Fact]
        public void Populate_ShouldNotPopulateAirports_WhenAirportCodesAreNull()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel")
                {
                    { Constants.Fields.AccommodationItem.Airports, "existing-airports-value" }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = new UpsertHotelRequest
                {
                    AirportCodes = null
                };

                // Act
                service.Populate(hotelItem, request, createNewVersion: false, populateNewExpediaDefaults: false);

                // Assert
                hotelItem[Constants.Fields.AccommodationItem.Airports].Should().Be("existing-airports-value");

                airportsService.DidNotReceiveWithAnyArgs()
                    .GetAccommodationAirportsField(default(Sitecore.Data.Items.Item), default(IEnumerable<string>), default(string));
            }
        }

        [Fact]
        public void Populate_ShouldNotPopulateAirports_WhenAirportCodesAreEmpty()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel")
                {
                    { Constants.Fields.AccommodationItem.Airports, "existing-airports-value" }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = new UpsertHotelRequest
                {
                    AirportCodes = new List<string>()
                };

                // Act
                service.Populate(hotelItem, request, createNewVersion: false, populateNewExpediaDefaults: false);

                // Assert
                hotelItem[Constants.Fields.AccommodationItem.Airports].Should().Be("existing-airports-value");

                airportsService.DidNotReceiveWithAnyArgs()
                    .GetAccommodationAirportsField(default(Sitecore.Data.Items.Item), default(IEnumerable<string>), default(string));
            }
        }

        [Fact]
        public void Populate_ShouldNotOverwriteAirports_WhenResolvedAirportsValueIsEmpty()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel")
                {
                    { Constants.Fields.AccommodationItem.Airports, "existing-airports-value" }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = new UpsertHotelRequest
                {
                    AirportCodes = new List<string> { "UNKNOWN" }
                };

                airportsService
                    .GetAccommodationAirportsField(
                        hotelItem,
                        Arg.Any<IEnumerable<string>>(),
                        null)
                    .Returns(string.Empty);

                // Act
                service.Populate(hotelItem, request, createNewVersion: false, populateNewExpediaDefaults: false);

                // Assert
                hotelItem[Constants.Fields.AccommodationItem.Airports].Should().Be("existing-airports-value");

                airportsService.Received(1)
                    .GetAccommodationAirportsField(
                        hotelItem,
                        Arg.Any<IEnumerable<string>>(),
                        null);
            }
        }

        [Fact]
        public void Populate_ShouldUseHotelPhone_WhenHotelPhoneIsProvided()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel")
                {
                    { Constants.Fields.AccommodationItem.HotelPhone, string.Empty }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = new UpsertHotelRequest
                {
                    Phone = "+48111111111",
                    HotelPhone = "+48222222222"
                };

                // Act
                service.Populate(hotelItem, request, createNewVersion: false, populateNewExpediaDefaults: false);

                // Assert
                hotelItem[Constants.Fields.AccommodationItem.HotelPhone].Should().Be(request.HotelPhone);
            }
        }

        [Fact]
        public void Populate_ShouldUsePhoneAsBookingPhone_WhenBookingPhoneIsNotProvided()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel")
                {
                    { Constants.Fields.AccommodationItem.BookingPhone, string.Empty }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = new UpsertHotelRequest
                {
                    Phone = "+48111111111",
                    BookingPhone = null
                };

                // Act
                service.Populate(hotelItem, request, createNewVersion: false, populateNewExpediaDefaults: false);

                // Assert
                hotelItem[Constants.Fields.AccommodationItem.BookingPhone].Should().Be(request.Phone);
            }
        }

        [Fact]
        public void Populate_ShouldNotOverwriteField_WhenRequestValueIsNull()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel")
                {
                    { Constants.Fields.AccommodationItem.Email, "existing@email.com" }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = new UpsertHotelRequest
                {
                    Email = null
                };

                // Act
                service.Populate(hotelItem, request, createNewVersion: false, populateNewExpediaDefaults: false);

                // Assert
                hotelItem[Constants.Fields.AccommodationItem.Email].Should().Be("existing@email.com");
            }
        }

        [Fact]
        public void Populate_ShouldNotOverwriteField_WhenRequestValueIsEmptyOrWhiteSpace()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel")
                {
                    { Constants.Fields.AccommodationItem.Email, "existing@email.com" },
                    { Constants.Fields.POIs.Subtitle, "Existing subtitle" }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = new UpsertHotelRequest
                {
                    Email = string.Empty,
                    Subtitle = " "
                };

                // Act
                service.Populate(hotelItem, request, createNewVersion: false, populateNewExpediaDefaults: false);

                // Assert
                hotelItem[Constants.Fields.AccommodationItem.Email].Should().Be("existing@email.com");
                hotelItem[Constants.Fields.POIs.Subtitle].Should().Be("Existing subtitle");
            }
        }

        [Fact]
        public void Populate_ShouldPopulateRobotsAndChangeFrequency_WhenNewExpediaDefaultsAreRequested()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel")
                {
                    { Constants.Fields.MetaData.Robots, string.Empty },
                    { Constants.Fields.SitemapBase.ChangeFrequency, string.Empty }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var request = new UpsertHotelRequest();

                var expectedRobotsValue = string.Join(
                    "|",
                    Constants.RobotsIds.NoFollowId.ToString(),
                    Constants.RobotsIds.NoIndexId.ToString());

                var expectedChangeFrequencyValue = Constants.ChangeFrequencyDoNotIncludeId.ToString();

                // Act
                service.Populate(
                    hotelItem,
                    request,
                    createNewVersion: false,
                    populateNewExpediaDefaults: true);

                // Assert
                hotelItem[Constants.Fields.MetaData.Robots].Should().Be(expectedRobotsValue);
                hotelItem[Constants.Fields.SitemapBase.ChangeFrequency].Should().Be(expectedChangeFrequencyValue);
            }
        }

        [Fact]
        public void Populate_ShouldNotPopulateRobotsAndChangeFrequency_WhenNewExpediaDefaultsAreNotRequested()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel")
                {
                    { Constants.Fields.MetaData.Robots, string.Empty },
                    { Constants.Fields.SitemapBase.ChangeFrequency, string.Empty },
                    { Constants.Fields.DatasourceItem.Name, string.Empty }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = new UpsertHotelRequest
                {
                    Name = "Demo Hotel"
                };

                // Act
                service.Populate(
                    hotelItem,
                    request,
                    createNewVersion: false,
                    populateNewExpediaDefaults: false);

                // Assert
                hotelItem[Constants.Fields.DatasourceItem.Name].Should().Be(request.Name);
                hotelItem[Constants.Fields.MetaData.Robots].Should().BeEmpty();
                hotelItem[Constants.Fields.SitemapBase.ChangeFrequency].Should().BeEmpty();
            }
        }

        [Fact]
        public void Populate_ShouldThrowArgumentNullException_WhenHotelItemIsNull()
        {
            // Arrange
            var request = new UpsertHotelRequest();

            // Act
            Action act = () => service.Populate(null, request, createNewVersion: false, populateNewExpediaDefaults: false);

            // Assert
            act.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void Populate_ShouldThrowArgumentNullException_WhenRequestIsNull()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel")
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                Action act = () => service.Populate(hotelItem, null, createNewVersion: false, populateNewExpediaDefaults: false);

                // Assert
                act.Should().Throw<ArgumentNullException>();
            }
        }
    }
}
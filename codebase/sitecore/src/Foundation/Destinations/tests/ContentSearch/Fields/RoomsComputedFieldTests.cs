using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Integration;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.ContentSearch;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class RoomsComputedFieldTests
    {
        private readonly RoomsComputedField roomsComputedField;
        private readonly IIntegrationService integrationService;
        private readonly IDestinationsLogger logger;

        public RoomsComputedFieldTests()
        {
            integrationService = Substitute.For<IIntegrationService>();
            logger = Substitute.For<IDestinationsLogger>();
            roomsComputedField = new RoomsComputedField(integrationService, logger);
        }

        [Fact]
        public void ComputeField_ShouldBeNotNull_IfRoomCodeIsEmpty()
        {
            // Arrange
            var accommodationItem = new FakeItem();

            var roomFolder1 = new FakeItem()
                .WithTemplate(Constants.TemplateIds.AccommodationRoomsFolder)
                .WithField(Constants.Fields.DatasourceItem.Code, string.Empty);

            accommodationItem.WithChild(roomFolder1);

            // Act
            var computedFieldValue = roomsComputedField.ComputeField(new SitecoreIndexableItem(accommodationItem)) as string;
            var actual = JsonConvert.DeserializeObject<Dictionary<string, HotelRoom[]>>(computedFieldValue);

            // Assert
            computedFieldValue.Should().NotBeNullOrWhiteSpace();
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void ComputeField_ShouldBeNotNull_IfHotelHasRoomFolder(string code1)
        {
            // Arrange
            var accommodationItem = new FakeItem();

            var roomFolder1 = new FakeItem()
                .WithTemplate(Constants.TemplateIds.AccommodationRoomsFolder)
                .WithField(Constants.Fields.DatasourceItem.Code, code1);

            accommodationItem.WithChild(roomFolder1);

            // Act
            var computedFieldValue = roomsComputedField.ComputeField(new SitecoreIndexableItem(accommodationItem)) as string;
            var actual = JsonConvert.DeserializeObject<Dictionary<string, HotelRoom[]>>(computedFieldValue);

            // Assert
            computedFieldValue.Should().NotBeNullOrWhiteSpace();
            actual.Should().BeEmpty();
            actual.Should().NotContainKey(code1);
        }

        [Fact]
        public void ComputeField_ShouldBeNotNull_IfRoomsFolderHasRoom()
        {
            // Arrange
            var code = "X9273811";
            var accommodationItem = new FakeItem();
            var accommodationRoom = new FakeItem()
                .WithTemplate(Constants.TemplateIds.AccommodationRoom)
                .WithField(Constants.Fields.AccommodationRoomItem.RoomType, string.Empty);
            var roomFolder1 = new FakeItem()
                .WithName("Rooms - HBG")
                .WithTemplate(Constants.TemplateIds.AccommodationRoomsFolder)
                .WithField(Constants.Fields.DatasourceItem.Code, code)
                .WithChild(accommodationRoom);
            integrationService.SetIntegrationStrategy(code).Returns(integrationService);
            integrationService.FormatNameWithAbbv(Constants.Fields.AccommodationItem.Rooms).Returns("Rooms - HBG");
            accommodationItem.WithChild(roomFolder1);

            // Act
            var computedFieldValue = roomsComputedField.ComputeField(new SitecoreIndexableItem(accommodationItem)) as string;
            var actual = JsonConvert.DeserializeObject<Dictionary<string, HotelRoom[]>>(computedFieldValue);

            // Assert
            computedFieldValue.Should().NotBeNullOrWhiteSpace();
            actual.Should().NotBeEmpty();
            actual.Should().ContainKey(code);
            actual[code].Should().BeEmpty();
        }

        [Fact]
        public void ComputeField_ShouldBeNotNull_IfRoomsNotDoesNotMatchIntegrationStrategy()
        {
            // Arrange
            var code = "X9273811";
            var accommodationItem = new FakeItem();
            var accommodationRoom = new FakeItem()
                .WithTemplate(Constants.TemplateIds.AccommodationRoom)
                .WithField(Constants.Fields.AccommodationRoomItem.RoomType, string.Empty);
            var roomFolder1 = new FakeItem()
                .WithName(string.Empty)
                .WithTemplate(Constants.TemplateIds.AccommodationRoomsFolder)
                .WithField(Constants.Fields.DatasourceItem.Code, code)
                .WithChild(accommodationRoom);
            integrationService.SetIntegrationStrategy(code).Returns(integrationService);
            integrationService.FormatNameWithAbbv(Constants.Fields.AccommodationItem.Rooms).Returns("Rooms - HBG");
            accommodationItem.WithChild(roomFolder1);

            // Act
            var computedFieldValue = roomsComputedField.ComputeField(new SitecoreIndexableItem(accommodationItem)) as string;
            var actual = JsonConvert.DeserializeObject<Dictionary<string, HotelRoom[]>>(computedFieldValue);

            // Assert
            computedFieldValue.Should().NotBeNullOrWhiteSpace();
            actual.Should().NotBeEmpty();
            actual.Should().ContainKey(code);
        }

        [Fact]
        public void ComputeField_ShouldIncludeBedGroups_ForExpediaRoomFolder()
        {
            // Arrange — Expedia room folder code (prefix 'W') routes through the Expedia mapping,
            // which initialises BedGroups (empty here). The standard mapping leaves BedGroups null.
            var code = "W0866875";
            var accommodationItem = new FakeItem();
            var accommodationRoom = new FakeItem()
                .WithTemplate(Constants.TemplateIds.AccommodationRoom)
                .WithField(Constants.Fields.AccommodationRoomItem.RoomType, string.Empty)
                .WithField(Constants.Fields.DatasourceItem.Code, "ROOM1")
                .WithField(Constants.Fields.DatasourceItem.Name, "Double Room")
                .WithField(Constants.Fields.AccommodationReferenceItem.Content, string.Empty)
                .WithField(Constants.Fields.AccommodationReferenceItem.Description, string.Empty);
            var roomFolder = new FakeItem()
                .WithName("Rooms - expedia")
                .WithTemplate(Constants.TemplateIds.AccommodationRoomsFolder)
                .WithField(Constants.Fields.DatasourceItem.Code, code)
                .WithChild(accommodationRoom);
            integrationService.SetIntegrationStrategy(code).Returns(integrationService);
            integrationService.FormatNameWithAbbv(Constants.Fields.AccommodationItem.Rooms).Returns("Rooms - expedia");
            accommodationItem.WithChild(roomFolder);

            // Act
            var computedFieldValue = roomsComputedField.ComputeField(new SitecoreIndexableItem(accommodationItem)) as string;
            var actual = JsonConvert.DeserializeObject<Dictionary<string, HotelRoom[]>>(computedFieldValue);

            // Assert
            actual.Should().ContainKey(code);
            actual[code].Should().ContainSingle();
            actual[code][0].BedGroups.Should().NotBeNull(
                because: "the Expedia mapping projects bed groups, so the property is initialised even when empty");
        }

        [Fact]
        public void ComputeField_ShouldReturnNull_IfHotelHasNoRoomFolders()
        {
            // Arrange
            var item = new FakeItem();
            ChildList list = null;
            item.ToSitecoreItem().Children.Returns(list);

            // Act
            var actual = roomsComputedField.ComputeField(new SitecoreIndexableItem(item));

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeField_ShouldBeNull_IfHotelIsNull()
        {
            // Act
            var actual = roomsComputedField.ComputeField(null);

            // Assert
            actual.Should().BeNull();
        }
    }
}

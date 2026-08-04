using System;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Helpers;
using easyJet.Foundation.Destinations.Models.Responses;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Helpers
{
    public class HotelTypeHelperTests
    {
        [Fact]
        public void ResolveHotelType_ShouldThrow_WhenDocumentIsNull()
        {
            // Act
            Action act = () => HotelTypeHelper.ResolveHotelType((HotelSearchResultItem)null);

            // Assert
            act.Should().Throw<InvalidOperationException>()
                .WithMessage("*does not contain a valid source code.");
        }

        [Fact]
        public void ResolveHotelType_ShouldThrow_WhenSourceCodesAreNull()
        {
            // Arrange
            var document = new HotelSearchResultItem
            {
                SourceCodes = null
            };

            // Act
            Action act = () => HotelTypeHelper.ResolveHotelType(document);

            // Assert
            act.Should().Throw<InvalidOperationException>()
                .WithMessage("*does not contain a valid source code.");
        }

        [Fact]
        public void ResolveHotelType_ShouldThrow_WhenSourceCodesAreEmpty()
        {
            // Arrange
            var document = new HotelSearchResultItem
            {
                SourceCodes = new string[0]
            };

            // Act
            Action act = () => HotelTypeHelper.ResolveHotelType(document);

            // Assert
            act.Should().Throw<InvalidOperationException>()
                .WithMessage("*does not contain a valid source code.");
        }

        [Fact]
        public void ResolveHotelType_ShouldThrow_WhenSourceCodeIsWhitespace()
        {
            // Arrange
            var document = new HotelSearchResultItem
            {
                SourceCodes = new[] { "   " }
            };

            // Act
            Action act = () => HotelTypeHelper.ResolveHotelType(document);

            // Assert
            act.Should().Throw<InvalidOperationException>()
                .WithMessage("*does not contain a valid source code.");
        }

        [Fact]
        public void ResolveHotelType_ShouldReturnRegular_WhenMoreThanOneValidSourceCodeExists()
        {
            // Arrange
            var document = new HotelSearchResultItem
            {
                SourceCodes = new[] { "W123456", "X123456" }
            };

            // Act
            var actual = HotelTypeHelper.ResolveHotelType(document);

            // Assert
            actual.Should().Be(HotelSourceType.Regular);
        }

        [Fact]
        public void ResolveHotelType_ShouldReturnExpedia_WhenSingleExpediaSourceCodeExists()
        {
            // Arrange
            var document = new HotelSearchResultItem
            {
                SourceCodes = new[] { "W123456" }
            };

            // Act
            var actual = HotelTypeHelper.ResolveHotelType(document);

            // Assert
            actual.Should().Be(HotelSourceType.Expedia);
        }

        [Fact]
        public void ResolveHotelType_ShouldReturnHotelBeds_WhenSingleHotelBedsSourceCodeExists()
        {
            // Arrange
            var document = new HotelSearchResultItem
            {
                SourceCodes = new[] { "X123456" }
            };

            // Act
            var actual = HotelTypeHelper.ResolveHotelType(document);

            // Assert
            actual.Should().Be(HotelSourceType.HotelBeds);
        }

        [Fact]
        public void ResolveHotelType_ShouldReturnRegular_WhenSingleUnknownSourceCodeExists()
        {
            // Arrange
            var document = new HotelSearchResultItem
            {
                SourceCodes = new[] { "A123456" }
            };

            // Act
            var actual = HotelTypeHelper.ResolveHotelType(document);

            // Assert
            actual.Should().Be(HotelSourceType.Regular);
        }

        [Fact]
        public void ResolveExpediaRoomTypes_ShouldReturnEmpty_WhenHotelItemIsNull()
        {
            // Act
            var actual = HotelTypeHelper.ResolveExpediaRoomTypes(null);

            // Assert
            actual.Should().NotBeNull();
            actual.Should().BeEmpty();
        }

        [Fact]
        public void ResolveExpediaRoomTypes_ShouldReturnEmpty_WhenNoExpediaRoomsFolderExists()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem("Rooms - HotelBeds", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, "X0080001" }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                var actual = HotelTypeHelper.ResolveExpediaRoomTypes(hotelItem);

                // Assert
                actual.Should().NotBeNull();
                actual.Should().BeEmpty();
            }
        }

        [Fact]
        public void ResolveExpediaRoomTypes_ShouldReturnEmpty_WhenExpediaRoomsFolderHasNoRooms()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, "W0080001" }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                var actual = HotelTypeHelper.ResolveExpediaRoomTypes(hotelItem);

                // Assert
                actual.Should().NotBeNull();
                actual.Should().BeEmpty();
            }
        }

        [Fact]
        public void ResolveExpediaRoomTypes_ShouldReturnOnlyRoomsFromExpediaRoomsFolder()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, "W0080001" },
                        new DbItem("Expedia Room", ID.NewID, Constants.TemplateIds.AccommodationRoom)
                        {
                            { Constants.Fields.DatasourceItem.Code, "EXP-RM1" },
                            { Constants.Fields.DatasourceItem.Name, "Expedia Room 1" },
                            { Constants.Fields.AccommodationReferenceItem.Content, "Expedia content" },
                            { Constants.Fields.AccommodationReferenceItem.Description, "Expedia description" }
                        }
                    },
                    new DbItem("Rooms - HotelBeds", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, "X0080001" },
                        new DbItem("HotelBeds Room", ID.NewID, Constants.TemplateIds.AccommodationRoom)
                        {
                            { Constants.Fields.DatasourceItem.Code, "HBG-RM1" },
                            { Constants.Fields.DatasourceItem.Name, "HotelBeds Room 1" },
                            { Constants.Fields.AccommodationReferenceItem.Content, "HotelBeds content" },
                            { Constants.Fields.AccommodationReferenceItem.Description, "HotelBeds description" }
                        }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                var actual = HotelTypeHelper.ResolveExpediaRoomTypes(hotelItem);

                // Assert
                actual.Should().HaveCount(1);
                actual[0].Code.Should().Be("EXP-RM1");
                actual[0].Name.Should().Be("Expedia Room 1");
                actual[0].Content.Should().Be("Expedia content");
                actual[0].Description.Should().Be("Expedia description");
            }
        }

        [Fact]
        public void ResolveExpediaRoomTypes_ShouldReturnRoomFacilities_WhenShowOnSiteIsNotChecked()
        {
            // Arrange
            var facilityTypeId = ID.NewID;

            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, "W0080001" },
                        new DbItem("Expedia Room", ID.NewID, Constants.TemplateIds.AccommodationRoom)
                        {
                            { Constants.Fields.DatasourceItem.Code, "EXP-RM1" },
                            { Constants.Fields.DatasourceItem.Name, "Expedia Room 1" },
                            { Constants.Fields.AccommodationReferenceItem.Content, string.Empty },
                            { Constants.Fields.AccommodationReferenceItem.Description, string.Empty },
                            new DbItem("Facilities", ID.NewID, Constants.TemplateIds.RoomFacilitiesFolder)
                            {
                                new DbItem("Mini fridge", ID.NewID, Constants.TemplateIds.RoomFacility)
                                {
                                    { Constants.Fields.BaseFacilityItem.FacilityType, facilityTypeId.ToString() },
                                    { Constants.Fields.BaseAppearance.ShowOnSite, string.Empty }
                                }
                            }
                        }
                    }
                },
                new DbItem("Mini fridge Type", facilityTypeId, Constants.TemplateIds.FacilityType)
                {
                    { Constants.Fields.DatasourceItem.Code, "135" },
                    { Constants.Fields.DatasourceItem.Name, "Mini fridge" },
                    { Constants.Fields.BaseAppearance.ShowOnSite, string.Empty }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                var actual = HotelTypeHelper.ResolveExpediaRoomTypes(hotelItem);

                // Assert
                actual.Should().HaveCount(1);
                actual[0].Facilities.Should().NotBeNull();

                var roomFacilities = actual[0].Facilities.ToList();

                roomFacilities.Should().HaveCount(1);
                roomFacilities[0].Name.Should().Be("Mini fridge");
                roomFacilities[0].FacilityCode.Should().Be("135");
            }
        }

        [Fact]
        public void ResolveHotelType_ShouldThrowArgumentNullException_WhenHotelItemIsNull()
        {
            // Act
            Action act = () => HotelTypeHelper.ResolveHotelType((Sitecore.Data.Items.Item)null);

            // Assert
            act.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void ResolveHotelType_ShouldReturnExpedia_WhenAccommodationRoomsFolderHasExpediaCode()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, "W0080001" }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                var actual = HotelTypeHelper.ResolveHotelType(hotelItem);

                // Assert
                actual.Should().Be(HotelSourceType.Expedia);
            }
        }

        [Fact]
        public void ResolveHotelType_ShouldReturnHotelBeds_WhenAccommodationRoomsFolderHasHotelBedsCode()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem("Rooms - HotelBeds", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, "X0080001" }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                var actual = HotelTypeHelper.ResolveHotelType(hotelItem);

                // Assert
                actual.Should().Be(HotelSourceType.HotelBeds);
            }
        }

        [Fact]
        public void ResolveHotelType_ShouldReturnRegular_WhenMoreThanOneAccommodationRoomsFolderHasValidCode()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
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

                // Act
                var actual = HotelTypeHelper.ResolveHotelType(hotelItem);

                // Assert
                actual.Should().Be(HotelSourceType.Regular);
            }
        }

        [Fact]
        public void ResolveHotelType_ShouldReturnRegular_WhenSingleAccommodationRoomsFolderHasUnknownCode()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem("Rooms - Unknown", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, "A0080001" }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                var actual = HotelTypeHelper.ResolveHotelType(hotelItem);

                // Assert
                actual.Should().Be(HotelSourceType.Regular);
            }
        }

        [Fact]
        public void ResolveHotelType_ShouldIgnoreNonAccommodationRoomsFolderChildren()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem("Images", ID.NewID, Constants.TemplateIds.ImagesFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, "W0080001" }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                Action act = () => HotelTypeHelper.ResolveHotelType(hotelItem);

                // Assert
                act.Should().Throw<InvalidOperationException>()
                    .WithMessage($"Hotel {hotelItem.ID} does not contain a valid source code.");
            }
        }

        [Fact]
        public void ResolveHotelType_ShouldThrow_WhenAccommodationRoomsFolderHasEmptyCode()
        {
            // Arrange
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

                // Act
                Action act = () => HotelTypeHelper.ResolveHotelType(hotelItem);

                // Assert
                act.Should().Throw<InvalidOperationException>()
                    .WithMessage($"Hotel {hotelItem.ID} does not contain a valid source code.");
            }
        }

        [Fact]
        public void ResolveHotelType_ShouldTrimRoomFolderCode()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, "  W0080001  " }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                var actual = HotelTypeHelper.ResolveHotelType(hotelItem);

                // Assert
                actual.Should().Be(HotelSourceType.Expedia);
            }
        }

        [Fact]
        public void ResolveExpediaRoomTypes_ShouldReturnBedGroupsFromExpediaRoom()
        {
            // Arrange
            var firstBedGroupId = ID.NewID;
            var secondBedGroupId = ID.NewID;

            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        { Constants.Fields.DatasourceItem.Code, "W0080001" },
                        new DbItem("Expedia Room", ID.NewID, Constants.TemplateIds.AccommodationRoom)
                        {
                            { Constants.Fields.DatasourceItem.Code, "EXP-RM1" },
                            { Constants.Fields.DatasourceItem.Name, "Expedia Room 1" },
                            { Constants.Fields.AccommodationReferenceItem.Content, "Expedia content" },
                            { Constants.Fields.AccommodationReferenceItem.Description, "Expedia description" },
                            { Constants.FieldsIds.AccommodationRoomItem.BedGroupTypes, $"{firstBedGroupId}|{secondBedGroupId}" }
                        }
                    }
                },

                new DbItem("Queen Bed", firstBedGroupId, Constants.TemplateIds.BedGroup)
                {
                    { Constants.FieldsIds.BedGroupItem.BedGroupId, "QUEEN_BED" },
                    { Constants.FieldsIds.BedGroupItem.Description, "Queen Bed" }
                },

                new DbItem("Two Single Beds", secondBedGroupId, Constants.TemplateIds.BedGroup)
                {
                    { Constants.FieldsIds.BedGroupItem.BedGroupId, "TWO_SINGLE_BEDS" },
                    { Constants.FieldsIds.BedGroupItem.Description, "2 Single Beds" }
                },
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                // Act
                var actual = HotelTypeHelper.ResolveExpediaRoomTypes(hotelItem);
                // Assert
                actual.Should().ContainSingle();

                var bedGroups = actual[0].BedGroups.ToList();

                bedGroups.Should().NotBeNull();
                bedGroups.Should().HaveCount(2);

                bedGroups[0].BedGroupId.Should().Be("QUEEN_BED");
                bedGroups[0].Description.Should().Be("Queen Bed");

                bedGroups[1].BedGroupId.Should().Be("TWO_SINGLE_BEDS");
                bedGroups[1].Description.Should().Be("2 Single Beds");
            }
        }
    }
}
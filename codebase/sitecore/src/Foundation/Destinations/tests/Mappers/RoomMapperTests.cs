using System.Collections.Generic;
using System.Linq;
using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Integration;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Resources.Media;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Mappers
{
    public class RoomMapperTests
    {
        private readonly Fixture fixture;

        public RoomMapperTests()
        {
            fixture = new Fixture();
        }

        [Fact]
        public void GetHotelRooms_WithRoomStaysFolder_AlsoMapsRoomStays()
        {
            // Arrange
            var integrationServiceSubstitute = Substitute.For<IIntegrationService>();

            RoomMapper.IntegrationService = integrationServiceSubstitute;
            integrationServiceSubstitute.SetIntegrationStrategy(type: default).Returns(integrationServiceSubstitute);
            integrationServiceSubstitute.ValidateCode(default).ReturnsForAnyArgs(true);

            var roomFolderID = ID.NewID;
            var roomTypeID1 = ID.NewID;
            var expectedName = fixture.Create<string>();

            var facilityThatShouldShowUpInResultID = ID.NewID;
            var facilityTypeID1 = ID.NewID;
            var facilityStayTypeID = ID.NewID;

            using (var db = new Db()
               {
                   new DbItem("Some Accommodation, somewhere")
                   {
                       new DbItem("Room Folder", roomFolderID)
                       {
                           new DbItem("A room")
                           {
                               TemplateID = Constants.TemplateIds.AccommodationRoom,
                               Fields =
                               {
                                   new DbLinkField(Constants.Fields.AccommodationRoomItem.RoomType) { Value = roomTypeID1.ToString() },
                                   new DbField(Constants.Fields.DatasourceItem.Name) { Value = expectedName },
                                   new DbField(Constants.Fields.AccommodationReferenceItem.Content) { Value = fixture.Create<string>() },
                                   new DbField(Constants.Fields.AccommodationReferenceItem.Description) { Value = fixture.Create<string>() }
                               },
                               Children =
                           {
                               new DbItem("FacilitiesFolder")
                               {
                                   TemplateID = Constants.TemplateIds.RoomFacilitiesFolder,
                                   Children =
                               {
                                    new DbItem("ImAFacilityAndShouldBeInResult", facilityThatShouldShowUpInResultID)
                                    {
                                        Fields =
                                    {
                                        new DbField(Constants.Fields.BaseFacilityItem.FacilityType) { Value = facilityTypeID1.ToString() },
                                        new DbField(Constants.Fields.BaseAppearance.ShowOnSite) { Value = "1" }
                                    }
                                    }
                               }
                               },
                               new DbItem("Stays Folder")
                               {
                                   TemplateID = Constants.TemplateIds.RoomStaysFolder,
                                   Children =
                                   {
                                       new DbItem("A BED")
                                       {
                                           Children =
                                       {
                                           new DbItem("Facilities")
                                           {
                                               TemplateID = Constants.TemplateIds.RoomFacilitiesFolder,
                                               Children =
                                               {
                                                   new DbItem("the bed's specifications")
                                                   {
                                                       Fields =
                                                   {
                                                       new DbField(Constants.Fields.BaseFacilityItem.FacilityType) { Value = facilityStayTypeID.ToString() },
                                                       new DbField(Constants.Fields.BaseAppearance.ShowOnSite) { Value = "1" }
                                                   }
                                                   }
                                               }
                                           }
                                       }
                                       }
                                   }
                               }
                           }
                           }
                       }
                   },
                   new DbItem("Room type", roomTypeID1)
                   {
                       Fields =
                       {
                           new DbField(Constants.Fields.DatasourceItem.Name) { Value = fixture.Create<string>() },
                           new DbField(Constants.Fields.DatasourceItem.Code) { Value = fixture.Create<string>() }
                       }
                   },
                   new DbItem("Facility Group Type")
                   {
                       Fields =
                   {
                       new DbField(Constants.Fields.DatasourceItem.Code) { Value = RoomMapper.RoomFacilityGroupCode }
                   },
                       Children =
                   {
                       new DbItem("Facility Type", facilityTypeID1) { Fields = { new DbField(Constants.Fields.BaseAppearance.ShowOnSite) { Value = "1" } } },
                       new DbItem("Facility Type for Stay", facilityStayTypeID) { Fields = { new DbField(Constants.Fields.BaseAppearance.ShowOnSite) { Value = "1" } } }
                   }
                   }
               })
            {
                // Act
                var result = RoomMapper.GetHotelRooms(db.GetItem(roomFolderID)).ToList();

                // Assert
                result.Should().NotBeNull();
                result.First().Name.Should().BeEquivalentTo(expectedName);
                result.First().Facilities.Should().Contain(facility => facility.Id == facilityThatShouldShowUpInResultID.ToString());
                result.First().Stays.Should().NotBeEmpty();
            }
        }

        [Fact]
        public void GetHotelRooms_WhenMappingFacilities_DoesNotAddThoseWithoutTypeOrCheckedShowProperty()
        {
            // Arrange
            var integrationServiceSubstitute = Substitute.For<IIntegrationService>();

            RoomMapper.IntegrationService = integrationServiceSubstitute;
            integrationServiceSubstitute.SetIntegrationStrategy(type: default).Returns(integrationServiceSubstitute);
            integrationServiceSubstitute.ValidateCode(default).ReturnsForAnyArgs(true);

            var facilitiesFolderID = ID.NewID;
            var roomFolderID = ID.NewID;
            var roomTypeID1 = ID.NewID;
            var expectedName = fixture.Create<string>();

            var facilityThatShouldShowUpInResultID = ID.NewID;
            var facilityThatShouldNotShowUpInResultID = ID.NewID;
            var facilityThatAlsoShouldNotShowUpInResultID = ID.NewID;
            var facilityTypeID1 = ID.NewID;
            var facilityTypeID2 = ID.NewID;
            var facilityTypeID3 = ID.NewID;

            using (var db = new Db()
               {
                   new DbItem("Some Accommodation, somewhere")
                   {
                       new DbItem("Facilities Folder", facilitiesFolderID)
                       {
                           TemplateID = Constants.TemplateIds.AccommodationFacilitiesFolder,
                           Children =
                       {
                           new DbItem("Some Facility of the accommodation itself")
                           {
                               Fields =
                           {
                               new DbField(Constants.Fields.BaseFacilityItem.FacilityType) { Value = facilityTypeID1.ToString() }
                           }
                           }
                       }
                       },
                       new DbItem("Room Folder", roomFolderID)
                       {
                           new DbItem("A room")
                           {
                               TemplateID = Constants.TemplateIds.AccommodationRoom,
                               Fields =
                           {
                               new DbLinkField(Constants.Fields.AccommodationRoomItem.RoomType) { Value = roomTypeID1.ToString() },
                               new DbField(Constants.Fields.DatasourceItem.Name) { Value = expectedName },
                               new DbField(Constants.Fields.AccommodationReferenceItem.Content) { Value = fixture.Create<string>() },
                               new DbField(Constants.Fields.AccommodationReferenceItem.Description) { Value = fixture.Create<string>() }
                           }, Children =
                           {
                               new DbItem("FacilitiesFolder")
                               {
                                   TemplateID = Constants.TemplateIds.RoomFacilitiesFolder,
                                   Children =
                               {
                                    new DbItem("ImAFacilityAndShouldBeInResult", facilityThatShouldShowUpInResultID)
                                    {
                                        Fields =
                                    {
                                        new DbField(Constants.Fields.BaseFacilityItem.FacilityType) { Value = facilityTypeID1.ToString() },
                                        new DbField(Constants.Fields.BaseAppearance.ShowOnSite) { Value = "1" }
                                    }
                                    },
                                    new DbItem("ImAFacilityButMyTypeIsSetToNotShow", facilityThatShouldNotShowUpInResultID)
                                    {
                                    Fields =
                                    {
                                        new DbField(Constants.Fields.BaseFacilityItem.FacilityType) { Value = facilityTypeID2.ToString() },
                                        new DbField(Constants.Fields.BaseAppearance.ShowOnSite) { Value = "1" }
                                    }
                                    },
                                    new DbItem("ImAFacilityButImSetToNotShow", facilityThatAlsoShouldNotShowUpInResultID)
                                    {
                                        Fields =
                                    {
                                        new DbField(Constants.Fields.BaseFacilityItem.FacilityType) { Value = facilityTypeID1.ToString() },
                                        new DbField(Constants.Fields.BaseAppearance.ShowOnSite) { Value = "0" }
                                    }
                                    }
                               }
                               }
                           }
                           }
                       }
                   },
                   new DbItem("Room type", roomTypeID1)
                   {
                       Fields =
                       {
                           new DbField(Constants.Fields.DatasourceItem.Name) { Value = fixture.Create<string>() },
                           new DbField(Constants.Fields.DatasourceItem.Code) { Value = fixture.Create<string>() }
                       }
                   },
                   new DbItem("Facility Group Type")
                   {
                       Fields =
                   {
                       new DbField(Constants.Fields.DatasourceItem.Code) { Value = RoomMapper.RoomFacilityGroupCode }
                   }, Children =
                   {
                       new DbItem("Facility Type", facilityTypeID1) { Fields = { new DbField(Constants.Fields.BaseAppearance.ShowOnSite) { Value = "1" } } },
                       new DbItem("Facility Type", facilityTypeID2) { Fields = { new DbField(Constants.Fields.BaseAppearance.ShowOnSite) { Value = "0" } } },
                       new DbItem("Facility Type", facilityTypeID3) { Fields = { new DbField(Constants.Fields.BaseAppearance.ShowOnSite) { Value = "1" } } }
                   }
                   }
               })
            {
                // Act
                var result = RoomMapper.GetHotelRooms(db.GetItem(roomFolderID)).ToList();

                // Assert
                result.Should().NotBeNull();
                result.First().Name.Should().BeEquivalentTo(expectedName);
                result.First().Facilities.Should().Contain(facility => facility.Id == facilityThatShouldShowUpInResultID.ToString());
                result.First().Facilities.Should().NotContain(facility => facility.Id == facilityThatShouldNotShowUpInResultID.ToString());
                result.First().Facilities.Should().NotContain(facility => facility.Id == facilityThatAlsoShouldNotShowUpInResultID.ToString());
            }
        }

        // TODO fix me
        [Fact(Skip = "unable to setup media provider")]
        public void GetHotelRooms_WhenIconURLMappingFromItemIsNull_MapFromReferenceTypeInstead()
        {
            // Arrange
            var integrationServiceSubstitute = Substitute.For<IIntegrationService>();

            RoomMapper.IntegrationService = integrationServiceSubstitute;
            integrationServiceSubstitute.ValidateCode(default).ReturnsForAnyArgs(true);

            var folderID = ID.NewID;
            var targetTypeID = ID.NewID;
            var expectedName = fixture.Create<string>();

            var iconUrl = "~/media/myIcon.ashx";
            var iconId = ID.NewID;

            using (var db = new Db()
               {
                   new DbItem("Room Folder", folderID)
                   {
                       new DbItem("A room")
                       {
                           TemplateID = Constants.TemplateIds.AccommodationRoom,
                           Fields =
                       {
                           new DbLinkField(Constants.Fields.AccommodationRoomItem.RoomType) { Value = targetTypeID.ToString() },
                           new DbField(Constants.Fields.DatasourceItem.Name) { Value = expectedName },
                           new DbField(Constants.Fields.AccommodationReferenceItem.Content) { Value = fixture.Create<string>() },
                           new DbField(Constants.Fields.AccommodationReferenceItem.Description) { Value = fixture.Create<string>() }
                       }
                       }
                   },
                   new DbItem("some icon", iconId),
                   new DbItem("Room type", targetTypeID)
                   {
                       Fields =
                       {
                           new DbField(Constants.Fields.AccommodationReferenceItem.Icon) { Value = iconId.ToString() },
                           new DbField(Constants.Fields.DatasourceItem.Name) { Value = fixture.Create<string>() },
                           new DbField(Constants.Fields.DatasourceItem.Code) { Value = fixture.Create<string>() }
                       }
                   }
               })
            {
                var iconItem = db.GetItem(iconId);

                var mediaProvider = Substitute.For<MediaProvider>();
                mediaProvider.GetMediaUrl(Arg.Is<MediaItem>(paramItem => paramItem.ID == iconId)).Returns(iconUrl);

                // Act
                var result = RoomMapper.GetHotelRooms(db.GetItem(folderID)).ToList();

                // Assert
                result.Should().NotBeNull();
                result.First().Name.Should().BeEquivalentTo(expectedName);
                result.First().IconUrl.Should().BeEquivalentTo(iconUrl);
            }
        }

        [Fact]
        public void GetHotelRooms_WhenItemNameIsEmpty_MapsReferenceTypeNameInstead()
        {
            // Arrange
            var integrationServiceSubstitute = Substitute.For<IIntegrationService>();

            RoomMapper.IntegrationService = integrationServiceSubstitute;
            integrationServiceSubstitute.ValidateCode(default).ReturnsForAnyArgs(true);

            var folderID = ID.NewID;
            var targetTypeID = ID.NewID;
            var expectedName = fixture.Create<string>();
            using (var db = new Db()
               {
                   new DbItem("Room Folder", folderID)
                   {
                       new DbItem("A room")
                       {
                           TemplateID = Constants.TemplateIds.AccommodationRoom,
                           Fields =
                       {
                           new DbLinkField(Constants.Fields.AccommodationRoomItem.RoomType) { Value = targetTypeID.ToString() },
                           new DbField(Constants.Fields.AccommodationReferenceItem.Content) { Value = fixture.Create<string>() },
                           new DbField(Constants.Fields.AccommodationReferenceItem.Description) { Value = fixture.Create<string>() }
                       }
                       }
                   },
                   new DbItem("Room type", targetTypeID)
                   {
                       Fields =
                       {
                           new DbField(Constants.Fields.DatasourceItem.Name) { Value = expectedName },
                           new DbField(Constants.Fields.DatasourceItem.Code) { Value = fixture.Create<string>() }
                       }
                   }
               })
            {
                // Act
                var result = RoomMapper.GetHotelRooms(db.GetItem(folderID)).ToList();

                // Assert
                result.Should().NotBeNull();
                result.First().Name.Should().BeEquivalentTo(expectedName);
            }
        }

        [Fact]
        public void GetHotelRooms_WhenRoomTypeForRoomItemIsNull_SkipMappingRoom()
        {
            // Arrange
            var folderID = ID.NewID;
            var targetTypeID = ID.NewID;
            var someUnrelatedID = ID.NewID;
            using (var db = new Db()
               {
                   new DbItem("Room Folder", folderID)
                   {
                       new DbItem("A room")
                       {
                           TemplateID = Constants.TemplateIds.AccommodationRoom,
                           Fields =
                       {
                           new DbLinkField(Constants.Fields.AccommodationRoomItem.RoomType) { Value = targetTypeID.ToString() }
                       }
                       }
                   },
                   new DbItem("Room type", someUnrelatedID)
               })
            {
                // Act
                var result = RoomMapper.GetHotelRooms(db.GetItem(folderID)).ToList();

                // Assert
                result.Should().NotBeNull();
                result.Should().BeEmpty();
            }
        }

        [Fact]
        public void GetHotelRooms_WhenRoomTypeForRoomItemIsNullAndRoomHasCode_MapsRoomItem()
        {
            // Arrange
            var integrationServiceSubstitute = Substitute.For<IIntegrationService>();

            RoomMapper.IntegrationService = integrationServiceSubstitute;
            integrationServiceSubstitute.SetIntegrationStrategy(type: default).Returns(integrationServiceSubstitute);
            integrationServiceSubstitute.ValidateCode(default).ReturnsForAnyArgs(false);

            var folderID = ID.NewID;
            var targetTypeID = ID.NewID;
            var expectedName = fixture.Create<string>();
            var expectedCode = fixture.Create<string>();
            var expectedContent = fixture.Create<string>();
            var expectedDescription = fixture.Create<string>();

            using (var db = new Db()
    {
        new DbItem("Some Accommodation")
        {
            new DbItem("Room Folder", folderID)
            {
                TemplateID = Constants.TemplateIds.AccommodationRoomsFolder,
                Fields =
                {
                    new DbField(Constants.Fields.DatasourceItem.Code) { Value = "W0080001" }
                },
                Children =
                {
                    new DbItem("A room")
                    {
                        TemplateID = Constants.TemplateIds.AccommodationRoom,
                        Fields =
                        {
                            new DbLinkField(Constants.Fields.AccommodationRoomItem.RoomType) { Value = targetTypeID.ToString() },
                            new DbField(Constants.Fields.DatasourceItem.Name) { Value = expectedName },
                            new DbField(Constants.Fields.DatasourceItem.Code) { Value = expectedCode },
                            new DbField(Constants.Fields.AccommodationReferenceItem.Content) { Value = expectedContent },
                            new DbField(Constants.Fields.AccommodationReferenceItem.Description) { Value = expectedDescription }
                        }
                    }
                }
            }
        }
    })
            {
                // Act
                var result = RoomMapper.GetHotelRooms(db.GetItem(folderID)).ToList();

                // Assert
                result.Should().ContainSingle();
                result.First().Name.Should().Be(expectedName);
                result.First().ItemName.Should().Be("A room");
                result.First().Code.Should().Be(expectedCode);
                result.First().Content.Should().Be(expectedContent);
                result.First().Description.Should().Be(expectedDescription);
            }
        }

        [Theory]
        [MemberData(nameof(RoomMapperTestsData.InvalidRoomFolders), MemberType = typeof(RoomMapperTestsData))]
        public void GetHotelRooms_WhenRoomFolderHasNoMatchingChildren_ReturnsEmptyEnumerable(Item roomFolderItem)
        {
            // Arrange

            // Act
            var result = RoomMapper.GetHotelRooms(roomFolderItem);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetHotelRoomsFromIndex_WhenKeyIsFoundInDeserializedRooms_ReturnsRoomsFromSearchHit()
        {
            var code = "aCodeThatIsNotInTheDict";
            var rooms = new Dictionary<string, HotelRoom[]>()
            {
                { "anyCode", fixture.Create<HotelRoom[]>() },
                { code, fixture.Create<HotelRoom[]>() }
            };
            var doc = new HotelSearchResultItem
            {
                Rooms = JsonConvert.SerializeObject(rooms)
            };

            // Act
            var result = RoomMapper.GetHotelRoomsFromIndex(doc, code);

            // Assert
            result.Should().NotBeNull();
            result.Should().NotBeEmpty();
        }

        [Fact]
        public void GetHotelRoomsFromIndex_WithKeyMissingFromDeserializedRooms_ReturnsEmptyArray()
        {
            // Arrange
            var rooms = new Dictionary<string, HotelRoom[]>()
            {
                { "anyCode", fixture.Create<HotelRoom[]>() },
                { "anotherCode", fixture.Create<HotelRoom[]>() }
            };
            var code = "aCodeThatIsNotInTheDict";
            var doc = new HotelSearchResultItem
            {
                Rooms = JsonConvert.SerializeObject(rooms)
            };

            // Act
            var result = RoomMapper.GetHotelRoomsFromIndex(doc, code);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetHotelRoomsFromIndex_ForEmptyRoomsInSearchHit_ReturnsEmptyArray()
        {
            // Arrange
            var doc = new HotelSearchResultItem();
            var code = fixture.Create<string>();

            // Act
            var result = RoomMapper.GetHotelRoomsFromIndex(doc, code);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }
    }
}

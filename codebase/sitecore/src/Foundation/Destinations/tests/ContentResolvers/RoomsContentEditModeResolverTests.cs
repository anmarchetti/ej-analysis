using System;
using System.Collections.Generic;
using System.Linq;
using AutoFixture;
using easyJet.Foundation.Destinations.ContentResolvers;
using easyJet.Foundation.SitecoreExtensions.ContentResolvers;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentResolvers
{
    public class RoomsContentEditModeResolverTests : RenderingContentsResolver
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly RoomsContentEditModeResolver resolver;

        public RoomsContentEditModeResolverTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            resolver = new RoomsContentEditModeResolver();
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfPageNotInEditMode()
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(new Sitecore.Collections.StringDictionary
                {
                    { "database", "master" }
                });

            var renderingConfig = Substitute.For<IRenderingConfiguration>();

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                var actual = resolver.ResolveContents(new Rendering(), renderingConfig);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Fact]
        public void ResolveContents_ShouldThrowException_IfRenderingNull()
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "enableWebEdit", "true" },
                    { "masterDatabase", "master" }
                });

            // Act
            using (new SiteContextSwitcher(fakeSiteContext))
            {
                Sitecore.Context.Site.SetDisplayMode(DisplayMode.Edit, DisplayModeDuration.Remember);

                Action actual = () => resolver.ResolveContents(null, null);

                // Assert
                actual.Should().Throw<ArgumentNullException>();
            }
        }

        [Fact]
        public void ResolveContents_ShouldThrowException_IfRenderingConfigNull()
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "enableWebEdit", "true" },
                    { "masterDatabase", "master" }
                });

            // Act
            using (new SiteContextSwitcher(fakeSiteContext))
            {
                fakeSiteContext.SetDisplayMode(DisplayMode.Edit, DisplayModeDuration.Remember);

                Action actual = () => resolver.ResolveContents(new Rendering(), null);

                // Assert
                actual.Should().Throw<ArgumentNullException>();
            }
        }

        [Fact]
        public void ResolveContents_ShouldReturnNull_IfContextItemNotExist()
        {
            // Arrange
            var renderingConfig = Substitute.For<IRenderingConfiguration>();

            var hotel = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            db.Add(hotel);

            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "enableWebEdit", "true" },
                    { "masterDatabase", "master" }
                });

            // Act
            using (new SiteContextSwitcher(fakeSiteContext))
            {
                Sitecore.Context.Site.SetDisplayMode(DisplayMode.Edit, DisplayModeDuration.Remember);

                var actual = resolver.ResolveContents(new Rendering() { DataSource = hotel.ID.ToString() }, renderingConfig);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Fact]
        public void ResolveContents_ShouldReturnProcessedContextItem_IfItemSelectorQueryIsNull()
        {
            // Arrange
            var hotel = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            hotel.TemplateID = Constants.TemplateIds.Accommodation;
            db.Add(hotel);

            var testResult = @"{
                ""fakeField"": {
                    ""value"": ""fieldValue""
                }
            }";

            var renderingItem = new RenderingItem(db.GetItem(hotel.ID));

            var renderingConfig = Substitute.For<IRenderingConfiguration>();
            renderingConfig.ItemSerializer.Serialize(Arg.Any<Item>()).Returns(testResult);

            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "enableWebEdit", "true" },
                    { "masterDatabase", "master" }
                });

            // Act
            using (new SiteContextSwitcher(fakeSiteContext))
            {
                Sitecore.Context.Site.SetDisplayMode(DisplayMode.Edit, DisplayModeDuration.Remember);

                var actual = resolver.ResolveContents(new Rendering() { RenderingItem = renderingItem, DataSource = hotel.ID.ToString() }, renderingConfig);

                // Assert
                actual.Should().BeEquivalentTo(JObject.Parse(testResult));
            }
        }

        [Fact]
        public void ResolveContents_ShouldReturnEmptyArray_IfItemSelectorQueryNotNull()
        {
            // Arrange
            var hotel = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            hotel.TemplateID = Constants.TemplateIds.Accommodation;
            db.Add(hotel);

            var testResult = @"{
                ""fakeField"": {
                    ""value"": ""fieldValue""
                }
            }";

            var renderingItem = new RenderingItem(db.GetItem(hotel.ID));

            var renderingConfig = Substitute.For<IRenderingConfiguration>();
            renderingConfig.ItemSerializer.Serialize(Arg.Any<Item>()).Returns(testResult);

            resolver.ItemSelectorQuery = ".//*[@@templateid='{BA1EC5C3-14C7-40B3-8B69-D020590DA1F3}']";

            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "enableWebEdit", "true" },
                    { "masterDatabase", "master" }
                });

            // Act
            using (new SiteContextSwitcher(fakeSiteContext))
            {
                Sitecore.Context.Site.SetDisplayMode(DisplayMode.Edit, DisplayModeDuration.Remember);

                var actual = resolver.ResolveContents(new Rendering() { RenderingItem = renderingItem, DataSource = hotel.ID.ToString() }, renderingConfig);

                // Assert
                actual.Should().BeEquivalentTo(new JArray());
            }
        }

        [Fact]
        public void ResolveContents_ShouldReturnSpecificData_IfRoomsExist()
        {
            // Arrange
            var hotel = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            hotel.TemplateID = Constants.TemplateIds.Accommodation;

            var roomsFolder = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            roomsFolder.TemplateID = Constants.TemplateIds.AccommodationRoomsFolder;

            var room = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            room.TemplateID = Constants.TemplateIds.AccommodationRoom;
            room.Fields.Add("fakeField", "fieldValue");

            roomsFolder.Children.Add(room);

            var imagesFolder = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            imagesFolder.TemplateID = Constants.TemplateIds.ImagesFolder;

            var image = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            image.Fields.Add("fakeField", "fieldValue");

            imagesFolder.Children.Add(image);

            var facilitiesFolder = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            facilitiesFolder.TemplateID = Constants.TemplateIds.RoomFacilitiesFolder;

            var facility = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            facility.Fields.Add("fakeField", "fieldValue");

            facilitiesFolder.Children.Add(facility);

            room.Children.Add(imagesFolder);
            room.Children.Add(facilitiesFolder);

            hotel.Children.Add(roomsFolder);
            db.Add(hotel);

            var renderingItem = new RenderingItem(db.GetItem(hotel.ID));

            resolver.ItemSelectorQuery = ".//*[@@templateid='{BA1EC5C3-14C7-40B3-8B69-D020590DA1F3}']";

            var serializedItem = @"{
                ""fakeField"": {
                    ""value"": ""fieldValue""
                }
            }";

            var renderingConfig = Substitute.For<IRenderingConfiguration>();
            renderingConfig.ItemSerializer.Serialize(Arg.Any<Item>()).Returns(serializedItem);

            var fakeSiteContext = new FakeSiteContext(
               new Sitecore.Collections.StringDictionary
               {
                    { "enableWebEdit", "true" },
                    { "masterDatabase", "master" }
               });

            // Act
            using (new SiteContextSwitcher(fakeSiteContext))
            {
                var rendering = Substitute.For<Rendering>();
                var roomItem = db.GetItem(room.ID);
                JObject roomType = new JObject()
                {
                    ["id"] = roomItem.ID.Guid.ToString(),
                    ["name"] = roomItem.Name,
                    ["displayName"] = roomItem.DisplayName,
                    ["fields"] = ProcessItem(roomItem, rendering, renderingConfig),
                    ["roomImages"] = new JObject()
                    {
                        ["roomImagesFolderId"] = imagesFolder.ID.Guid.ToString(),
                        ["roomImagesContent"] = ProcessItems(new List<Item> { db.GetItem(image.ID) }, rendering, renderingConfig)
                    },
                    ["roomFacilities"] = new JObject()
                    {
                        ["roomFacilitiesFolderId"] = facilitiesFolder.ID.Guid.ToString(),
                        ["roomFacilitiesContent"] = ProcessItems(new List<Item> { db.GetItem(facility.ID) }, rendering, renderingConfig)
                    },
                    ["roomFolders"] = roomItem.ParentID.Guid.ToString(),
                };

                var roomTypes = new JArray();
                roomTypes.Add(roomType);

                var testResult = new
                {
                    RoomsFolderId = hotel.Children.FirstOrDefault(x => x.TemplateID.Equals(Constants.TemplateIds.AccommodationRoomsFolder)).ID.Guid.ToString(),
                    Items = roomTypes
                };

                Sitecore.Context.Site.SetDisplayMode(DisplayMode.Edit, DisplayModeDuration.Remember);

                var actual = resolver.ResolveContents(new Rendering() { RenderingItem = renderingItem, DataSource = hotel.ID.ToString() }, renderingConfig);

                // Assert
                actual.Should().BeEquivalentTo(testResult);
            }
        }
    }
}

using easyJet.Feature.PageContent.ContentResolvers;
using easyJet.Feature.PageContent.Models;
using easyJet.Foundation.SitecoreExtensions.Models;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Sitecore.Sites;
using Xunit;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Feature.PageContent.Tests.ContentResolvers
{
    public class FeaturedHotelsContentResolverTests
    {
        private readonly FeaturedHotelsContentResolver resolver;

        public FeaturedHotelsContentResolverTests()
        {
            // Arrange
            resolver = new FeaturedHotelsContentResolver();
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfMethodThrowException()
        {
            // Act
            var actual = resolver.ResolveContents(null, null);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfNotUseContextItemMode()
        {
            // Arrange
            resolver.UseContextItem = false;

            // Act
            var actual = resolver.ResolveContents(new Rendering(), null);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldResolveContents_IfUseContextItemMode(Db db, RenderingItem renderingItem)
        {
            // Arrange
            var country = new DbItem("Country");
            country.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Name, "Country");
            var region = new DbItem("Region");
            region.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Name, "Region");
            country.Add(region);
            var resort = new DbItem("Resort");
            resort.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Name, "Resort");
            region.Add(resort);

            var hotel = new DbItem("Test Hotel");
            hotel.Fields.Add(DestinationsConstants.Fields.SitecoreImageItem.Image, string.Empty);
            hotel.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Name, "Test Hotel 1");
            hotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.StarRating, "4");
            hotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.FeaturedHotelDate, "20200227T210000Z");
            hotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.FeaturedHotelDateText, "Test");
            hotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.FeaturedHotelBookFromTitle, "Title");
            resort.Add(hotel);

            var featuredHotels = new DbItem("Featured Hotels");
            featuredHotels.Fields.Add(Constants.Fields.FeaturedHotelsItem.Title, "Test Hotel 1");
            featuredHotels.Fields.Add(Constants.Fields.FeaturedHotelsItem.Description, "Test description 1");
            featuredHotels.Fields.Add(Constants.Fields.FeaturedHotelsItem.FeaturedHotels, hotel.ID.ToString());
            db.Add(country);
            db.Add(featuredHotels);

            string testJsonText = @"
                        {
                            ""Title"": {
                                ""value"": ""Test Hotel 1""
                                },
                            ""Description"": {
                                ""value"": ""Test description 1""
                                },
                              ""FeaturedHotels"": [
                                    {
                                        ""Url"": ""/en/sitecore/content/Country/Region/Resort/Test Hotel.aspx"",
                                        ""ImageUrl"": ""null"",
                                        ""Name"": ""Test Hotel 1"",
                                        ""BookFrom"": ""2020-02-28T00:00:00.0000000"",
                                        ""StarRating"": ""4"",
                                        ""Region"": ""Region"",
                                        ""Country"": ""Country"",
                                        ""BookFromText"": ""Test"",
                                        ""BookFromTitle"": ""Title""
                                    }
                                ]                 
                        }";

            var renderingConfig = Substitute.For<IRenderingConfiguration>();
            renderingConfig.ItemSerializer.Serialize(Arg.Any<Item>()).Returns(testJsonText);

            var fakeSite = new FakeSiteContext(new StringDictionary
            {
                { "name", "website" }, { "database", "web" }
            });

            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = JObject.FromObject(resolver.ResolveContents(new Rendering() { RenderingItem = renderingItem, DataSource = featuredHotels.ID.ToString() }, renderingConfig));

                // Assert
                ((string)actual["Title"]["value"]).Should().BeEquivalentTo("Test Hotel 1");
                ((string)actual["Description"]["value"]).Should().BeEquivalentTo("Test description 1");
                actual["FeaturedHotels"].Should().HaveCount(1);
            }
        }

        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldReturnImage_IfFeaturedHotelImageNotExist(Db db, RenderingItem renderingItem, string imageUrl)
        {
            // Arrange
            var featuredHotels = new DbItem("Featured Hotels");

            var country = new DbItem("Country");
            country.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Name, string.Empty);

            var region = new DbItem("Region");
            region.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Name, string.Empty);

            var resort = new DbItem("Resort");

            region.Children.Add(resort);
            country.Children.Add(region);

            var featuredHotel = new DbItem("Feature Hotel");
            featuredHotel.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Name, string.Empty);
            featuredHotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.FeaturedHotelDate, string.Empty);
            featuredHotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.FeaturedHotelDateText, string.Empty);
            featuredHotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.FeaturedHotelBookFromTitle, string.Empty);
            featuredHotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.StarRating, string.Empty);

            var imagesFolder = new DbItem("Images Folder");
            imagesFolder.TemplateID = DestinationsConstants.TemplateIds.ImagesFolder;

            var externalImage = new DbItem("External Image");
            externalImage.TemplateID = DestinationsConstants.TemplateIds.ExternalImage;
            externalImage.Fields.Add(DestinationsConstants.Fields.ExternalImageItem.Large, imageUrl);

            imagesFolder.Children.Add(externalImage);
            featuredHotel.Children.Add(imagesFolder);

            resort.Children.Add(featuredHotel);
            db.Add(country);

            var featuredHotelsField = new DbField(Constants.Fields.FeaturedHotelsItem.FeaturedHotels)
            {
                Type = "MultilistField",
                Value = featuredHotel.ID.ToString()
            };

            featuredHotels.Fields.Add(featuredHotelsField);

            db.Add(featuredHotels);

            var image = new Image(db.GetItem(externalImage.ID).Fields[DestinationsConstants.Fields.ExternalImageItem.Large], ImageSize.Default) { Src = imageUrl };

            var testJsonText = @"{
                ""Title"": {
                    ""value"": ""Test Hotel 1"" }
            }";

            var renderingConfig = Substitute.For<IRenderingConfiguration>();
            renderingConfig.ItemSerializer.Serialize(Arg.Any<Item>()).Returns(testJsonText);

            var fakeSite = new FakeSiteContext(new StringDictionary
            {
                { "name", "website" }, { "database", "web" }
            });

            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var result = JObject.FromObject(resolver.ResolveContents(new Rendering() { RenderingItem = renderingItem, DataSource = featuredHotels.ID.ToString() }, renderingConfig))["FeaturedHotels"][0]["Image"].ToString();
                var actual = JsonConvert.DeserializeObject<SitecoreField<Image>>(result);

                // Assert
                actual.Value.Src.Should().Be(image.Src);
            }
        }

        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldReturnImage_ImageSourceIsXml(Db db, string imageUrl)
        {
            // Arrange
            var featuredHotels = new DbItem("Featured Hotels");

            var country = new DbItem("Country");
            country.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Name, string.Empty);

            var region = new DbItem("Region");
            region.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Name, string.Empty);

            var resort = new DbItem("Resort");

            region.Children.Add(resort);
            country.Children.Add(region);

            var featuredHotel = new DbItem("Feature Hotel");
            featuredHotel.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Name, string.Empty);
            featuredHotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.FeaturedHotelDate, string.Empty);
            featuredHotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.FeaturedHotelDateText, string.Empty);
            featuredHotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.FeaturedHotelBookFromTitle, string.Empty);
            featuredHotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.StarRating, string.Empty);

            var imagesFolder = new DbItem("Images Folder");
            imagesFolder.TemplateID = DestinationsConstants.TemplateIds.ImagesFolder;

            var externalImage = new DbItem("External Image");
            externalImage.TemplateID = DestinationsConstants.TemplateIds.ExternalImage;

            const string validXml = "<?xml version=\"1.0\" encoding=\"utf-8\" ?>" +
                                    "<image xmlns = \"Http:\\\\test.de\">" +
                                    "</image>";

            externalImage.Fields.Add(DestinationsConstants.Fields.ExternalImageItem.Large, validXml);

            imagesFolder.Children.Add(externalImage);
            featuredHotel.Children.Add(imagesFolder);

            resort.Children.Add(featuredHotel);
            db.Add(country);

            var featuredHotelsField = new DbField(Constants.Fields.FeaturedHotelsItem.FeaturedHotels)
            {
                Type = "MultilistField",
                Value = featuredHotel.ID.ToString()
            };
            featuredHotels.Fields.Add(featuredHotelsField);
            db.Add(featuredHotels);

            var imageField = db.GetItem(externalImage.ID).Fields[DestinationsConstants.Fields.ExternalImageItem.Large];
            // Act
            var act = new Image(imageField, ImageSize.Default) { Src = imageUrl };
            // Assert
            act.Src.Should().BeEquivalentTo(imageUrl);
        }

        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldNotReturnUrlFromHotelSitecoreImage_IfUrlNotSet(Db db, RenderingItem renderingItem)
        {
            // Arrange
            var featuredHotels = new DbItem("Featured Hotels");

            var country = new DbItem("Country");
            country.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Name, string.Empty);

            var region = new DbItem("Region");
            region.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Name, string.Empty);

            var resort = new DbItem("Resort");

            region.Children.Add(resort);
            country.Children.Add(region);

            var featuredHotel = new DbItem("Feature Hotel");
            featuredHotel.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Name, string.Empty);
            featuredHotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.FeaturedHotelDate, string.Empty);
            featuredHotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.FeaturedHotelDateText, string.Empty);
            featuredHotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.FeaturedHotelBookFromTitle, string.Empty);
            featuredHotel.Fields.Add(DestinationsConstants.Fields.AccommodationItem.StarRating, string.Empty);

            var imagesFolder = new DbItem("Images Folder");
            imagesFolder.TemplateID = DestinationsConstants.TemplateIds.ImagesFolder;

            var sitecoreImage = new DbItem("Sitecore Image");
            sitecoreImage.TemplateID = DestinationsConstants.TemplateIds.SitecoreImage;
            sitecoreImage.Fields.Add(DestinationsConstants.Fields.ExternalImageItem.Large, string.Empty);

            imagesFolder.Children.Add(sitecoreImage);
            featuredHotel.Children.Add(imagesFolder);

            resort.Children.Add(featuredHotel);
            db.Add(country);

            var featuredHotelsField = new DbField(Constants.Fields.FeaturedHotelsItem.FeaturedHotels)
            {
                Type = "MultilistField",
                Value = featuredHotel.ID.ToString()
            };

            featuredHotels.Fields.Add(featuredHotelsField);

            db.Add(featuredHotels);

            var testJsonText = @"{
                ""Title"": {
                    ""value"": ""Test Hotel 1"" }
            }";

            var renderingConfig = Substitute.For<IRenderingConfiguration>();
            renderingConfig.ItemSerializer.Serialize(Arg.Any<Item>()).Returns(testJsonText);

            var fakeSite = new FakeSiteContext(new StringDictionary
            {
                { "name", "website" }, { "database", "web" }
            });

            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = JObject.FromObject(resolver.ResolveContents(new Rendering() { RenderingItem = renderingItem, DataSource = featuredHotels.ID.ToString() }, renderingConfig))["FeaturedHotels"][0];

                // Assert
                actual["Image"].Should().BeEmpty();
            }
        }
    }
}
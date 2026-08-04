using System;
using AutoFixture;
using easyJet.Foundation.Destinations.Pipelines.GetLayoutServiceContext;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.JavaScriptServices.Configuration;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Pipelines.GetLayoutServiceContext
{
    public class ExtendAccommodationForGoogleStructuredDataTests : ExtendAccommodationForGoogleStructuredData
    {
        private readonly Fixture fixture;
        private readonly Db db;

        public ExtendAccommodationForGoogleStructuredDataTests()
            : base(Substitute.For<IConfigurationResolver>())
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void DoProcess_ShouldNotSetFields_IfNotAccommodationTemplate()
        {
            // Arrange
            var item = new DbItem("Hotel", ID.NewID) { TemplateID = Constants.TemplateIds.Accommodation };
            db.Add(item);
            var args = new GetLayoutServiceContextArgs { RenderedItem = db.GetItem(item.ID) };

            // Act
            DoProcess(args, null);

            // Assert
            args.ContextData["countryName"].Should().BeNull();
            args.ContextData["imageUrl"].Should().Be(string.Empty);
        }

        [Fact]
        public void DoProcess_ShouldSetCountryName_IfAncestorIsCountry()
        {
            // Arrange
            var countryTemplateId = Constants.TemplateIds.Country;
            var accommodationTemplateId = Constants.TemplateIds.Accommodation;
            var country = new DbItem("France", ID.NewID) { TemplateID = countryTemplateId };
            var hotel = new DbItem("Hotel", ID.NewID) { TemplateID = accommodationTemplateId };
            country.Children.Add(hotel);
            db.Add(country);
            var args = new GetLayoutServiceContextArgs { RenderedItem = db.GetItem(hotel.ID) };

            // Act
            DoProcess(args, null);

            // Assert
            args.ContextData["countryName"].Should().Be("France");
        }

        [Fact]
        public void DoProcess_ShouldSetImageUrl_IfImagesFolderHasImage()
        {
            // Arrange
            var accommodationTemplateId = Constants.TemplateIds.Accommodation;
            var imageTemplateId = Constants.TemplateIds.ExternalImage;
            var hotel = new DbItem("Hotel", ID.NewID) { TemplateID = accommodationTemplateId };
            var imagesFolder = new DbItem("Images", ID.NewID);
            var image = new DbItem("Image1", ID.NewID) { TemplateID = imageTemplateId };
            image.Fields.Add(Constants.Fields.ExternalImageItem.Small, "http://image/small.jpg");
            imagesFolder.Children.Add(image);
            hotel.Children.Add(imagesFolder);
            db.Add(hotel);
            var args = new GetLayoutServiceContextArgs { RenderedItem = db.GetItem(hotel.ID) };

            // Act
            DoProcess(args, null);

            // Assert
            args.ContextData["imageUrl"].Should().Be("http://image/small.jpg");
        }
    }
}

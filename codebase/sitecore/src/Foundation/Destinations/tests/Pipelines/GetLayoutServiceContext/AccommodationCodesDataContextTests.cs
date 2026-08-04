using easyJet.Foundation.Destinations.Pipelines.GetLayoutServiceContext;
using FluentAssertions;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Pipelines.GetLayoutServiceContext
{
    public class AccommodationCodesDataContextTests
    {
        private readonly AccommodationCodesDataContext dataContext;

        public AccommodationCodesDataContextTests()
        {
            dataContext = new AccommodationCodesDataContext();
        }

        [Fact]
        public void Process_ShouldAddAccommodationCodes_IfRenderingItemIsAccommodation()
        {
            // Arrange
            var args = new GetLayoutServiceContextArgs();
            var roomItem1 = new FakeItem()
                .WithTemplate(Constants.TemplateIds.AccommodationRoomsFolder)
                .WithField(Constants.Fields.DatasourceItem.Code, "X9001");
            var roomItem2 = new FakeItem()
              .WithTemplate(Constants.TemplateIds.AccommodationRoomsFolder)
              .WithField(Constants.Fields.DatasourceItem.Code, "HB001");

            var pageItem = new FakeItem()
                .WithTemplate(Constants.TemplateIds.Accommodation)
                .WithChild(roomItem1)
                .WithChild(roomItem2);

            args.RenderedItem = pageItem;

            // Act
            dataContext.Process(args);

            // Assert
            var contextData = args.ContextData["accommodationCodes"] as string[];
            args.ContextData.ContainsKey("accommodationCodes").Should().BeTrue();
            contextData.Length.Should().Be(2);
            contextData.Should().Contain("X9001");
            contextData.Should().Contain("HB001");
        }

        [Fact]
        public void Process_ShouldNotAddAccommodationCodes_IfRenderingItemIsNotAccommodation()
        {
            // Arrange
            var args = new GetLayoutServiceContextArgs();

            var pageItem = new FakeItem()
                .WithTemplate(Constants.TemplateIds.VirtualCountry);

            args.RenderedItem = pageItem;

            // Act
            dataContext.Process(args);

            // Assert
            args.ContextData.ContainsKey("accommodationCodes").Should().BeFalse();
        }

        [Fact]
        public void Process_ShouldNotAddAccommodationCodes_IfRenderingItemIsNull()
        {
            // Arrange
            var args = new GetLayoutServiceContextArgs();
            args.RenderedItem = null;

            // Act
            dataContext.Process(args);

            // Assert
            args.ContextData.ContainsKey("accommodationCodes").Should().BeFalse();
        }
    }
}

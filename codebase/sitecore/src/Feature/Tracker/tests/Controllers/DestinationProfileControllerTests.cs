using System.Web.Mvc;
using AutoFixture;
using easyJet.Feature.Tracker.Controllers;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;
using extensionConstants = easyJet.Foundation.SitecoreExtensions.Constants;

namespace easyJet.Feature.Tracker.Tests.Controllers
{
    public class DestinationProfileControllerTests
    {
        private readonly Fixture fixture;
        private readonly ICustomCacheRepository cacheMock;
        private readonly DestinationProfileController sut;

        public DestinationProfileControllerTests()
        {
            fixture = new Fixture();
            cacheMock = Substitute.For<ICustomCacheRepository>();
            sut = Substitute.ForPartsOf<DestinationProfileController>(cacheMock, Substitute.For<ICsvUtilsService>());
        }

        [Fact]
        public void ExportRegionProfileThemes_GetsCachedData_AndReturnsItAsExcel()
        {
            // Arrange
            var bytes = fixture.Create<byte[]>();
            cacheMock.GetItem<byte[]>(Constants.Profiles.HotelThemesProfileExportCacheKey).ReturnsForAnyArgs(bytes);

            // Act
            var result = sut.ExportRegionProfileThemes() as FileResult;

            // Assert
            result.Should().NotBeNull();
            result.ContentType.Should().Be(extensionConstants.ContentTypes.ExcelResponse);
        }
    }
}

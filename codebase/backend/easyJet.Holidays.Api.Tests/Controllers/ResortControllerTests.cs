using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Interfaces.Poi;
using easyJet.Holidays.Api.Domain.Models.Poi;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace easyJet.Holidays.Api.Tests.Controllers
{
    public sealed class ResortControllerTests
    {
        private readonly Mock<IPoiService> _poiService = new();
        private readonly ResortController _sut;

        public ResortControllerTests()
        {
            _sut = new ResortController(_poiService.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };
        }

        private static IEnumerable<PoiByCategory> SamplePoiResult() => new []
        {
            new PoiByCategory("Food", new [] { new PoiByCategoryItem("Cafe", string.Empty, 5, false, "Food") }),
            new PoiByCategory("Museum", new [] { new PoiByCategoryItem("History Museum", "1.2", 10, null, "Museum") })
        };

        [Fact]
        public async Task GetPoi_ReturnsOk_WithServiceResult()
        {
            // Arrange
            var expected = SamplePoiResult().ToList();
            _poiService.Setup(s => s.GetPoiAsync("RES1", "Food,Museum", 12.34, 56.78, "LTN", "B"))
                       .ReturnsAsync(expected);

            // Act
            var response = await _sut.GetPoi("RES1", "Food,Museum", 12.34, 56.78, "LTN", "B");

            // Assert
            response.Should().BeOfType<OkObjectResult>();
            var ok = response as OkObjectResult;
            ok!.Value.Should().BeEquivalentTo(expected);
            _poiService.Verify(s => s.GetPoiAsync("RES1", "Food,Museum", 12.34, 56.78, "LTN", "B"), Times.Once);
        }

        [Fact]
        public async Task GetPoi_WithoutCoordinates_PassesNullsToService()
        {
            // Arrange
            var expected = Enumerable.Empty<PoiByCategory>();
            _poiService.Setup(s => s.GetPoiAsync("RES1", string.Empty, null, null, null, null))
                       .ReturnsAsync(expected);

            // Act
            var response = await _sut.GetPoi("RES1", string.Empty, null, null, null, null);

            // Assert
            response.Should().BeOfType<OkObjectResult>();
            var ok = response as OkObjectResult;
            ok!.Value.Should().BeEquivalentTo(expected);
            _poiService.Verify(s => s.GetPoiAsync("RES1", string.Empty, null, null, null, null), Times.Once);
        }

        [Fact]
        public async Task GetPoi_ServiceReturnsEmptyEnumerable_ReturnsOkWithEmpty()
        {
            // Arrange
            _poiService.Setup(s => s.GetPoiAsync("RES1", "Food", 0.0, 0.0, "LGW", "C"))
                       .ReturnsAsync(Array.Empty<PoiByCategory>());

            // Act
            var response = await _sut.GetPoi("RES1", "Food", 0.0, 0.0, "LGW", "C");

            // Assert
            response.Should().BeOfType<OkObjectResult>();
            var ok = response as OkObjectResult;
            (ok!.Value as IEnumerable<PoiByCategory>)!.Should().BeEmpty();
            _poiService.Verify(s => s.GetPoiAsync("RES1", "Food", 0.0, 0.0, "LGW", "C"), Times.Once);
        }

        [Fact]
        public async Task GetPoi_PassesAllQueryParameters()
        {
            // Arrange
            var expected = SamplePoiResult();
            _poiService.Setup(s => s.GetPoiAsync("RESX", "nearby,food", 1.1, 2.2, "MAN", "X"))
                       .ReturnsAsync(expected);

            // Act
            var response = await _sut.GetPoi("RESX", "nearby,food", 1.1, 2.2, "MAN", "X");

            // Assert
            response.Should().BeOfType<OkObjectResult>();
            _poiService.Verify(s => s.GetPoiAsync("RESX", "nearby,food", 1.1, 2.2, "MAN", "X"), Times.Once);
        }
    }
}

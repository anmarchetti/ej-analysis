using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class ImagesServiceTests
    {
        private readonly ImagesService sut;
        private readonly IDestinationsLogger logger;

        public ImagesServiceTests()
        {
            logger = Substitute.For<IDestinationsLogger>();
            sut = new ImagesService(logger);
        }

        [Fact]
        public void CheckIfImageIsBroken_ShouldReturnFalse_IfUrlEmpty()
        {
            // Arrange
            var url = string.Empty;

            // Act
            var result = sut.CheckIfImageIsBroken(url);

            // Assert
            result.Should().BeFalse();
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void CheckIfImageIsBroken_ShouldReturnFalse_IfUrlNotValid()
        {
            // Arrange
            var url = "test";

            // Act
            var result = sut.CheckIfImageIsBroken(url);

            // Assert
            result.Should().BeTrue();
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void CheckIfImageIsBroken_ShouldReturnTrue_IfUrlDoesNotExist()
        {
            // Arrange
            var url = "http://localhost/test";

            // Act
            var result = sut.CheckIfImageIsBroken(url);

            // Assert
            result.Should().BeTrue();
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void CheckIfImagesAreBroken_ShouldReturnFalse_IfUrlNotValid()
        {
            // Arrange
            var url = "test";
            var url2 = "test2";

            // Act
            var result = sut.CheckIfImagesAreBroken(url, url2).GetAwaiter().GetResult();

            // Assert
            result.Should().BeTrue();
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void CheckIfImagesAreBroken_ShouldReturnTrue_IfUrlDoesNotExist()
        {
            // Arrange
            var url = "http://localhost/test";
            var url2 = "http://localhost/test2";

            // Act
            var result = sut.CheckIfImagesAreBroken(url, url2).GetAwaiter().GetResult();

            // Assert
            result.Should().BeTrue();
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}
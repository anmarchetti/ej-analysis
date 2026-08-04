using System;
using System.IO;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Feature.SitecoreEnhancment.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Services
{
    public class HostingEnvironmentServiceTests
    {
        [Fact]
        public void MapPath_Null_LogsAndReturnsNull()
        {
            // Arrange
            var logger = Substitute.For<IRenderingMappingLogger>();
            var sut = new HostingEnvironmentService(logger);

            // Act
            var result = sut.MapPath(null);

            // Assert
            result.Should().BeNull();
            logger.Received(1).Warn(Arg.Is<string>(s => s.Contains("MapPath")), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void FileExists_NullOrEmpty_ReturnsFalse()
        {
            var sut = new HostingEnvironmentService();
            sut.FileExists(null).Should().BeFalse();
            sut.FileExists(string.Empty).Should().BeFalse();
        }

        [Fact]
        public void FileExists_ExistingFile_ReturnsTrue()
        {
            var sut = new HostingEnvironmentService();
            var temp = Path.GetTempFileName();
            try
            {
                File.WriteAllText(temp, "x");
                sut.FileExists(temp).Should().BeTrue();
            }
            finally
            {
                File.Delete(temp);
            }
        }

        [Fact]
        public void ReadAllText_ReturnsFileContents()
        {
            var sut = new HostingEnvironmentService();
            var temp = Path.GetTempFileName();
            try
            {
                File.WriteAllText(temp, "hello");
                sut.ReadAllText(temp).Should().Be("hello");
            }
            finally
            {
                File.Delete(temp);
            }
        }
    }
}

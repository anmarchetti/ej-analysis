using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Atcom.Models.Domain;
using easyJet.Foundation.Atcom.Services;
using easyJet.Foundation.SitecoreExtensions.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Atcom.Tests.Services.Sync
{
    public class HybrisServiceTests
    {
        private readonly ISftpService sftpService;
        private readonly HybrisService hybrisService;

        public HybrisServiceTests()
        {
            sftpService = Substitute.For<ISftpService>();
            hybrisService = new HybrisService(sftpService);
        }

        [Fact]
        public void GetRoomTypeFacilities_ShouldBeEmpty_IfSftpServiceReturnNull()
        {
            // Arrange
            List<RoomAttributesFileModel> expected = null;
            sftpService.GetLastUpdatedFileData<RoomAttributesFileModel>(Arg.Any<FileParameters>())
                .Returns(expected);

            // Act
            var actual = hybrisService.GetRoomTypeFacilities();

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetRoomTypeFacilities_ShouldBeNotEmpty_IfSftpServiceReturnData(List<RoomAttributesFileModel> expected)
        {
            // Arrange
            sftpService.GetLastUpdatedFileData<RoomAttributesFileModel>(Arg.Any<FileParameters>())
                .Returns(expected);

            // Act
            var actual = hybrisService.GetRoomTypeFacilities();

            // Assert
            actual.Should().NotBeEmpty();
        }

        [Fact]
        public void GetAccommodationRoomTypes_ShouldBeEmpty_IfSftpServiceReturnNull()
        {
            // Arrange
            List<RoomTypeFacilitiesFileModel> expected = null;
            sftpService.GetLastUpdatedFileData<RoomTypeFacilitiesFileModel>(Arg.Any<FileParameters>())
                .Returns(expected);

            // Act
            var actual = hybrisService.GetAccommodationRoomTypes();

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetAccommodationRoomTypes_ShouldBeNotEmpty_IfSftpServiceReturnData(List<RoomTypeFacilitiesFileModel> expected)
        {
            // Arrange
            sftpService.GetLastUpdatedFileData<RoomTypeFacilitiesFileModel>(Arg.Any<FileParameters>())
                .Returns(expected);

            // Act
            var actual = hybrisService.GetAccommodationRoomTypes();

            // Assert
            actual.Should().NotBeEmpty();
        }
    }
}

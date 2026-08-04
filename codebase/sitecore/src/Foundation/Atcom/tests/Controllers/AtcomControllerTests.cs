using System.Collections.Generic;
using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Foundation.Atcom.Controllers;
using easyJet.Foundation.Atcom.Models;
using easyJet.Foundation.Atcom.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Atcom.Tests.Controllers
{
    public class AtcomControllerTests
    {
        private readonly IMasterDataService service;
        private readonly AtcomController atcomController;

        public AtcomControllerTests()
        {
            service = Substitute.For<IMasterDataService>();
            atcomController = new AtcomController(service);
        }

        [Theory]
        [AutoData]
        public void GetRoomCodes_ShouldReturnCodes_IfAtcomReturnsCodes(IEnumerable<DataObject> data)
        {
            // Arrange
            service.GetRoomCodes().Returns(data);

            // Act
            var actual = (IEnumerable<DataObject>)(atcomController.GetRoomCodes() as JsonResult).Data;

            // Assert
            actual.Should().BeEquivalentTo(data);
        }

        [Theory]
        [AutoData]
        public void GetRoomFacilities_ShouldReturnFacilities_IfAtcomReturnsFacilities(IEnumerable<DataObject> data)
        {
            // Arrange
            service.GetRoomFacilities().Returns(data);

            // Act
            var actual = (IEnumerable<DataObject>)(atcomController.GetRoomFacilities() as JsonResult).Data;

            // Assert
            actual.Should().BeEquivalentTo(data);
        }

        [Theory]
        [AutoData]
        public void GetCountryCodes_ShouldReturnCodes_IfAtcomReturnsCodes(IEnumerable<DataObject> data)
        {
            // Arrange
            service.GetCountryCodes().Returns(data);

            // Act
            var actual = (IEnumerable<DataObject>)(atcomController.GetCountryCodes() as JsonResult).Data;

            // Assert
            actual.Should().BeEquivalentTo(data);
        }

        [Theory]
        [AutoData]
        public void GetLocationCodes_ShouldReturnCodes_IfAtcomReturnsCodes(IEnumerable<DataObject> data)
        {
            // Arrange
            service.GetLocationCodes(Arg.Any<string>()).Returns(data);

            // Act
            var actual = (IEnumerable<DataObject>)(atcomController.GetLocationCodes("code1") as JsonResult).Data;

            // Assert
            actual.Should().BeEquivalentTo(data);
        }

        [Theory]
        [AutoData]
        public void GetResortCodes_ShouldReturnCodes_IfAtcomReturnsCodes(IEnumerable<DataObject> data)
        {
            // Arrange
            service.GetResortCodes(Arg.Any<string>()).Returns(data);

            // Act
            var actual = (IEnumerable<DataObject>)(atcomController.GetResortCodes("code1") as JsonResult).Data;

            // Assert
            actual.Should().BeEquivalentTo(data);
        }

        [Theory]
        [AutoData]
        public void GetAirports_ShouldReturnAirports_IfAtcomReturnsAirports(IEnumerable<DataObject> data)
        {
            // Arrange
            service.GetAirports(Arg.Any<string>()).Returns(data);

            // Act
            var actual = (IEnumerable<DataObject>)(atcomController.GetAirports("code1") as JsonResult).Data;

            // Assert
            actual.Should().BeEquivalentTo(data);
        }

        [Theory]
        [AutoData]
        public void GetAccommodationCodes_ShouldReturnCodes_IfAtcomReturnsCodes(IEnumerable<AtcomAccommodationMasterDataObject> data)
        {
            // Arrange
            service.GetAccommodations(Arg.Any<string>()).Returns(data);

            // Act
            var actual = (IEnumerable<DataObject>)(atcomController.GetAccommodationCodes("code1") as JsonResult).Data;

            // Assert
            actual.Should().BeEquivalentTo(data);
        }

        [Theory]
        [AutoData]
        public void GetStarRatingCodes_ShouldReturnCodes_IfAtcomReturnsCodes(IEnumerable<DataObject> data)
        {
            // Arrange
            service.GetStarRatingCodes().Returns(data);

            // Act
            var actual = (IEnumerable<DataObject>)(atcomController.GetStarRatingCodes() as JsonResult).Data;

            // Assert
            actual.Should().BeEquivalentTo(data);
        }
    }
}

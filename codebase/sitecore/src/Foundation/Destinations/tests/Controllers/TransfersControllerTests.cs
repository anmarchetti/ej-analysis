using System;
using System.Collections.Generic;
using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Controllers;
using easyJet.Foundation.Destinations.Logging;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Controllers
{
    public class TransfersControllerTests
    {
        private readonly ITransferInfoRepository transferInfoRepository;
        private readonly TransfersController transfersController;
        private readonly IDestinationsLogger logger;

        public TransfersControllerTests()
        {
            transferInfoRepository = Substitute.For<ITransferInfoRepository>();
            logger = Substitute.For<IDestinationsLogger>();
            transfersController = new TransfersController(transferInfoRepository, logger);
        }

        [Fact]
        public void GetHolidayTransfer_ShouldThrowexception_IfProductIdIsNull()
        {
            // Act
            Action actual = () => transfersController.GetHolidayTransferByProductId(null);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [AutoData]
        public void GetHolidayTransfer_ShouldReturnHolidayTransferByProductId_IfHitExists(string productId)
        {
            // Arrange
            var transferInfo = new List<SearchHit<BaseTransferInfoSearchResultItem>>()
            {
                new SearchHit<BaseTransferInfoSearchResultItem>(1, new BaseTransferInfoSearchResultItem()
                {
                    Duration = 5,
                    AirportId = "Id 1",
                    ResortId = "code",
                    ArrivalInstr = "Instr 1",
                    DepInstr = "Instr 2",
                    ProductId = productId
                })
            };
            var transferInfoResults = new SearchResults<BaseTransferInfoSearchResultItem>(transferInfo, 1);

            transferInfoRepository.GetTransfersByProductIds(Arg.Any<string[]>()).Returns(transferInfoResults);
            // Act
            var actual = (transfersController.GetHolidayTransferByProductId(productId) as JsonResult).Data;

            // Assert
            actual.Should().NotBeNull();
        }
    }
}

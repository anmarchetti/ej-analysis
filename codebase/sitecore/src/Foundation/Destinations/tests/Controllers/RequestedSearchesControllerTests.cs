using System.Collections.Generic;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.Controllers;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Controllers
{
    public class RequestedSearchesControllerTests
    {
        private readonly IRequestedSearchesService requestedSearchesService;

        private readonly RequestedSearchesController controller;

        public RequestedSearchesControllerTests()
        {
            requestedSearchesService = Substitute.For<IRequestedSearchesService>();
            controller = new RequestedSearchesController(requestedSearchesService);
        }

        [Fact]
        public void Get_ShouldBeNotNull_IfHasRequestedSearches()
        {
            // Arrange
            requestedSearchesService.GetRequestedSearches("UK").Returns(new List<RequestedSearch> { new RequestedSearch(null) });

            // Act
            var actual = controller.Get(new RequestedSearchesRequest { MarketCode = "UK" }) as JsonResult;

            // Assert
            actual.Data.Should().NotBeNull();
            var response = actual.Data as RequestedSearchesResponse;
            response.Should().NotBeNull();
            response.RequestedSearches.Should().NotBeEmpty();
        }
    }
}

using System.Collections.Generic;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.Controllers;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Repositories;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Controllers
{
    public class LivePriceControllerTests
    {
        private readonly ILivePriceRepository livePriceRepository;

        private readonly LivePriceController controller;

        public LivePriceControllerTests()
        {
            livePriceRepository = Substitute.For<ILivePriceRepository>();
            controller = new LivePriceController(livePriceRepository);
        }

        [Fact]
        public void Get_ShouldBeNotNull_IfHasLivePriceSettings()
        {
            // Arrange
            livePriceRepository.GetLivePriceSettings("UK").Returns(new List<NamedSearchItem> { new NamedSearchItem(null) });

            // Act
            var actual = controller.Get(new LivePriceSettingsRequest { MarketCode = "UK" }) as JsonResult;

            // Assert
            actual.Data.Should().NotBeNull();
            var response = actual.Data as LivePriceSettingsResponse;
            response.Should().NotBeNull();
            response.NamedSearches.Should().NotBeEmpty();
        }
    }
}

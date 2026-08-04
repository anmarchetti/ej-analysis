using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Interfaces.Aws;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.External.Apollo.Models;
using easyJet.Holidays.External.Apollo.Services;
using Amazon.Runtime;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers
{
    public class ApolloControllerTests
    {
        [Fact]
        public async Task GetBookingsByCustomerId_CallsServiceWithMappedCustomerId_AndReturnsJsonResult()
        {
            var apolloServiceMock = new Mock<IApolloService>();
            var customerIdentifierProviderMock = new Mock<ICustomerIdentifierProvider>();

            var expected = new UpcomingBookingsModel
            {
                Bookings = [new UpcomingBookingModel { BookingReference = "EJH123" }]
            };

            customerIdentifierProviderMock
                .Setup(x => x.CustomerIdentifiers())
                .ReturnsAsync(new CustomerIdentifiers { Id = "19082647" });

            apolloServiceMock
                .Setup(x => x.GetUpcomingBookingsByEncryptedMemberId("19082647", 100, null))
                .ReturnsAsync(expected);

            var sut = new ApolloController(apolloServiceMock.Object, customerIdentifierProviderMock.Object);

            var result = await sut.GetBookingsByCustomerId();

            var jsonResult = Assert.IsType<JsonResult>(result);
            jsonResult.Value.Should().BeSameAs(expected);
            apolloServiceMock.VerifyAll();
            customerIdentifierProviderMock.VerifyAll();
        }

        [Fact]
        public async Task GetBookingsByCustomerId_WhenMappedIdMissing_ReturnsBadRequest()
        {
            var apolloServiceMock = new Mock<IApolloService>();
            var customerIdentifierProviderMock = new Mock<ICustomerIdentifierProvider>();

            customerIdentifierProviderMock
                .Setup(x => x.CustomerIdentifiers())
                .ReturnsAsync(new CustomerIdentifiers { Id = string.Empty });

            var sut = new ApolloController(apolloServiceMock.Object, customerIdentifierProviderMock.Object);

            var result = await sut.GetBookingsByCustomerId();

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            badRequestResult.Value.Should().Be("Couldn't get customer ID.");
            apolloServiceMock.Verify(x => x.GetUpcomingBookingsByEncryptedMemberId(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string?>()), Times.Never);
        }

        [Fact]
        public async Task GetBookingsByCustomerId_WhenEncryptedIdMockWhitespace_UsesCustomerIdentifiers()
        {
            var apolloServiceMock = new Mock<IApolloService>();
            var customerIdentifierProviderMock = new Mock<ICustomerIdentifierProvider>();

            customerIdentifierProviderMock
                .Setup(x => x.CustomerIdentifiers())
                .ReturnsAsync(new CustomerIdentifiers { Id = "mapped-42" });

            apolloServiceMock
                .Setup(x => x.GetUpcomingBookingsByEncryptedMemberId("mapped-42", 100, null))
                .ReturnsAsync(new UpcomingBookingsModel { Bookings = [] });
            
            var sut = new ApolloController(apolloServiceMock.Object, customerIdentifierProviderMock.Object);

            var result = await sut.GetBookingsByCustomerId();

            Assert.IsType<JsonResult>(result);
            apolloServiceMock.VerifyAll();
            customerIdentifierProviderMock.VerifyAll();
        }
    }
}

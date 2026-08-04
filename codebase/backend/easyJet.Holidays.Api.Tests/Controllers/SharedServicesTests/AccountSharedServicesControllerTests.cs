using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers.SharedServices;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace easyJet.Holidays.Api.Tests.Controllers.SharedServicesTests;

public class AccountSharedServicesControllerTests
{
    private readonly Mock<ICustomerIdentifierProvider> _mockCustomerIdentifierProvider;
    private readonly AccountSharedServicesController _controller;

    public AccountSharedServicesControllerTests()
    {
        _mockCustomerIdentifierProvider = new Mock<ICustomerIdentifierProvider>();
        _controller = new AccountSharedServicesController(_mockCustomerIdentifierProvider.Object);
    }

    [Fact]
    public async Task CustomerIdentifiers_ShouldReturnOkResult_WhenCustomerIdentifiersAreValid()
    {
        // Arrange
        var expectedCustomerIdentifiers = new CustomerIdentifiers { Id = "customer123", MappedId = "mapped123" };

        _mockCustomerIdentifierProvider.Setup(provider => provider.CustomerIdentifiers())
            .ReturnsAsync(expectedCustomerIdentifiers);

        // Act
        var result = await _controller.CustomerIdentifiers();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(expectedCustomerIdentifiers);
    }

    [Fact]
    public async Task CustomerIdentifiers_ShouldReturnInternalServerError_WhenExceptionIsThrown()
    {
        // Arrange
        _mockCustomerIdentifierProvider.Setup(provider => provider.CustomerIdentifiers())
#pragma warning disable CA2201
            .ThrowsAsync(new Exception("An error occurred"));
#pragma warning restore CA2201

        // Act
        var action = async () => await _controller.CustomerIdentifiers();

        // Assert
        await action.Should().ThrowAsync<ApiException>()
            .Where(ex => ex.Code.Code == ApiExceptionCodes.AuthCustomerDetailsError.Code);
    }
}
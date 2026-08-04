using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Authentication;

public class CustomerIdentifierProviderTests
{
    private readonly Mock<IAuthenticationService> _mockAuthenticationService;
    private readonly CustomerIdentifierProvider _customerIdentifierProvider;

    public CustomerIdentifierProviderTests()
    {
        _mockAuthenticationService = new Mock<IAuthenticationService>();
        _customerIdentifierProvider = new CustomerIdentifierProvider(_mockAuthenticationService.Object);
    }

    [Fact]
    public async Task CustomerIdentifiers_ShouldReturnCorrectIdentifiers()
    {
        // Arrange
        var customerDetails = new CustomerDetails { Id = "customer123" };
        var mappedCustomerId = "mapped123";

        _mockAuthenticationService.Setup(service => service.CustomerDetails())
            .ReturnsAsync(customerDetails);

        _mockAuthenticationService.Setup(service => service.MappedCustomerId(customerDetails))
            .ReturnsAsync(mappedCustomerId);

        // Act
        var result = await _customerIdentifierProvider.CustomerIdentifiers();

        // Assert
        result.Should().BeEquivalentTo(new CustomerIdentifiers
        {
            Id = customerDetails.Id,
            MappedId = mappedCustomerId
        });
    }

    [Fact]
    public async Task CustomerIdentifiers_ShouldReturnNullWhenCustomerDetailsAreNull()
    {
        // Arrange
        _mockAuthenticationService.Setup(service => service.CustomerDetails())
            .ReturnsAsync((CustomerDetails)null);

        // Act
        var result = await _customerIdentifierProvider.CustomerIdentifiers();

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().BeNull();
        result.MappedId.Should().BeNull();
    }

    [Fact]
    public async Task CustomerIdentifiers_ShouldHandleMappedCustomerIdNull()
    {
        // Arrange
        var customerDetails = new CustomerDetails { Id = "customer123" };

        _mockAuthenticationService.Setup(service => service.CustomerDetails())
            .ReturnsAsync(customerDetails);

        _mockAuthenticationService.Setup(service => service.MappedCustomerId(customerDetails))
            .ReturnsAsync((string)null);

        // Act
        var result = await _customerIdentifierProvider.CustomerIdentifiers();

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(customerDetails.Id);
        result.MappedId.Should().BeNull();
    }
}
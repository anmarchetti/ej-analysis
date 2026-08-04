using easyJet.Holidays.Api.Controllers.SharedServices;

namespace easyJet.Holidays.Api.Tests.Controllers.SharedServicesTests;

public class VouchersSharedServicesControllerTests
{
    [Fact]
    public void VouchersSharedServicesController_ShouldNotHaveApiControllerAttribute()
    {
        // Arrange
        var controllerType = typeof(VouchersSharedServicesController);

        // Act
        var hasApiControllerAttribute = controllerType.GetCustomAttributes(typeof(Microsoft.AspNetCore.Mvc.ApiControllerAttribute), inherit: false).Length != 0;

        // Assert
        Assert.False(hasApiControllerAttribute, "VouchersSharedServicesController should not have the ApiController attribute.");
    }
    
    [Fact]
    public void VouchersSharedServicesController_ShouldNotHaveIngeritedApiControllerAttribute()
    {
        // Arrange
        var controllerType = typeof(VouchersSharedServicesController);

        // Act
        var hasApiControllerAttribute = controllerType.GetCustomAttributes(typeof(Microsoft.AspNetCore.Mvc.ApiControllerAttribute), inherit: true).Length != 0;

        // Assert
        Assert.False(hasApiControllerAttribute, "VouchersSharedServicesController should not have the ApiController attribute.");
    }
}
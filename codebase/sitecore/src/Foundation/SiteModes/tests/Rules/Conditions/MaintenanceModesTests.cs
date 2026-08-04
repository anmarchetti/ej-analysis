using System.Web.Mvc;
using easyJet.Foundation.SiteModes.Rules.Conditions;
using easyJet.Foundation.SiteModes.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Rules;
using Xunit;

namespace easyJet.Foundation.SiteModes.Tests.Rules.Conditions
{
    public class MaintenanceModesTests
    {
        private readonly ISiteModeService service;

        public MaintenanceModesTests()
        {
            var dependencyResolver = Substitute.For<IDependencyResolver>();
            DependencyResolver.SetResolver(dependencyResolver);
            service = Substitute.For<ISiteModeService>();
            dependencyResolver.GetService<ISiteModeService>().Returns(service);
        }

        [Theory]
        [InlineData(true)]
        public void Execute_ShouldReturnModeState_IsFullMaintenanceMode(bool isFullMode)
        {
            // Arrange
            var mode = new IsFullMaintenanceMode<RuleContext>();
            service.IsFullMode().Returns(isFullMode);

            // Act
            var isFullMaintenanceMode = (bool)mode.GetType()
                .GetMethod("Execute", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                .Invoke(mode, new object[] { null });

            // Assert
            isFullMaintenanceMode.Should().Be(isFullMode);
        }

        [Theory]
        [InlineData(true)]
        public void Execute_ShouldReturnModeState_IsSoftMaintenanceMode(bool isSoftMode)
        {
            // Arrange
            var mode = new IsSoftMaintenanceMode<RuleContext>();
            service.IsSoftMode().Returns(isSoftMode);

            // Act
            var isSoftMaintenanceMode = (bool)mode.GetType()
                .GetMethod("Execute", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                .Invoke(mode, new object[] { null });

            // Assert
            isSoftMaintenanceMode.Should().Be(isSoftMode);
        }
    }
}

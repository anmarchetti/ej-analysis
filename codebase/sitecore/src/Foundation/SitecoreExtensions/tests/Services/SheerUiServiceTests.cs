using System;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Services
{
    /// <summary>
    /// Tests for SheerUiService - this service is excluded from code coverage
    /// as it's a thin wrapper around static Sitecore APIs.
    /// These tests verify the service implements the interface correctly.
    /// </summary>
    public class SheerUiServiceTests
    {
        [Fact]
        public void Constructor_DoesNotThrow()
        {
            // Act
            Action act = () => new SheerUiService();

            // Assert
            act.Should().NotThrow();
        }

        [Fact]
        public void SheerUiService_ImplementsISheerUiService()
        {
            // Arrange
            var sut = new SheerUiService();

            // Act & Assert
            sut.Should().BeAssignableTo<ISheerUiService>();
        }

        [Fact]
        public void SheerUiService_HasIsEventProperty()
        {
            // Arrange
            var sut = new SheerUiService();

            // Act
            var property = sut.GetType().GetProperty(nameof(ISheerUiService.IsEvent));

            // Assert
            property.Should().NotBeNull();
            property.CanRead.Should().BeTrue();
        }

        [Fact]
        public void SheerUiService_HasSetModifiedMethod()
        {
            // Arrange
            var sut = new SheerUiService();

            // Act
            var method = sut.GetType().GetMethod(nameof(ISheerUiService.SetModified));

            // Assert
            method.Should().NotBeNull();
            method.GetParameters().Should().BeEmpty();
        }

        [Fact]
        public void SheerUiService_HasStartMethod()
        {
            // Arrange
            var sut = new SheerUiService();

            // Act
            var method = sut.GetType().GetMethod(nameof(ISheerUiService.Start));

            // Assert
            method.Should().NotBeNull();
            method.GetParameters().Should().HaveCount(3);
        }

        [Fact]
        public void SheerUiService_HasGetClientEventMethod()
        {
            // Arrange
            var sut = new SheerUiService();

            // Act
            var method = sut.GetType().GetMethod(nameof(ISheerUiService.GetClientEvent));

            // Assert
            method.Should().NotBeNull();
            method.GetParameters().Should().HaveCount(1);
            method.ReturnType.Should().Be(typeof(string));
        }

        [Fact]
        public void SheerUiService_HasSetServerPropertyMethod()
        {
            // Arrange
            var sut = new SheerUiService();

            // Act
            var method = sut.GetType().GetMethod(nameof(ISheerUiService.SetServerProperty));

            // Assert
            method.Should().NotBeNull();
            method.GetParameters().Should().HaveCount(2);
        }

        [Fact]
        public void SheerUiService_HasAlertMethod()
        {
            // Arrange
            var sut = new SheerUiService();

            // Act
            var method = sut.GetType().GetMethod(nameof(ISheerUiService.Alert));

            // Assert
            method.Should().NotBeNull();
            method.GetParameters().Should().HaveCount(1);
            method.GetParameters()[0].ParameterType.Should().Be(typeof(string));
        }

        [Fact]
        public void SheerUiService_HasShowModalDialogMethod()
        {
            // Arrange
            var sut = new SheerUiService();

            // Act
            var method = sut.GetType().GetMethod(nameof(ISheerUiService.ShowModalDialog));

            // Assert
            method.Should().NotBeNull();
            method.GetParameters().Should().HaveCount(1);
        }

        [Fact]
        public void SheerUiService_HasSetAttributeMethod()
        {
            // Arrange
            var sut = new SheerUiService();

            // Act
            var method = sut.GetType().GetMethod(nameof(ISheerUiService.SetAttribute));

            // Assert
            method.Should().NotBeNull();
            method.GetParameters().Should().HaveCount(3);
            method.GetParameters()[0].ParameterType.Should().Be(typeof(string));
            method.GetParameters()[1].ParameterType.Should().Be(typeof(string));
            method.GetParameters()[2].ParameterType.Should().Be(typeof(string));
        }

        [Fact]
        public void SheerUiService_HasEvalMethod()
        {
            // Arrange
            var sut = new SheerUiService();

            // Act
            var method = sut.GetType().GetMethod(nameof(ISheerUiService.Eval));

            // Assert
            method.Should().NotBeNull();
            method.GetParameters().Should().HaveCount(1);
            method.GetParameters()[0].ParameterType.Should().Be(typeof(string));
        }

        [Fact]
        public void SheerUiService_AllMethodsArePublic()
        {
            // Arrange
            var sut = new SheerUiService();
            var type = sut.GetType();

            // Act
            var methods = type.GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.DeclaredOnly);

            // Assert
            methods.Should().NotBeEmpty();
            methods.Should().OnlyContain(m => m.IsPublic);
        }

        [Fact]
        public void SheerUiService_ImplementsAllInterfaceMethods()
        {
            // Arrange
            var interfaceType = typeof(ISheerUiService);
            var implementationType = typeof(SheerUiService);

            // Act
            var interfaceMethods = interfaceType.GetMethods();
            var interfaceProperties = interfaceType.GetProperties();

            // Assert
            foreach (var method in interfaceMethods)
            {
                var implMethod = implementationType.GetMethod(method.Name, method.GetParameters().Select(p => p.ParameterType).ToArray());
                implMethod.Should().NotBeNull($"method {method.Name} should be implemented");
            }

            foreach (var property in interfaceProperties)
            {
                var implProperty = implementationType.GetProperty(property.Name);
                implProperty.Should().NotBeNull($"property {property.Name} should be implemented");
            }
        }

        [Fact]
        public void SheerUiService_HasExcludeFromCodeCoverageAttribute()
        {
            // Arrange
            var type = typeof(SheerUiService);

            // Act
            var attributes = type.GetCustomAttributes(typeof(System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverageAttribute), false);

            // Assert
            attributes.Should().NotBeEmpty("SheerUiService should be excluded from code coverage as it's a thin wrapper");
        }

        [Fact]
        public void SheerUiService_IsPublicClass()
        {
            // Arrange & Act
            var type = typeof(SheerUiService);

            // Assert
            type.IsPublic.Should().BeTrue();
            type.IsClass.Should().BeTrue();
            type.IsAbstract.Should().BeFalse();
            type.IsSealed.Should().BeFalse();
        }

        [Fact]
        public void SheerUiService_HasParameterlessConstructor()
        {
            // Arrange
            var type = typeof(SheerUiService);

            // Act
            var constructor = type.GetConstructor(Type.EmptyTypes);

            // Assert
            constructor.Should().NotBeNull();
            constructor.IsPublic.Should().BeTrue();
        }
    }
}

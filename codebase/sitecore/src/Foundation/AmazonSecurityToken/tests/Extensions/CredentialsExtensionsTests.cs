using System;
using Amazon.SecurityToken.Model;
using easyJet.Foundation.AmazonSecurityToken.Extensions;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.AmazonSecurityToken.Tests.Extensions
{
    public class CredentialsExtensionsTests
    {
        [Fact]
        public void Expired_ShouldReturnTrue_IfCredentialsNull()
        {
            // Arrange
            var credentials = (Credentials)null;

            // Act
            var expected = credentials.Expired();

            // Assert
            expected.Should().BeTrue();
        }

        [Fact]
        public void Expired_ShouldReturnTrue_IfExpirationDateIsDateTimeMin()
        {
            // Arrange
            var credentials = new Credentials
            {
                Expiration = DateTime.MinValue
            };

            // Act
            var expected = credentials.Expired();

            // Assert
            expected.Should().BeTrue();
        }

        [Fact]
        public void Expired_ShouldReturnFalse_IfExpirationDateIsNotExpired()
        {
            // Arrange
            var credentials = new Credentials
            {
                Expiration = DateTime.UtcNow.AddMinutes(10)
            };

            // Act
            var expected = credentials.Expired();

            // Assert
            expected.Should().BeFalse();
        }

        [Fact]
        public void Expired_ShouldReturnTrue_IfExpirationDateIsExpired()
        {
            // Arrange
            var credentials = new Credentials
            {
                Expiration = DateTime.UtcNow
            };

            // Act
            var expected = credentials.Expired();

            // Assert
            expected.Should().BeTrue();
        }
    }
}

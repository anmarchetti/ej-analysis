using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Errors;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Exceptions
{
    public class ApiExceptionTests
    {
        // Arrange
        private ApiError[] Errors = new[] {
            new ApiError {
                    Code = "1",
                    Message = "test",
            }
        };

        [Fact]
        public void Constructor_1_InitCodeAndErrors()
        {
            // Act
            var uut = new ApiException(ApiExceptionCodes.BookingCreateError, "message", Errors, null);

            // Assert
            uut.Code.Should().BeEquivalentTo(ApiExceptionCodes.BookingCreateError);
            uut.InnerErrors.Should().BeEquivalentTo(Errors);
        }

        [Fact]
        public void Constructor_2_InitCodeAndErrors()
        {
            // Act
            var uut = new ApiException(ApiExceptionCodes.BookingCreateError, Errors, "message");

            // Assert
            uut.Code.Should().BeEquivalentTo(ApiExceptionCodes.BookingCreateError);
            uut.InnerErrors.Should().BeEquivalentTo(Errors);
        }

        [Fact]
        public void Constructor_3_InitCodeAndErrors()
        {
            // Act
            var uut = new ApiException(ApiExceptionCodes.BookingCreateError, Errors, (Exception)null);

            // Assert
            uut.Code.Should().BeEquivalentTo(ApiExceptionCodes.BookingCreateError);
            uut.InnerErrors.Should().BeEquivalentTo(Errors);
        }
    }
}

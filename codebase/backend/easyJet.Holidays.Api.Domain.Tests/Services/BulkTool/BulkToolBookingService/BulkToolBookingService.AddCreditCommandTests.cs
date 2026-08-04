using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Tests.Services.Booking;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Moq;
using System.Reflection;
using Voucherify.DataModel;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.BulkTool.BulkToolBookingService
{
    public class AddCreditCommandTests : BulkToolBookingServiceTests
    {
        [Theory]
        [InlineData("email@email.com")]
        public async Task BulkToolBookingService_ShouldThrowException_IfCanNotGetCustomer(string email)
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.AddCreditCommand,
                    Email = email,
                    Reason = "refund"
                }
            };

            _customersRepository.Setup(x => x.GetCustomersByEmail(email, 1)).Throws(new Exception());

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            _customersRepository.Verify(x => x.GetCustomersByEmail(email, 1));
        }

        [Theory]
        [InlineData("email.email.com")]
        [InlineData("emai.com")]
        [InlineData("email")]
        [InlineData("email$@com.com")]
        [InlineData("email-@com.com")]
        [InlineData("123@com.com")]
        [InlineData("email@com.commmmm")]
        public async Task BulkToolBookingService_ShouldThrowException_IfEmailInvalid(string email)
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.AddCreditCommand,
                    Email = email,
                    Reason = "refund"
                }
            };

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Message.Should().Be($"Failed to add credit to {email}");
        }

        [Theory]
        [InlineData("email.email@email.simple.com")]
        [InlineData("email@usernmae.host.com")]
        [InlineData("email-va@com.com")]
        [InlineData("123@com.com")]
        [InlineData("email@com.eu")]
        public async Task BulkToolBookingService_ShouldSuccessfullyPass_IfEmailValid(string email)
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.AddCreditCommand,
                    Email = email,
                    Reason = "refund"
                }
            };
            var ctor = typeof(CustomerList).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic)[0];
            var customersList = (CustomerList)ctor.Invoke(new object[0]);
            customersList.SetPrivateProperty("Customers", new List<Customer>() { new Customer() });

            _customersRepository.Setup(x => x.GetCustomersByEmail(It.IsAny<string>(), It.IsAny<int>())).ReturnsAsync(customersList);

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.Message.Should().Be($"Credit successfully added");
            act.CorrelationId.Should().NotBeNull();
            act.Reference.Should().Be(email);
        }

        [Theory]
        [InlineData("email@com.eu")]
        public async Task BulkToolBookingService_CorrectActionInMemo(string email)
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.AddCreditCommand,
                    Email = email,
                    Reason = "refund"
                }
            };
            var ctor = typeof(CustomerList).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic)[0];
            var customersList = (CustomerList)ctor.Invoke(Array.Empty<object>());
            customersList.SetPrivateProperty("Customers", new List<Customer>() { new Customer() });

            _customersRepository.Setup(x => x.GetCustomersByEmail(It.IsAny<string>(), It.IsAny<int>())).ReturnsAsync(customersList);

            _vouchersService.Setup(x => x.CreateAndPublishVoucher(
                It.IsAny<string>(),
                It.IsAny<decimal>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Dictionary<string, object>>(),
                It.IsAny<string>(),
                null
            ));

            // Actual
            await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            _vouchersService.Verify(x => x.CreateAndPublishVoucher(
                It.IsAny<string>(),
                It.IsAny<decimal>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.Is<Dictionary<string, object>>(meta => "add credit" == meta["action"].ToString()),
                "refund",
                null
            ));
        }

        [Fact]
        public async Task BulkToolBookingService_ShouldThrowException_IfEmailIsEmptyOrNull()
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.AddCreditCommand
                }
            };

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Message.Should().Be("Email can not be empty");
        }

    }
}

using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Services.BulkTool;
using easyJet.Holidays.Api.Domain.Services.BulkTool.Commands;
using easyJet.Holidays.Api.Domain.Tests.Services.BulkTool.BulkToolBookingService;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Globalization;
using Voucherify.DataModel;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.BulkTool.Commands
{
    public class TransferCreditCommandTests : BulkToolBookingServiceTests
    {
        private Mock<BulkToolActions> _actionsMock;
        private new readonly Mock<ILogger<TransferCreditCommand>> _logger;

        public TransferCreditCommandTests()
        {
            _logger = _fixture.Freeze<Mock<ILogger<TransferCreditCommand>>>();
        }

        private BulkToolRequest BuildHappyPathRequest(string emailFrom, string emailTo, string currency, decimal amount)
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new ()
                {
                    Flag = _commandsSettings.TransferCreditCommand,
                    Reference = emailFrom,
                    Email = emailTo,
                    Amount = amount.ToString(CultureInfo.InvariantCulture),
                    Currency = currency
                }
            };

            // Arrange 
            _actionsMock = _fixture.Freeze<Mock<BulkToolActions>>();
            var customerFrom = new Customer();
            customerFrom.SetProperty(x => x.Id, emailFrom + "-id");
            _actionsMock.Setup(x => x.GetCustomerByEmailOrCreate(emailFrom)).ReturnsAsync(customerFrom);

            var customerTo = new Customer();
            customerTo.SetProperty(x => x.Id, emailTo + "-id");
            _actionsMock.Setup(x => x.GetCustomerByEmailOrCreate(emailTo)).ReturnsAsync(customerTo);

            _vouchersService.Setup(x => x.TransferVouchers(emailFrom + "-id", emailTo + "-id", currency, It.IsAny<Func<IEnumerable<VoucherWithCustomer>, IEnumerable<VoucherWithCustomer>>>()))
                .ReturnsAsync(new TransferResult
                {
                    Successfull = new List<string> { "voucher-code-01,GBP", "voucher-code-02,GBP" }
                });

            return request;
        }

        [Theory]
        [InlineData("from@email.com", "to@email.com")]
        public async Task TransferSuccess_Returns_Codes(string emailFrom, string emailTo)
        {
            // Arrange 
            var request = BuildHappyPathRequest(emailFrom, emailTo, Currency.GBP.Code, 10000);
            var sut = new TransferCreditCommand(_logger.Object, _actionsMock.Object, _vouchersService.Object);

            // Act
            var actual = await sut.Invoke(null, request, "correlation-id-000");

            // Assert
            actual.CorrelationId.Should().BeNullOrEmpty();
            actual.Message.Should().Be("Successfully transferred vouchers");
            actual.Note.Should().Be("voucher-code-01,GBP, voucher-code-02,GBP");
        }

        [Theory]
        [InlineData("from@email.com", "to@email.com")]
        public async Task TransferFailed_Returns_Codes(string emailFrom, string emailTo)
        {
            // Arrange 
            var request = BuildHappyPathRequest(emailFrom, emailTo, Currency.GBP.Code, 10000);
            var sut = new TransferCreditCommand(_logger.Object, _actionsMock.Object, _vouchersService.Object);

            _vouchersService.Setup(x => x.TransferVouchers(emailFrom + "-id", emailTo + "-id", Currency.GBP.Code, It.IsAny<Func<IEnumerable<VoucherWithCustomer>, IEnumerable<VoucherWithCustomer>>>()))
                .ReturnsAsync(new TransferResult
                {
                    Failed = new List<string> { "voucher-code-01", "voucher-code-02" }
                });

            // Act
            var actual = await sut.Invoke(null, request, "correlation-id-000");

            // Assert
            actual.CorrelationId.Should().Be("correlation-id-000");
            actual.Message.Should().Be("Error during credits transfer. Failed vouchers: voucher-code-01, voucher-code-02");
        }

        [Theory]
        [MemberData(nameof(TransferErrorsTestData))]
        public async Task TransferException_Returns_Message(ExceptionCode code, string expectedMessage)
        {
            // Arrange 
            var emailFrom = "from@email.com";
            var emailTo = "to@email.com";
            var request = BuildHappyPathRequest(emailFrom, emailTo, Currency.GBP.Code, 10000);
            var sut = new TransferCreditCommand(_logger.Object, _actionsMock.Object, _vouchersService.Object);

            _vouchersService.Setup(x => x.TransferVouchers(emailFrom + "-id", emailTo + "-id", Currency.GBP.Code, It.IsAny<Func<IEnumerable<VoucherWithCustomer>, IEnumerable<VoucherWithCustomer>>>()))
                .Throws(new ApiException(code));

            // Act
            var actual = await sut.Invoke(null, request, "correlation-id-000");

            // Assert
            actual.CorrelationId.Should().NotBeNull();
            actual.Message.Should().Be(expectedMessage);
        }

        public static IEnumerable<object[]> TransferErrorsTestData()
        {
            yield return new object[] {
                        ApiExceptionCodes.CreditsTransferNoCustomer,
                        "Cannot get customer by email"
                    };
            yield return new object[] {
                        ApiExceptionCodes.CreditsTransferNoVouchersSubset,
                        "No valid vouchers subset for requested amount"
                    };
            yield return new object[] {
                        ApiExceptionCodes.CreditsTransferNoVouchers,
                        "No vouchers to transfer"
                    };
        }
    }
}
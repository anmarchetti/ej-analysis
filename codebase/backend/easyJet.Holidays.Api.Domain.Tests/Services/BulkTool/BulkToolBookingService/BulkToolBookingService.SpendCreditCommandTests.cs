using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Services.BulkTool.Commands;
using easyJet.Holidays.Api.Domain.Tests.Services.Booking;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Moq;
using System.Globalization;
using System.Reflection;
using Voucherify.DataModel;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.BulkTool.BulkToolBookingService
{
    public class SpendCreditCommandTests : BulkToolBookingServiceTests
    {
        private BulkToolRequest BuildRequest(string reqEmail, string bookingEmail, decimal amount, string reference, string bookingStatus = "CONFIRMED")
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new ()
                {
                    Flag = _commandsSettings.SpendCreditCommand,
                    Reference = reference,
                    Email = reqEmail,
                    Amount = amount.ToString(CultureInfo.InvariantCulture)
                }
            };

            var booking = new BookingResponse()
            {
                BookingStatus = bookingStatus,
                BookingReference = reference,
                CustomerDetails = new CustomerDetails()
                {
                    Email = bookingEmail
                },
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation { Code = "1234567" }
                }
            };
            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            var ctor = typeof(CustomerList).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic)[0];
            var customersList = (CustomerList)ctor.Invoke(new object[0]);
            customersList.SetPrivateProperty("Customers", new List<Customer>() { new Customer { SourceId = "cust_1" } });
            _customersRepository.Setup(x => x.GetCustomersByEmail(It.IsAny<string>(), It.IsAny<int>())).ReturnsAsync(customersList);

            return request;
        }

        [Theory]
        [InlineData("email@email.com", 144, "100001", "CONFIRMED")]
        [InlineData("email@email.com", 144, "100001", "BOOKING")]
        public async Task AddCreditToBooking_Successful_ReturnsVoucherIds(string email, decimal amount, string reference, string bookingStatus)
        {
            // Arrange 
            var request = BuildRequest(email, email, amount, reference, bookingStatus);

            _bookingCreditService.Setup(x => x.SpendCredit(It.IsAny<BookingResponse>(), It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<RedemptionMetadata>())).ReturnsAsync(new List<CreditSpend> {
                new CreditSpend {
                    VouchersIds = "v_1",
                    ReasonCode = "refund"
                }
            });

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().BeNullOrEmpty();
            act.Reference.Should().Be(reference);
            act.Message.Should().Be("Successfully added credit to booking");
            act.Note.Should().Be("v_1");
        }
        
        [Fact]
        public async Task SpendCreditCommand_RequestIsNull_ReturnsError()
        {
            var command = _fixture.Create<SpendCreditCommand>();
            
            var result = await command.Invoke(new BookingResponse(), null, "123456");

            result.Message.Should().Be("request is null");
            result.Reference.Should().BeNull();
        }
        
        [Fact]
        public async Task SpendCreditCommand_BookingIsNull_ReturnsError()
        {
            var command = _fixture.Create<SpendCreditCommand>();
            
            var result = await command.Invoke(null, new BulkToolRequest(), "123456");

            result.Message.Should().Be("booking is null");
            result.Reference.Should().BeNull();
        }

        [Theory]
        [InlineData("email@email.com", "email@email.com", true)]
        [InlineData("email@email.com", "EmAiL@email.com", true)]
        [InlineData("email@email.com", "email@email2.com", false)]
        public async Task AddCreditToBooking_ValidateEmails(string reqEmail, string bookingEmail, bool isOk)
        {
            // Arrange
            var request = BuildRequest(reqEmail, bookingEmail, 144, "100001");
            _bookingCreditService.Setup(x => x.SpendCredit(It.IsAny<BookingResponse>(), It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<RedemptionMetadata>())).ReturnsAsync(new List<CreditSpend>());

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            if (isOk)
            {
                act.CorrelationId.Should().BeNullOrEmpty();
            }
            else
            {
                act.CorrelationId.Should().NotBeNull();
                act.Message.Should().Be("Customer email is different from booking email");
            }
        }

        [Theory]
        [InlineData("email@email.com", 144, "100001", "CANCELED", "Cannot process booking with status CANCELED")]
        [InlineData("email@email.com", 144, "100001", "LOCK", "Cannot process booking with status LOCK")]
        [InlineData("email@email.com", 144, "100001", "QUOTE", "Booking in QUOTE status can't be processed")]
        [InlineData("email@email.com", 144, "100001", "OPTION", "Booking in OPTION status can't be processed")]
        public async Task AddCreditToBooking_BookingStatusInvalid_ReturnError(string email, decimal amount, string reference, string bookingStatus, string msg)
        {
            // Arrange 
            var request = BuildRequest(email, email, amount, reference, bookingStatus);

            _bookingCreditService.Setup(x => x.SpendCredit(It.IsAny<BookingResponse>(), It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<RedemptionMetadata>())).ReturnsAsync(new List<CreditSpend>());

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Reference.Should().Be(reference);
            act.Message.Should().Be(msg);
        }


        [Theory]
        [MemberData(nameof(SpendErrorsTestData))]
        public async Task AddCreditToBooking_SpendErrors_ReturnError(ExceptionCode code, string expectedMessage)
        {
            // Arrange
            var request = BuildRequest("email@email.com", "email@email.com", 140, "1000001");

            _bookingCreditService.Setup(x => x.SpendCredit(It.IsAny<BookingResponse>(), It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<RedemptionMetadata>())).Throws(new ApiException(code));

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Message.Should().Be(expectedMessage);
        }

        public static IEnumerable<object[]> SpendErrorsTestData()
        {
            yield return new object[] {
                ApiExceptionCodes.CreditsSpendCreditsFullyPaid,
                "Booking is fully paid"
            };
            yield return new object[] {
                ApiExceptionCodes.CreditsSpendCreditsPriceNegative,
                "Credit amount should be greater than 0"
            };
            yield return new object[] {
                ApiExceptionCodes.CreditsSpendCreditsInvalidPrice,
                "Credit amount should not be less than due amount"
            };
            yield return new object[] {
                ApiExceptionCodes.CreditsSpendCreditsCreditsDisabled,
                "Credit service is not available"
            };
            yield return new object[] {
                ApiExceptionCodes.CreditsInsufficientFunds,
                "Insufficient funds"
            };
            yield return new object[] {
                ApiExceptionCodes.InternalServerError,
                "Failed to add credit to booking"
            };
        }
    }
}
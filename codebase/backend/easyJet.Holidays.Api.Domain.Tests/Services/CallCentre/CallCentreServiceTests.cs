using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.CallCentre;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Settings;
using easyJet.Holidays.Api.Domain.Services.CallCentre;
using easyJet.Holidays.Api.Domain.Services.Settings;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using System.Reflection;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using Voucherify.DataModel;
using Xunit;
using CustomerDetails = easyJet.Holidays.Api.Domain.Data.Authentication.CustomerDetails;

namespace easyJet.Holidays.Api.Domain.Tests.Services.CallCentre
{
    public class CallCentreServiceTests
    {
        private Mock<IVouchersService> _vouchersService;
        private Mock<IVouchersCustomerRepository> _customerRepository;
        private Mock<IBookingCreditService> _bookingCreditService;
        private Mock<IBookingRepository> _bookingRepository;
        private Mock<IBookingRefundEligibleService> _bookingRefundEligibleService;

        private readonly CallCentreService sut;

        private readonly IOptions<StatusesSettings> _statusesSettings;

        public CallCentreServiceTests()
        {
            var fixture = FixtureUtils.AutoMoqFixture();
            // Settings
            var commandsSettings = Options.Create(new CommandsSettings()
            {
                AddCreditCommand = "add credit",
                CancelAndCreditCommand = "cancel and credit",
                CancelAndRefundCommand = "cancel and refund",
                CancelCommand = "cancel",
                ModifyMemoCommand = "memo",
                RefundCommand = "refund"
            });

            var callCentreCommandsSettings = Options.Create(new CallCentreCommandsSettings()
            {
                GiveCreditCommand = "give credit"
            });

            var addCreditByEmailSettings = Options.Create(new AddCreditByEmailSettings()
            {
                AttemptsLimit = 1,
                DelayMls = 1
            });

            _statusesSettings = Options.Create(new StatusesSettings()
            {
                Booking = "BOOKING",
                Canceled = "CANCELLED",
                Lock = "LCOK",
                Option = "OPTION",
                Quote = "QUOTE"
            });
            var _cancelAndCreditSettings = fixture.Freeze<Mock<IOptions<CancelAndCreditSettings>>>();

            var apiSettings = Options.Create(new ApiSettings()
            {
                Vouchers = new VoucherSettings()
                {
                    BookingMemos = new BookingMemoSettings()
                    {
                        Cred = new MemoSettings()
                        {
                            Code = "CRED"
                        },
                        MovedToCredit = new MemoSettings()
                        {
                            Code = "REP3"
                        }
                    },
                    Metadata = new Dictionary<string, object> {
                        { "currency", "GBP"}
                    },
                    Source = new VoucherifySource
                    {
                        BulkTool = "Bulk Tool",
                        Web = "Web",
                        CallCentre = "Call Centre"
                    },
                    Action = new VoucherifyAction
                    {
                        Spend = "Spend",
                        CreditAndRefund = "Credit and refund",
                        UndoCredit = "Undo credit"
                    },

                }
            });
            fixture.Inject(apiSettings);

            var atcomSettings = new AtcomSettings()
            {
                PaymentCodes = new Dictionary<string, PaymentCodesSettings>
                {
                    {
                        "PromotionStaffCredit",
                        new PaymentCodesSettings
                        {
                            Reason = "Promotion - Staff Credit",
                            Issued = new PaymentTypeSettings{ Code = "PSTI"},
                            Redeemed = new PaymentTypeSettings { Code = "PSTR"}
                        }
                    }
                }
            };

            fixture.Inject(atcomSettings);

            var apiSettingsService = new ApiSettingsService(Options.Create(atcomSettings), fixture.Freeze<Mock<ILogger<ApiSettingsService>>>().Object);
            fixture.Inject<IApiSettingsService>(apiSettingsService);

            var _bookingCodesSettings = fixture.Freeze<Mock<IOptions<BookingCodesSettings>>>();
            _bookingCodesSettings.Object.Value.BookingNotFound = "E1114";
            _bookingCodesSettings.Object.Value.BookingAlreadyCanceled = "E1382";

            var _messagesSettings = fixture.Freeze<Mock<IOptions<MessagesSettings>>>();
            _messagesSettings.Object.Value.BookingAlreadyCanceled = "Booking already cancelled";
            _messagesSettings.Object.Value.FailedToCancel = "Failed to cancel";

            var bulkToolSettings = Options.Create(new BulkToolSettings
            {
                AddCreditByEmail = addCreditByEmailSettings.Value,
                BookingCodes = _bookingCodesSettings.Object.Value,
                CancelAndCredit = _cancelAndCreditSettings.Object.Value,
                Commands = commandsSettings.Value,
                Messages = _messagesSettings.Object.Value,
                Statuses = _statusesSettings.Value,
                SupportedCommandsForExternalAgency = ["cancel", "memo"],
            });

            fixture.Inject(bulkToolSettings);

            var callCentreSettings = Options.Create(new CallCentreSettings
            {
                Commands = callCentreCommandsSettings.Value
            });

            fixture.Inject(callCentreSettings);

            _bookingRepository = fixture.Freeze<Mock<IBookingRepository>>();
            _vouchersService = fixture.Freeze<Mock<IVouchersService>>();
            _customerRepository = fixture.Freeze<Mock<IVouchersCustomerRepository>>();
            _bookingCreditService = fixture.Freeze<Mock<IBookingCreditService>>();
            _bookingRefundEligibleService = fixture.Freeze<Mock<IBookingRefundEligibleService>>();

            sut = fixture.Freeze<CallCentreService>();
        }

        [Fact]
        public async Task GetUserCredits_Success()
        {
            // Arrange
            var ctor = typeof(CustomerList).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic)[0];
            var customersList = (CustomerList)ctor.Invoke([]);
            customersList.SetPrivateProperty("Customers", new List<Customer>() { new Customer() {
            Email = "test@test.com",
            SourceId = "Id",
            } });

            _customerRepository.Setup(x => x.GetCustomersByEmail("test@test.com", It.IsAny<int>())).ReturnsAsync(customersList);
            _vouchersService.Setup(x => x.MyCredits("Id", false)).ReturnsAsync(new Dictionary<Currency, MyCreditInfo>()
            {
                {
                    Currency.GBP,
                    new MyCreditInfo
                    {
                        Balance = 10,
                        HasCreditHistory = true,
                        Currency = Currency.GBP.Code
                    }
                }
            });

            // Act
            var actual = await sut.GetCredit("test@test.com", "GBP");

            // Assert
            actual.Balance.Should().Be(10);
        }

        [Fact]
        public async Task GetUserCredits_Success_customerId()
        {
            // Arrange
            var ctor = typeof(CustomerList).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic)[0];
            var customersList = (CustomerList)ctor.Invoke([]);
            customersList.SetPrivateProperty("Customers", new List<Customer>() { new Customer() {
            Email = "test@test.com",
            SourceId = "Id",
            } });

            _customerRepository.Setup(x => x.GetCustomersByEmail("test@test.com", It.IsAny<int>())).ReturnsAsync(customersList);
            _vouchersService.Setup(x => x.MyCredits("Id", false)).ReturnsAsync(new Dictionary<Currency, MyCreditInfo>()
            {
                {
                    Currency.GBP,
                    new MyCreditInfo
                    {
                        Balance = 10,
                        HasCreditHistory = true,
                        Currency = Currency.GBP.Code
                    }
                }
            });

            // Act
            var actual = await sut.GetCredit("test@test.com", "GBP", "Id");

            _customerRepository.Verify(x => x.GetCustomersByEmail("test@test.com", It.IsAny<int>()), Times.Never);

            // Assert
            actual.Balance.Should().Be(10);
        }

        [Fact]
        public async Task AddCredit_Succeess_Existing_Customer()
        {
            // Arrange
            var ctor = typeof(CustomerList).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic)[0];
            var customersList = (CustomerList)ctor.Invoke([]);
            customersList.SetPrivateProperty("Customers", new List<Customer>() {
                new Customer() {
                    Email = "test@test.com",
                    SourceId = "Id",
                }
            });

            _customerRepository.Setup(x => x.GetCustomersByEmail("test@test.com", It.IsAny<int>())).ReturnsAsync(customersList);

            _vouchersService.Setup(x => x.CreateAndPublishVoucher(It.IsAny<string>(), 10, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, object>>(), "refund", null)).ReturnsAsync("voucher");
            _vouchersService.Setup(x => x.MyCredits("Id", true)).ReturnsAsync(new Dictionary<Currency, MyCreditInfo>()
            {
                {
                    Currency.GBP,
                    new MyCreditInfo
                    {
                        Balance = 10,
                        HasCreditHistory = true,
                        Currency = Currency.GBP.Code
                    }
                }
            });

            // Act
            var actual = await sut.AddCredit(new AddCreditsRequest()
            {
                Amount = 10,
                Currency = "GBP",
                EmailAddress = "test@test.com",
                Reason = "refund"
            });

            _customerRepository.Verify(x => x.GetOrCreate(null, It.IsAny<CustomerDetails>()), Times.Never);

            // Assert
            actual.Balance.Should().Be(10);
        }

        [Fact]
        public async Task AddCredit_WithExpiredDate_Success()
        {
            // Arrange
            var ctor = typeof(CustomerList).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic)[0];
            var customersList = (CustomerList)ctor.Invoke([]);
            customersList.SetPrivateProperty("Customers", new List<Customer>() {
                new Customer() {
                    Email = "test@test.com",
                    SourceId = "Id",
                }
            });

            _customerRepository.Setup(x => x.GetCustomersByEmail("test@test.com", It.IsAny<int>())).ReturnsAsync(customersList);

            _vouchersService.Setup(x => x.CreateAndPublishVoucher(It.IsAny<string>(), 10, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, object>>(), "refund", It.IsAny<DateTimeOffset>())).ReturnsAsync("voucher");
            _vouchersService.Setup(x => x.MyCredits("Id", true)).ReturnsAsync(new Dictionary<Currency, MyCreditInfo>()
            {
                {
                    Currency.GBP,
                    new MyCreditInfo
                    {
                        Balance = 10,
                        HasCreditHistory = true,
                        Currency = Currency.GBP.Code
                    }
                }
            });

            // Act
            var actual = await sut.AddCredit(new AddCreditsRequest()
            {
                Amount = 10,
                EmailAddress = "test@test.com",
                Reason = "refund",
                Currency = Currency.GBP.Code
            });

            _customerRepository.Verify(x => x.GetOrCreate(null, It.IsAny<CustomerDetails>()), Times.Never);

            // Assert
            actual.Balance.Should().Be(10);
        }

        [Fact]
        public async Task AddCredit_Success_New_Customer()
        {
            // Arrange
            var customer = new Customer()
            {
                Email = "test@test.com",
                SourceId = "Id",
            };

            _customerRepository.Setup(x => x.GetCustomersByEmail("test@test.com", It.IsAny<int>())).ReturnsAsync(default(CustomerList));
            _customerRepository.Setup(x => x.GetOrCreate(null, It.IsAny<CustomerDetails>())).ReturnsAsync(customer);

            _vouchersService.Setup(x => x.CreateAndPublishVoucher(It.IsAny<string>(), 10, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, object>>(), "refund", null)).ReturnsAsync("voucher");
            _vouchersService.Setup(x => x.MyCredits("Id", true)).ReturnsAsync(new Dictionary<Currency, MyCreditInfo>()
            {
                {
                    Currency.GBP,
                    new MyCreditInfo
                    {
                        Balance = 10,
                        HasCreditHistory = true,
                        Currency = Currency.GBP.Code
                    }
                }
            });

            // Act
            var actual = await sut.AddCredit(new AddCreditsRequest()
            {
                Amount = 10,
                Currency = "GBP",
                EmailAddress = "test@test.com",
                Reason = "refund"
            });

            // Assert
            actual.Balance.Should().Be(10);
        }

        [Fact]
        public async Task Spend_Credits_No_Customer()
        {
            // Arrange
            _bookingRepository.Setup(x => x.GetBooking(It.IsAny<GetBookingRequest>())).ReturnsAsync(new BookingResponse()
            {
                Currency = Currency.GBP,
                LeadPassenger = new ()
                {
                    Email = "test@test.com"
                }
            });
            _customerRepository.Setup(x => x.GetCustomersByEmail("test@test.com", It.IsAny<int>())).ReturnsAsync(default(CustomerList));

            // Act
            ApiException e = null;
            try
            {
                _ = await sut.SpendCredit(new SpendCreditRequest()
                {
                    Amount = 10,
                    BookingRef = "12345",
                    Date = DateTime.Parse("2041-10-10"),
                    LastName = "Test",
                    Currency = Currency.GBP.Code
                });
            }
            catch (ApiException ex)
            {
                e = ex;
            }

            // Assert
            e.Should().NotBeNull();
            e!.Code.Should().BeEquivalentTo(ApiExceptionCodes.CallCentreUserNotFound);
        }

        [Fact]
        public async Task Spend_Credits_Invalid_Booking()
        {
            // Arrange
            _bookingRepository.Setup(x => x.GetBooking(It.IsAny<GetBookingRequest>())).ReturnsAsync(new BookingResponse()
            {
                LeadPassenger = new()
                {
                    Email = "test@test.com"
                }
            });
            _bookingRepository.Setup(x => x.GetBookingMemo(It.IsAny<string>())).ReturnsAsync([
                new Memo() { Code = _statusesSettings.Value.Lock }
            ]);

            // Act
            ApiException e = null;
            try
            {
                _ = await sut.SpendCredit(new SpendCreditRequest()
                {
                    Amount = 10,
                    BookingRef = "12345",
                    Date = DateTime.Parse("2041-10-10"),
                    LastName = "Test"
                });
            }
            catch (ApiException ex)
            {
                e = ex;
            }

            // Assert
            e.Should().NotBeNull();
            e!.Code.Should().BeEquivalentTo(ApiExceptionCodes.BookingLockedError);
        }

        [Fact]
        public async Task Spend_Credits_NoCredits()
        {
            // Arrange
            _bookingRepository.Setup(x => x.GetBooking(It.IsAny<GetBookingRequest>())).ReturnsAsync(new BookingResponse()
            {
                Currency = Currency.GBP,
                LeadPassenger = new()
                {
                    Email = "test@test.com"
                }
            });

            var ctor = typeof(CustomerList).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic)[0];
            var customersList = (CustomerList)ctor.Invoke([]);
            customersList.SetPrivateProperty("Customers", new List<Customer>() { new Customer() {
            Email = "test@test.com",
            SourceId = "Id",
            } });
            _customerRepository.Setup(x => x.GetCustomersByEmail("test@test.com", It.IsAny<int>())).ReturnsAsync(customersList);

            _vouchersService.Setup(x => x.MyCredits("Id", false)).ReturnsAsync(new Dictionary<Currency, MyCreditInfo>());

            // Act
            var exception = await Assert.ThrowsAsync<ApiException>(() => sut.SpendCredit(new SpendCreditRequest()
            {
                Amount = 30,
                BookingRef = "12345",
                Date = DateTime.Parse("2041-10-10"),
                LastName = "Test",
                Currency = Currency.GBP.Code
            }));

            // Assert
            exception.Code.Should().Be(ApiExceptionCodes.CallCentreNotEnoughCredits);
        }

        [Fact]
        public async Task Spend_Credits_NotEnoughCredits()
        {
            // Arrange
            _bookingRepository.Setup(x => x.GetBooking(It.IsAny<GetBookingRequest>())).ReturnsAsync(new BookingResponse()
            {
                Currency = Currency.GBP,
                LeadPassenger = new()
                {
                    Email = "test@test.com"
                }
            });

            var ctor = typeof(CustomerList).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic)[0];
            var customersList = (CustomerList)ctor.Invoke([]);
            customersList.SetPrivateProperty("Customers", new List<Customer>() { new Customer() {
            Email = "test@test.com",
            SourceId = "Id",
            } });
            _customerRepository.Setup(x => x.GetCustomersByEmail("test@test.com", It.IsAny<int>())).ReturnsAsync(customersList);

            _vouchersService.Setup(x => x.MyCredits("Id", false)).ReturnsAsync(new Dictionary<Currency, MyCreditInfo>()
            {
                {
                    Currency.GBP,
                    new MyCreditInfo
                    {
                        Balance = 20,
                        HasCreditHistory = true,
                        Currency = Currency.GBP.Code
                    }
                }
            });

            // Act
            var exception = await Assert.ThrowsAsync<ApiException>(() => sut.SpendCredit(new SpendCreditRequest()
            {
                Amount = 30,
                BookingRef = "12345",
                Date = DateTime.Parse("2041-10-10"),
                LastName = "Test",
                Currency = Currency.GBP.Code
            }));

            // Assert
            exception.Code.Should().Be(ApiExceptionCodes.CallCentreNotEnoughCredits);
        }

        [Fact]
        public async Task Spend_Credits_CurrencyNotMatching()
        {
            // Arrange
            _bookingRepository.Setup(x => x.GetBooking(It.IsAny<GetBookingRequest>())).ReturnsAsync(new BookingResponse()
            {
                Currency = Currency.CHF
            });

            // Act
            var exception = await Assert.ThrowsAsync<ApiException>(() => sut.SpendCredit(new SpendCreditRequest()
            {
                Amount = 10,
                BookingRef = "12345",
                Date = DateTime.Parse("2041-10-10"),
                LastName = "Test",
                Currency = Currency.GBP.Code
            }));

            // Assert
            exception.Code.Should().Be(ApiExceptionCodes.CallCentreCurrencyNotMatching);
        }

        [Fact]
        public async Task Spend_Credits_Success()
        {
            // Arrange
            _bookingRepository.Setup(x => x.GetBooking(It.IsAny<GetBookingRequest>())).ReturnsAsync(new BookingResponse()
            {
                Currency = Currency.GBP,
                LeadPassenger = new()
                {
                    Email = "test@test.com"
                }
            });

            var ctor = typeof(CustomerList).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic)[0];
            var customersList = (CustomerList)ctor.Invoke([]);
            customersList.SetPrivateProperty("Customers", new List<Customer>() { new Customer() {
            Email = "test@test.com",
            SourceId = "Id",
            } });
            _customerRepository.Setup(x => x.GetCustomersByEmail("test@test.com", It.IsAny<int>())).ReturnsAsync(customersList);

            _vouchersService.Setup(x => x.MyCredits("Id", false)).ReturnsAsync(new Dictionary<Currency, MyCreditInfo>()
            {
                {
                    Currency.GBP,
                    new MyCreditInfo
                    {
                        Balance = 20,
                        HasCreditHistory = true,
                        Currency = Currency.GBP.Code
                    }
                }
            });
            _vouchersService.Setup(x => x.MyCredits("Id", true)).ReturnsAsync(new Dictionary<Currency, MyCreditInfo>()
            {
                {
                    Currency.GBP,
                    new MyCreditInfo
                    {
                        Balance = 10,
                        HasCreditHistory = true,
                        Currency = Currency.GBP.Code
                    }
                }
            });

            // Act
            var actual = await sut.SpendCredit(new SpendCreditRequest()
            {
                Amount = 10,
                BookingRef = "12345",
                Date = DateTime.Parse("2041-10-10"),
                LastName = "Test",
                Currency = Currency.GBP.Code
            });

            // Assert
            actual.Balance.Should().Be(10);
        }

        [Fact]
        public async Task Convert_Booking()
        {
            // Arrange
            var request = new CreditBookingRequest()
            {
                BookingRef = "123456",
                Date = DateTime.Parse("2040-10-10"),
                LastName = "LastName"
            };

            _bookingRepository.Setup(x => x.GetBooking(It.IsAny<GetBookingRequest>())).ReturnsAsync(new BookingResponse()
            {
                LeadPassenger = new()
                {
                    Email = "test@test.com"
                }
            });
            var customer = new Customer()
            {
                Email = "test@test.com",
                SourceId = "Id"
            };
            _customerRepository.Setup(x => x.GetCustomersByEmail("test@test.com", It.IsAny<int>())).ReturnsAsync(default(CustomerList));
            _customerRepository.Setup(x => x.GetOrCreate(null, It.IsAny<CustomerDetails>())).ReturnsAsync(customer);
            _bookingCreditService.Setup(x => x.RefundBooking(It.IsAny<ConvertBookingToCreditRequest>(), "Id", It.IsAny<CustomerDetails>())).ReturnsAsync(new Domain.Data.Vouchers.BookingRefundResponse()
            {
                Credit = new MyCreditInfo()
                {
                    Balance = 10,
                    HasCreditHistory = true,
                }
            });

            // Act
            var actual = await sut.CreditBooking(request);

            // Assert
            actual.Balance.Should().Be(10);
        }

        [Fact]
        public async Task Convert_Booking_Forbiden()
        {
            // Arrange
            var request = new CreditBookingRequest()
            {
                BookingRef = "123456",
                Date = DateTime.Parse("2040-10-10"),
                LastName = "LastName"
            };

            _bookingRepository.Setup(x => x.GetBooking(It.IsAny<GetBookingRequest>())).ReturnsAsync(new BookingResponse()
            {

                LeadPassenger = new()
                {
                    Email = "test@test.com"
                }
            });
            Customer customer = new Customer()
            {
                Email = "test@test.com",
                SourceId = "Id"
            };
            _customerRepository.Setup(x => x.GetCustomersByEmail("test@test.com", It.IsAny<int>())).ReturnsAsync(default(CustomerList));
            _customerRepository.Setup(x => x.GetOrCreate(null, It.IsAny<CustomerDetails>())).ReturnsAsync(customer);
            _bookingCreditService.Setup(x => x.RefundBooking(It.IsAny<ConvertBookingToCreditRequest>(), "Id", It.IsAny<CustomerDetails>())).ThrowsAsync(new ApiException(ApiExceptionCodes.BookingCreditForbidden));

            // Act
            ApiException ex = null;
            try
            {
                _ = await sut.CreditBooking(request);
            }
            catch (ApiException e)
            {
                ex = e;
            }
            // Assert
            ex!.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task PartialRefund_ReturnsVoucherIdAndReason_WhenEligibleForRefund()
        {
            // Arrange
            var paymentId = "98765";
            var lastname = "test";
            var request = new CallCentrePartialRefundRequest
            {
                BookingDate = new DateOnly(2023, 07, 07),
                BookingReference = "1234567",
                LeadPaxLastName = lastname,
                PaymentId = paymentId,
                RefundAmount = 12.34m
            };

            var paymentItem = new PaymentHistoryItem
            {
                Amount = 100m,
                PayId = paymentId,
                PayMethodCode = "PSTI"
            };

            var booking = new BookingResponse
            {
                Guests =
                [
                    new() { IsLead = true, FirstName = "unit", LastName = lastname, }
                ],
                LeadPassenger = new()
                {
                    Email = "unit.test@test.com"
                },
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = [paymentItem]
                }
            };

            _bookingRepository.Setup(x => x.GetBooking(It.Is<GetBookingRequest>(bookingRequest => bookingRequest.BookingReference == request.BookingReference)))
                .ReturnsAsync(booking);

            var eligible = new EligibleForRefund
            {
                Credit = new EligibleAction
                {
                    IsEligible = true,
                    Credit = request.RefundAmount,
                    CreditBreakdown = new CreditBreakdown
                    {
                        Promo = request.RefundAmount
                    }
                }
            };

            _bookingRefundEligibleService.Setup(x => x.IsEligibleForCallCentrePartialRefund(booking, paymentItem, It.IsAny<CustomerDetails>(), request.RefundAmount))
                .ReturnsAsync(eligible);

            var customer = new Customer
            {
                SourceId = "45678"
            };

            _customerRepository.Setup(x => x.GetOrCreate(null, It.IsAny<CustomerDetails>())).ReturnsAsync(customer);

            var createdVoucherId = "12345-promo";

            _vouchersService.Setup(x => x.AddCreditToBooking(customer.SourceId, eligible.Credit.CreditBreakdown, It.IsAny<string>(),
                It.Is<BookingResponse>(response => response.PaymentInfo.PaymentHistory.Single() == paymentItem), It.IsAny<Dictionary<string, object>>(), false))
                .ReturnsAsync([new CreatedVoucher { Code = createdVoucherId, Reason = "Promotion - Staff Credit" }]);

            // Act
            var res = await sut.PartialRefund(request);

            // Assert
            res.Reason.Should().BeEquivalentTo("Promotion - Staff Credit");
            res.VoucherId.Should().BeEquivalentTo(createdVoucherId);
        }

        [Fact]
        public async Task PartialRefund_ThrowsException_WhenPaymentNotFound()
        {
            // Arrange
            var request = new CallCentrePartialRefundRequest
            {
                BookingDate = new DateOnly(2023, 07, 07),
                BookingReference = "1234567",
                LeadPaxLastName = "test",
                PaymentId = "456",
                RefundAmount = 12.34m
            };

            var paymentItem = new PaymentHistoryItem
            {
                Amount = 100m,
                PayId = "123",
                PayMethodCode = "PSTI"
            };

            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = [paymentItem]
                }
            };

            _bookingRepository.Setup(x => x.GetBooking(It.Is<GetBookingRequest>(bookingRequest => bookingRequest.BookingReference == request.BookingReference)))
                .ReturnsAsync(booking);

            // Act & Assert
            var lambda = () => sut.PartialRefund(request);
            await lambda.Should().ThrowAsync<ApiException>()
                 .Where(x => x.Code.Equals(ApiExceptionCodes.RefundError))
                .WithMessage("*payment doesn't exist*");
        }

        [Fact]
        public async Task PartialRefund_ThrowsException_WhenPaymentIsCashRefund()
        {
            // Arrange
            var paymentId = "98765";
            var request = new CallCentrePartialRefundRequest
            {
                BookingDate = new DateOnly(2023, 07, 07),
                BookingReference = "1234567",
                LeadPaxLastName = "test",
                PaymentId = paymentId,
                RefundAmount = 12.34m
            };

            var paymentItem = new PaymentHistoryItem
            {
                Amount = 100m,
                PayId = paymentId,
                RefundAgainstId = "12345"
            };

            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = [paymentItem]
                }
            };

            _bookingRepository.Setup(x => x.GetBooking(It.Is<GetBookingRequest>(bookingRequest => bookingRequest.BookingReference == request.BookingReference)))
                .ReturnsAsync(booking);

            // Act & Assert
            var lambda = () => sut.PartialRefund(request);
            await lambda.Should().ThrowAsync<ApiException>()
                .Where(x => x.Code.Equals(ApiExceptionCodes.RefundError))
                .WithMessage("*refund of a previous payment*");
        }

        [Fact]
        public async Task PartialRefund_ThrowsException_WhenNotEligibleForRefund()
        {
            var paymentId = "98765";
            var lastname = "test";
            var request = new CallCentrePartialRefundRequest
            {
                BookingDate = new DateOnly(2023, 07, 07),
                BookingReference = "1234567",
                LeadPaxLastName = lastname,
                PaymentId = paymentId,
                RefundAmount = 12.34m
            };

            var paymentItem = new PaymentHistoryItem
            {
                Amount = 100m,
                PayId = paymentId,
                PayMethodCode = "PSTI"
            };

            var booking = new BookingResponse
            {
                Guests =
                [
                    new() { IsLead = true, FirstName = "unit", LastName = lastname, }
                ],
                LeadPassenger = new()
                {
                    Email = "unit.test@test.com"
                },
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = [paymentItem]
                }
            };

            _bookingRepository.Setup(x => x.GetBooking(It.Is<GetBookingRequest>(bookingRequest => bookingRequest.BookingReference == request.BookingReference)))
                .ReturnsAsync(booking);

            var eligible = new EligibleForRefund
            {
                Credit = new EligibleAction
                {
                    IsEligible = false
                }
            };

            _bookingRefundEligibleService.Setup(x => x.IsEligibleForCallCentrePartialRefund(booking, paymentItem, It.IsAny<CustomerDetails>(), request.RefundAmount))
                .ReturnsAsync(eligible);

            // Act & Assert
            var lambda = () => sut.PartialRefund(request);
            await lambda.Should().ThrowAsync<ApiException>()
                .Where(x => x.Code.Equals(ApiExceptionCodes.RefundError))
                .WithMessage("*Not eligible*");
        }
    }
}

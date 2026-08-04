#nullable enable
using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Services.BulkTool;
using easyJet.Holidays.Api.Domain.Services.BulkTool.Commands;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Collections.Generic;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.BulkTool.BulkToolBookingService
{
    public partial class BulkToolBookingServiceTests
    {
        protected readonly Mock<IBookingRepository> _bookingRepository;
        protected readonly Mock<IBookingPaymentsRepository> _bookingPaymentsRepository;
        protected readonly Mock<IVouchersCustomerRepository> _customersRepository;
        protected readonly Mock<IBookingCreditService> _bookingCreditService;

        protected readonly Mock<IBookingRefundService> _bookingPaymentsService;
        protected readonly Mock<IVouchersService> _vouchersService;
        protected readonly Mock<IVoucherPaymentFlowService> _voucherPaymentService;

        protected readonly BulkToolSettings _bulkToolSettings;
        protected readonly CommandsSettings _commandsSettings;
        protected readonly Mock<IOptions<BookingCodesSettings>> _bookingCodesSettings;
        protected readonly IOptions<StatusesSettings> _statusesSettings;
        protected readonly Mock<IOptions<MessagesSettings>> _messagesSettings;
        protected readonly Mock<IOptions<CancelAndCreditSettings>> _cancelAndCreditSettings;

        protected readonly Mock<ILogger<Domain.Services.BulkTool.BulkToolBookingService>> _logger;

        protected readonly Domain.Services.BulkTool.BulkToolBookingService bulkToolBookingService;
        protected readonly IFixture _fixture;

        public BulkToolBookingServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            // Settings
            var commandsSettings = Options.Create(new CommandsSettings()
            {
                AddCreditCommand = "add credit",
                CancelAndCreditCommand = "cancel and credit",
                CancelAndRefundCommand = "cancel and refund",
                CancelCommand = "cancel",
                ModifyMemoCommand = "memo",
                RefundCommand = "refund",
                SpendCreditCommand = "spend credit"
            });

            var addCreditByEmailSettings = Options.Create(new AddCreditByEmailSettings()
            {
                AttemptsLimit = 1,
                DelayMls = 1
            });

            _statusesSettings = Options.Create(new StatusesSettings()
            {
                Booking = "BOOKING",
                Canceled = "CANCELED",
                Lock = "LOCK",
                Option = "OPTION",
                Quote = "QUOTE"
            });
            _cancelAndCreditSettings = _fixture.Freeze<Mock<IOptions<CancelAndCreditSettings>>>();

            _bookingCodesSettings = _fixture.Freeze<Mock<IOptions<BookingCodesSettings>>>();
            _bookingCodesSettings.Object.Value.BookingNotFound = "E1114";
            _bookingCodesSettings.Object.Value.BookingAlreadyCanceled = "E1382";

            _messagesSettings = _fixture.Freeze<Mock<IOptions<MessagesSettings>>>();
            _messagesSettings.Object.Value.BookingAlreadyCanceled = "Booking already cancelled";
            _messagesSettings.Object.Value.FailedToCancel = "Failed to cancel";
            _messagesSettings.Object.Value.ReasonToCancel = "Bulk cancellation";
            _messagesSettings.Object.Value.SuccessfullyCancelled = "Successfully Cancelled";
            _messagesSettings.Object.Value.MemoAdded = "Memo added";

            var bulkToolSettings = Options.Create(new BulkToolSettings
            {
                AddCreditByEmail = addCreditByEmailSettings.Value,
                BookingCodes = _bookingCodesSettings.Object.Value,
                CancelAndCredit = _cancelAndCreditSettings.Object.Value,
                Commands = commandsSettings.Value,
                Messages = _messagesSettings.Object.Value,
                Statuses = _statusesSettings.Value,
                SupportedCommandsForExternalAgency = new[] { "cancel", "memo" },
            });

            _bulkToolSettings = bulkToolSettings.Value;
            _commandsSettings = commandsSettings.Value;

            _fixture.Inject(bulkToolSettings);

            _bookingRepository = _fixture.Freeze<Mock<IBookingRepository>>();
            _bookingPaymentsRepository = _fixture.Freeze<Mock<IBookingPaymentsRepository>>();
            _customersRepository = _fixture.Freeze<Mock<IVouchersCustomerRepository>>();
            _bookingCreditService = _fixture.Freeze<Mock<IBookingCreditService>>();
            _bookingPaymentsService = _fixture.Freeze<Mock<IBookingRefundService>>();
            _voucherPaymentService = _fixture.Freeze<Mock<IVoucherPaymentFlowService>>();
            _logger = _fixture.Freeze<Mock<ILogger<Domain.Services.BulkTool.BulkToolBookingService>>>();

            _vouchersService = _fixture.Freeze<Mock<IVouchersService>>();
            _vouchersService.Setup(x => x.IsReasonCodeValid(It.IsAny<string>())).Returns(true);

            var apiSettings = _fixture.Freeze<Mock<IOptions<ApiSettings>>>();
            apiSettings.Object.Value.Vouchers = Options.Create(new VoucherSettings()
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
                    CallCentre = "Call Centre",
                    Web = "Web"
                },
                Action = new VoucherifyAction
                {
                    Spend = "Spend",
                    CreditAndRefund = "Credit and refund",
                    UndoCredit = "Undo credit"

                },
                Types = new VoucherTypeSettings
                {
                    Refund = "refund",
                    Incentive = "incentive",
                    Goodwill = "goodwill"
                },
            }).Value;
            _fixture.Inject(Options.Create(new AtcomSettings
            {
                PaymentCodes = new Dictionary<string, PaymentCodesSettings>{
                {
                    "refund",
                    new PaymentCodesSettings
                    {
                        Issued =  new PaymentTypeSettings {Code = "CI", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "CR", Group = "CA"}
                    }
                }, {
                    "goodwill",
                    new PaymentCodesSettings
                    {
                        Issued =  new PaymentTypeSettings {Code = "GI", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "GR", Group = "CA"}
                    }
                }, {
                    "incentive",
                    new PaymentCodesSettings
                    {
                        Issued =  new PaymentTypeSettings {Code = "II", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "IR", Group = "CA"}
                    }
                }, {
                    "giftcard",
                    new PaymentCodesSettings
                    {
                        Issued =  new PaymentTypeSettings {Code = "GI", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "GR", Group = "CA"}
                    }
                }}
            }));


            bulkToolBookingService = new Domain.Services.BulkTool.BulkToolBookingService(
                _bookingRepository.Object,
                bulkToolSettings,
                _logger.Object,
                _fixture.Create<BulkToolActions>(),
                _fixture.Create<UndoCreditCommand>(),
                _fixture.Create<CancelAndCreditCommand>(),
                _fixture.Freeze<AddCreditCommand>(),
                _fixture.Create<ModifyMemoCommand>(),
                _fixture.Create<SpendCreditCommand>(),
                _fixture.Create<TransferCreditCommand>()
            );
        }

        [Fact]
        public async Task BulkToolBookingService_ShouldReturnNull_IfRequestIsNull()
        {
            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(null, string.Empty);

            // Assert
            act.Should().BeNull();
        }

        [Theory]
        [InlineData("command1")]
        [InlineData("refund1")]
        [InlineData("!Bulk_tool")]
        [InlineData("cancil")]
        [InlineData("cancel & refund")]
        public async Task BulkToolBookingService_ShouldReturnCommandNotSupport_IfCommandIsInvalid(string command)
        {
            // Arrange
            var request = new BulkToolRequest { Booking = new() { Flag = command, Reference = "1010001" } };

            var booking = new BookingResponse();

            _bookingRepository.Setup(x => x.GetBookingUnsafe(It.IsAny<string>(), It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            // Actual
            var actual = await bulkToolBookingService.RunBulkProcess(request, string.Empty);

            // Assert
            actual.Message.Should().Be($"Error. Flag {command} is not supported");
        }

        [Theory]
        [InlineData("dvsdvsjn", "failed message")]
        [InlineData("_1231+", "failed message")]
        [InlineData("124 1241", "failed message")]
        [InlineData("111111 1 ", "failed message")]
        public async Task BulkToolBookingService_ShouldReturnExceptionResponse_IfReferenceIsInvalid(string reference, string message)
        {
            // Arrange
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.CancelCommand,
                    Reference = reference
                }
            };
            request.Booking.Flag = _commandsSettings.CancelCommand;
            _messagesSettings.Object.Value.BookingNotFound = message;

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.Message.Should().Be(message);
        }

        [Theory]
        [InlineData("100001", "cancel and credit", "OPTION")]
        [InlineData("100001", "cancel and refund", "OPTION")]
        [InlineData("100002", "cancel", "OPTION")]
        [InlineData("100003", "refund", "OPTION")]
        [InlineData("100004", "memo", "OPTION")]
        [InlineData("100005", "cancel and credit", "QUOTE")]
        [InlineData("100005", "cancel and refund", "QUOTE")]
        [InlineData("100006", "cancel", "QUOTE")]
        [InlineData("100007", "refund", "QUOTE")]
        [InlineData("100008", "memo", "QUOTE")]
        public async Task BulkToolBookingService_ShouldCatchException_IfBookingInIgnoredStatus(string reference, string flag, string bookingStatus)
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new ()
                {
                    Flag = flag,
                    Reference = reference
                }
            };

            var booking = new BookingResponse()
            {
                BookingStatus = bookingStatus,
                BookingReference = reference
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be($"Booking in {booking.BookingStatus} status can't be processed");
        }

        [Theory]
        [InlineData("100001", "cancel and credit", "booking")]
        [InlineData("100002", "cancel and refund", "booking")]
        [InlineData("100003", "cancel", "booking")]
        [InlineData("100004", "refund", "booking")]
        [InlineData("100005", "memo", "booking")]
        public async Task BulkToolBookingService_ShouldThrowException_IfBookingInLockStatus(string reference, string flag, string bookingStatus)
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = flag,
                    Reference = reference
                }
            };

            var booking = new BookingResponse()
            {
                BookingStatus = bookingStatus,
                BookingReference = reference
            };

            var bookingMemo = new List<Memo>()
            {
                new Memo()
                {
                    Code = _statusesSettings.Value.Lock
                }
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);
            _bookingRepository.Setup(x => x.GetBookingMemo(reference)).ReturnsAsync(bookingMemo);

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be("Locked booking. Skipped");
        }

        [Theory]
        [InlineData("100001", "cancel and credit", "booking")]
        [InlineData("100002", "cancel and refund", "booking")]
        [InlineData("100004", "refund", "booking")]
        public async Task BulkToolBookingService_ShouldThrowException_IfNotSupportedCommandForTradeBooking(string reference, string flag, string bookingStatus)
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new ()
                {
                    Flag = flag,
                    Reference = reference
                }
            };

            var booking = new BookingResponse()
            {
                BookingStatus = bookingStatus,
                BookingReference = reference,
                IsExternalAgency = true
            };

            var bookingMemo = new List<Memo>() { new Memo() };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);
            _bookingRepository.Setup(x => x.GetBookingMemo(reference)).ReturnsAsync(bookingMemo);

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be($"Unsupported command for external agency booking: {flag}");
        }

        [Theory]
        [InlineData("100003", "cancel", "booking")]
        public async Task BulkToolBookingService_ShouldProcessCancel_IfTradeBooking(string reference, string flag, string bookingStatus)
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = flag,
                    Reference = reference,
                    MemoCode = "MemoCode",
                    MemoDescription = "MemoDescription"
                }
            };

            var booking = new BookingResponse()
            {
                BookingStatus = bookingStatus,
                BookingReference = reference,
                IsExternalAgency = true
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            _bookingRepository
                .Setup(repository =>
                    repository.CancelBooking(reference, _messagesSettings.Object.Value.ReasonToCancel, true, It.IsAny<IList<string>>()))
                .ReturnsAsync(new BookingResponse());

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            _bookingRepository.Verify(repository => repository.CancelBooking(reference, _messagesSettings.Object.Value.ReasonToCancel, true, It.IsAny<IList<string>>()), Times.Exactly(1));
            act.CorrelationId.Should().BeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be(_messagesSettings.Object.Value.SuccessfullyCancelled);
        }

        [Theory]
        [InlineData("100005", "memo", "booking")]
        public async Task BulkToolBookingService_ShouldProcessModifyMemo_IfTradeBooking(string reference, string flag, string bookingStatus)
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = flag,
                    Reference = reference,
                    MemoCode = "MemoCode",
                    MemoDescription = "MemoDescription"
                }
            };

            var booking = new BookingResponse()
            {
                BookingStatus = bookingStatus,
                BookingReference = reference,
                IsExternalAgency = true
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            _bookingRepository.Verify(repository => repository.ModifyMemo(reference, It.IsAny<BookingMemo>()), Times.Exactly(1));
            act.CorrelationId.Should().BeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be(_messagesSettings.Object.Value.MemoAdded);
        }
    }
}

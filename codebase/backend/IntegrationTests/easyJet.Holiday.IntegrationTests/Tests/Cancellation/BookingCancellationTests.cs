using Allure.Xunit.Attributes;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using FluentAssertions;
using FluentAssertions.Execution;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using Xunit.Abstractions;
using BookingCancellationSummaryRequest =
    easyJet.Holiday.IntegrationTests.Shared.Models.Booking.BookingCancellationSummaryRequest;
using BookingCancellationWithFeeOverrideRequest =
    easyJet.Holiday.IntegrationTests.Shared.Models.Booking.BookingCancellationWithFeeOverrideRequest;

namespace easyJet.Holiday.IntegrationTests.Tests.Cancellation
{
    [ExcludeFromCodeCoverage]
    [AllureSuite("Booking Cancellation Tests")]
    [AllureSubSuite("Booking Cancellation")]
    [AllureOwner("SER team")]
    public class BookingCancellationTests(
#pragma warning disable xUnit1041
        IHttpClientFactory httpClientFactory,
        TestApiHttpClient testApiHttpClient,
#pragma warning restore xUnit1041
        ITestOutputHelper testOutputHelper)
        : BaseTest(httpClientFactory, testApiHttpClient, testOutputHelper)
    {
        private const string Language = "en";
        private const string Currency = "GBP";

        [Fact(DisplayName = "Customer led summary. Atcom fee as one time credit")]
        public async Task CustomerLedCancellationSummary_WhenOver60days_ShouldReturnFeeAsOneTimeCredit()
        {
            var booking =
                await RepeatDecorator<CreateBookingResponse?>
                    .Create()
                    .RepeatTimes(5)
                    .Execute(async () =>
                    {
                        var bookingContext = await CreateBookingStep(
                            new CreateBookingRequest
                            {
                                Language = Language,
                                BookingCreationParams = new BookingCreationParams()
                                {
                                    StartDate = DateTime.Now.AddDays(61)
                                        .ToString("yyyy-MM-dd", CultureInfo.CurrentCulture),
                                    Duration = 7
                                }
                            });
                        return bookingContext.Content;
                    });

            booking.Should().NotBeNull("Booking not created");

            var cancellationSummary = await RepeatDecorator<BookingCancellationSummaryResponse?>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    var request = new BookingCancellationSummaryRequest()
                    {
                        BookingReference = booking!.BookingResponse.BookingReference,
                        Date = booking.BookingResponse.Package.Transport.Routes
                            .First(r => r.Direction == Direction.Outbound).DepDate!.Value.Date,
                        LastName = booking.BookingResponse.Guests.First().LastName,
                        CustomerCredentials = booking.CustomerCredentials
                    };
                    var cancelBookingContext = await GetCustomerLedSummaryStep(request);

                    return cancelBookingContext.Content;
                });

            using (new AssertionScope())
            {
                cancellationSummary.Should().NotBeNull();
                cancellationSummary!.Currency.Should().Be(Currency);
                cancellationSummary.Refunds.Count.Should().Be(2);
            }
        }

        [Theory(DisplayName = "Cancel booking Customer led with override fee. Fee as one time credit")]
        [InlineData(120, 2)]
        [InlineData(240, 4)]
        public async Task
            CancelBookingCustomerLedOverrideFee_WhenOver60daysAndOnlyDepositWasPaid_ShouldReturnFeeAsOneTimeCredit(
                int fee,
                int adultsNumber)
        {
            var booking =
                await RepeatDecorator<CreateBookingResponse?>
                    .Create()
                    .RepeatTimes(5)
                    .Execute(async () =>
                    {
                        var bookingContext = await CreateBookingStep(
                            new CreateBookingRequest
                            {
                                Language = Language,
                                BookingCreationParams = new BookingCreationParams()
                                {
                                    StartDate = DateTime.Now.AddDays(61)
                                        .ToString("yyyy-MM-dd", CultureInfo.CurrentCulture),
                                    Duration = 7,
                                    AdultsNumber = adultsNumber
                                },
                                Payment = new Payment()
                                {
                                    PaymentOption = PaymentOption.CARD,
                                    PaymentCompletion = PaymentCompletion.DEPOSIT
                                }
                            });
                        return bookingContext.Content;
                    });
            booking.Should().NotBeNull("Booking not created");

            var cancellationSummary = await RepeatDecorator<BookingCancellationSummaryResponse?>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    var request = new BookingCancellationSummaryRequest()
                    {
                        BookingReference = booking!.BookingResponse.BookingReference,
                        Date = booking.BookingResponse.Package.Transport.Routes
                            .First(r => r.Direction == Direction.Outbound).DepDate!.Value.Date,
                        LastName = booking.BookingResponse.Guests.First().LastName,
                        CustomerCredentials = booking.CustomerCredentials
                    };
                    var cancelBookingContext = await GetCustomerLedSummaryStep(request);

                    return cancelBookingContext.Content;
                });
            cancellationSummary.Should().NotBeNull("Cancellation summary not created");

            var cancelResponse = await RepeatDecorator<CancellationResponse?>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    return (await CancelBookingCustomerLedOverrideFeeStep(
                        new BookingCancellationWithFeeOverrideRequest()
                        {
                            BookingReference = booking!.BookingResponse.BookingReference,
                            Date =
                                booking.BookingResponse.Package.Transport.Routes
                                    .First(r => r.Direction == Direction.Outbound).DepDate!.Value.Date,
                            LastName = booking.BookingResponse.Guests.First().LastName,
                            CustomerCredentials = booking.CustomerCredentials,
                            Fee = fee,
                            RefundOption = BookingCancellationRequestRefundOption.Credit,
                            BookingBreakdownValidationHash = cancellationSummary!.RefundBreakdownValidationHash,
                            Source = "IntegrationTests"
                        }
                    )).Content;
                });

            using (new AssertionScope())
            {
                cancelResponse.Should().NotBeNull();
                cancelResponse!.CreditRefundAmount.Should().Be(fee);
            }

            var userCredits = await RepeatDecorator<Dictionary<string, IEnumerable<CreditHistoryItem>>?>
                .Create()
                .RepeatTimes(5)
                .Execute(async () => (await GetUserCreditsHistoryStep(booking!.CustomerCredentials!)).Content);

            using (new AssertionScope())
            {
                userCredits.Should().NotBeNull();
                userCredits![Currency].Count().Should().Be(1);
                userCredits[Currency].Sum(creditHistoryItem => creditHistoryItem.Order.Amount).Should().Be(fee);
                userCredits[Currency].Single().Metadata.Single(metadata => metadata.Key == "reason").Value.Should()
                    .Be("onetimeuse");
            }

            var bookingResponse = (await GetBookingStep(new DisplayBookingRequest()
            {
                BookingReference = booking!.BookingResponse.BookingReference,
                Date = booking.BookingResponse.Package.Transport.Routes
                    .First(r => r.Direction == Direction.Outbound).DepDate!.Value.Date
                    .ToString("yyyy-MM-dd", CultureInfo.CurrentCulture),
                LastName = booking.BookingResponse.Guests.First().LastName,
            }, booking.CustomerCredentials!)).Content;

            using (new AssertionScope())
            {
                bookingResponse.Should().NotBeNull();
                bookingResponse!.Memo.Should().ContainSingle(x => x.Code == "REP3");
            }
        }

        [Theory(DisplayName =
            "Cancel booking that was partially paid by one use credit and rest by cash. Rest as one time credit")]
        [InlineData(120, 50, 2)]
        [InlineData(240, 25, 4)]
        public async Task
            CancelBookingCustomerLedOverrideFee_WhenOver60daysAndOnlyDepositWasPaidPartiallyByOneTimeUseAndRestByCash_ShouldReturnRestAsOneTimeCredit(
                decimal fee,
                decimal oneTimeUseCreditPercentageAmount,
                int adultsNumber)
        {
            var booking =
                await RepeatDecorator<CreateBookingResponse?>
                    .Create()
                    .RepeatTimes(5)
                    .Execute(async () =>
                    {
                        var bookingContext = await CreateBookingStep(
                            new CreateBookingRequest
                            {
                                Language = Language,
                                BookingCreationParams = new BookingCreationParams()
                                {
                                    StartDate = DateTime.Now.AddDays(61)
                                        .ToString("yyyy-MM-dd", CultureInfo.CurrentCulture),
                                    Duration = 7,
                                    AdultsNumber = adultsNumber
                                },
                                Payment = new Payment()
                                {
                                    PaymentOption = PaymentOption.CUSTOM,
                                    PaymentCompletion = PaymentCompletion.DEPOSIT,
                                    CashPercent = 100 - oneTimeUseCreditPercentageAmount,
                                    OneTimeCreditPercent = oneTimeUseCreditPercentageAmount
                                }
                            });
                        return bookingContext.Content;
                    });
            booking.Should().NotBeNull("Booking not created");

            var cancellationSummary = await RepeatDecorator<BookingCancellationSummaryResponse?>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    var request = new BookingCancellationSummaryRequest()
                    {
                        BookingReference = booking!.BookingResponse.BookingReference,
                        Date = booking.BookingResponse.Package.Transport.Routes
                            .First(r => r.Direction == Direction.Outbound).DepDate!.Value.Date,
                        LastName = booking.BookingResponse.Guests.First().LastName,
                        CustomerCredentials = booking.CustomerCredentials
                    };
                    var cancelBookingContext = await GetCustomerLedSummaryStep(request);

                    return cancelBookingContext.Content;
                });
            cancellationSummary.Should().NotBeNull("Cancellation summary not created");

            var cancelResponse = await RepeatDecorator<CancellationResponse?>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    return (await CancelBookingCustomerLedOverrideFeeStep(
                        new BookingCancellationWithFeeOverrideRequest()
                        {
                            BookingReference = booking!.BookingResponse.BookingReference,
                            Date =
                                booking.BookingResponse.Package.Transport.Routes
                                    .First(r => r.Direction == Direction.Outbound).DepDate!.Value.Date,
                            LastName = booking.BookingResponse.Guests.First().LastName,
                            CustomerCredentials = booking.CustomerCredentials,
                            Fee = fee,
                            RefundOption = BookingCancellationRequestRefundOption.Credit,
                            BookingBreakdownValidationHash = cancellationSummary!.RefundBreakdownValidationHash,
                            Source = "IntegrationTests"
                        }
                    )).Content;
                });

            var creditRefund = fee * (100 - oneTimeUseCreditPercentageAmount) / 100;
            using (new AssertionScope())
            {
                cancelResponse.Should().NotBeNull();
                cancelResponse!.CreditRefundAmount.Should().Be(creditRefund);
            }

            var userCredits = await RepeatDecorator<IList<MyCreditInfo>?>
                .Create()
                .RepeatTimes(5)
                .Execute(async () => (await GetUserCreditsStep(booking!.CustomerCredentials!)).Content?.ToList());

            using (new AssertionScope())
            {
                userCredits.Should().NotBeNull();
                userCredits!.Count.Should().Be(1);
                userCredits.ToList()[0].Balance.Should().Be(creditRefund);
            }

            var userCreditsHistory = await RepeatDecorator<Dictionary<string, IEnumerable<CreditHistoryItem>>?>
                .Create()
                .RepeatTimes(5)
                .Execute(async () => (await GetUserCreditsHistoryStep(booking!.CustomerCredentials!)).Content);

            using (new AssertionScope())
            {
                userCreditsHistory.Should().NotBeNull();
                var activeCreditHistoryItems = userCreditsHistory![Currency].Where(x => !x.Redemptions.Any()).ToList();
                activeCreditHistoryItems.Count.Should().Be(1);
                activeCreditHistoryItems.Sum(creditHistoryItem => creditHistoryItem.Order.Amount).Should()
                    .Be(creditRefund);
                activeCreditHistoryItems.Single().Metadata.Single(metadata => metadata.Key == "reason").Value.Should()
                    .Be("onetimeuse");
            }
        }

        [Theory(DisplayName =
            "Cancel booking that was partially paid by credit and rest by cash. Validate rep codes")]
        [InlineData(62, 100, "REP3")]
        [InlineData(62, 50, "REP4")]
        [InlineData(62, 0, "REP4")]
        [InlineData(56, 100, "REP3")]
        [InlineData(56, 50, "REP4")]
        [InlineData(56, 0, "REP5")]
        [InlineData(26, 100, "REP7")]
        [InlineData(26, 76, "REP6")]
        [InlineData(26, 74, "REP5")]
        public async Task
            CancelBookingCustomerLedOverrideFee_WhenCancelBooking_ShouldReturnRepCodeInMemo(
                int daysBeforeDeparture,
                decimal creditPaymentPercentageAmount,
                string? expectedRepCode)
        {
            var booking =
                await RepeatDecorator<CreateBookingResponse?>
                    .Create()
                    .RepeatTimes(5)
                    .Execute(async () =>
                    {
                        var bookingContext = await CreateBookingStep(
                            new CreateBookingRequest
                            {
                                Language = Language,
                                BookingCreationParams = new BookingCreationParams()
                                {
                                    StartDate = DateTime.Now.AddDays(daysBeforeDeparture)
                                        .ToString("yyyy-MM-dd", CultureInfo.CurrentCulture),
                                    Duration = 7,
                                    AdultsNumber = 2
                                },
                                Payment = new Payment()
                                {
                                    PaymentOption = PaymentOption.CUSTOM,
                                    PaymentCompletion = PaymentCompletion.FULLY_PAID,
                                    CashPercent = 100 - creditPaymentPercentageAmount,
                                    GiftCardCreditPercent = creditPaymentPercentageAmount
                                }
                            });
                        return bookingContext.Content;
                    });
            booking.Should().NotBeNull("Booking not created");

            var cancellationSummary = await RepeatDecorator<BookingCancellationSummaryResponse?>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    var request = new BookingCancellationSummaryRequest()
                    {
                        BookingReference = booking!.BookingResponse.BookingReference,
                        Date = booking.BookingResponse.Package.Transport.Routes
                            .First(r => r.Direction == Direction.Outbound).DepDate!.Value.Date,
                        LastName = booking.BookingResponse.Guests.First().LastName,
                        CustomerCredentials = booking.CustomerCredentials
                    };
                    var cancelBookingContext = await GetCustomerLedSummaryStep(request);

                    return cancelBookingContext.Content;
                });
            cancellationSummary.Should().NotBeNull("Cancellation summary not created");

            decimal fee = 120;
            BookingCancellationRequestRefundOption refundOption =
                cancellationSummary!.Refunds.FirstOrDefault()?.RefundOption ?? BookingCancellationRequestRefundOption.None;
            if (cancellationSummary!.Refunds.Any(x =>
                    x.RefundOption == BookingCancellationRequestRefundOption.OriginalPayment))
            {
                refundOption = BookingCancellationRequestRefundOption.OriginalPayment;
            }
            if (daysBeforeDeparture is < 28 and > 14)
            {
                fee = Math.Round(cancellationSummary!.Refunds.First().Total * 0.75M, 2);
            }

            if (daysBeforeDeparture is < 14)
            {
                fee = Math.Round(cancellationSummary!.Refunds.First().Total, 2);
                refundOption = BookingCancellationRequestRefundOption.None;
            }

            var cancelResponse = await RepeatDecorator<CancellationResponse?>
                .Create()
                .RepeatTimes(10)
                .Execute(async () =>
                {
                    return (await CancelBookingCustomerLedOverrideFeeStep(
                        new BookingCancellationWithFeeOverrideRequest()
                        {
                            BookingReference = booking!.BookingResponse.BookingReference,
                            Date =
                                booking.BookingResponse.Package.Transport.Routes
                                    .First(r => r.Direction == Direction.Outbound).DepDate!.Value.Date,
                            LastName = booking.BookingResponse.Guests.First().LastName,
                            CustomerCredentials = booking.CustomerCredentials,
                            Fee = fee,
                            RefundOption = refundOption,
                            BookingBreakdownValidationHash = cancellationSummary!.RefundBreakdownValidationHash,
                            Source = "IntegrationTests"
                        }
                    )).Content;
                });

            using (new AssertionScope())
            {
                cancelResponse.Should().NotBeNull();
            }

            var bookingResponse = (await GetBookingStep(new DisplayBookingRequest()
            {
                BookingReference = booking!.BookingResponse.BookingReference,
                Date = booking.BookingResponse.Package.Transport.Routes
                    .First(r => r.Direction == Direction.Outbound).DepDate!.Value.Date
                    .ToString("yyyy-MM-dd", CultureInfo.CurrentCulture),
                LastName = booking.BookingResponse.Guests.First().LastName,
            }, booking.CustomerCredentials!)).Content;

            using (new AssertionScope())
            {
                bookingResponse.Should().NotBeNull();
                var repCodes = bookingResponse!.Memo.Where(x => x.Code.StartsWith("REP", StringComparison.Ordinal))
                    .Select(x => x.Code).ToList();
                if (expectedRepCode != null)
                {
                    repCodes.Count.Should().Be(1);
                    repCodes.Should().ContainSingle(x => x == expectedRepCode, "because the rep code should be present, but it is not and rep codes are: " + string.Join(", ", repCodes));
                }
                else
                {
                    repCodes.Should().BeEmpty("but rep codes are: " + string.Join(", ", repCodes));
                }
            }
        }
    } 
}
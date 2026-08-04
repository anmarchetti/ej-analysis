using Allure.Xunit.Attributes;
using Allure.XUnit.Attributes.Steps;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Shared.Constants;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Transfers;
using FluentAssertions;
using Newtonsoft.Json;
using Refit;
using Xunit.Abstractions;
using BookingResponse = easyJet.Holidays.Api.Domain.Data.Booking.BookingResponse;

namespace easyJet.Holiday.IntegrationTests.Tests.Amend;

[AllureSuite("Amendment tests")]
[AllureSubSuite("Amend transfer")]
[AllureOwner("CSS team")]
public class AmendTransferTests : BaseTest
{
    public AmendTransferTests(IHttpClientFactory _httpClientFactory, TestApiHttpClient testApiHttpClient, ITestOutputHelper testOutputHelper)
        : base(_httpClientFactory, testApiHttpClient, testOutputHelper)
    {
    }

    [Fact(DisplayName = "Amend transfer for random booking.")]
    [AllureIssue("CSSDA-649")]
    public async Task AmendTransfer_RandomBooking_ChangeOnAvailableTransfer()
    {
        var (updatedBooking, amendTransfer) =
            await RepeatDecorator<(BookingResponse, AmendTransferItem)>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var availableTransfers = await GetAltTransfersStep(bookingContext.Content.BookingResponse.BookingReference, loginCookie);

                var amendTransfer = availableTransfers.Content.Transfers.First();

                var amendResponse = await AmendTransferStep(bookingContext.Content.BookingResponse, amendTransfer, loginCookie);

                var updatedBooking =
                    await LoadBookingStep(
                        bookingContext.Content.BookingResponse.BookingReference,
                        bookingContext.Content.Customer.LastName,
                        bookingContext.Content.BookingResponse.Package.Accom.StartDate);
                return (updatedBooking, amendTransfer);
            });

        updatedBooking.Transfers.Should().HaveCount(1);
        updatedBooking.Transfers.First().Code.Should().Be(amendTransfer.Transfer.Code);
    }

    [Fact(DisplayName = "Amend transfer for random booking with promocode.")]
    [AllureIssue("CSSDA-649")]
    public async Task AmendTransfer_RandomBookingWithPromocode_ChangeOnAvailableTransfer()
    {
        var (updatedBooking, amendTransfer) =
            await RepeatDecorator<(BookingResponse, AmendTransferItem)>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingWithPromocodeStep();

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var availableTransfers = await GetAltTransfersStep(bookingContext.Content.BookingResponse.BookingReference, loginCookie);

                var amendTransfer = availableTransfers.Content.Transfers.FirstOrDefault();

                var amendResponse = await AmendTransferStep(bookingContext.Content.BookingResponse, amendTransfer, loginCookie);

                var updatedBooking =
                    await LoadBookingStep(
                        bookingContext.Content.BookingResponse.BookingReference,
                        bookingContext.Content.Customer.LastName,
                        bookingContext.Content.BookingResponse.Package.Accom.StartDate);
                return (updatedBooking, amendTransfer);
            });

        updatedBooking.Transfers.Should().HaveCount(1);
        updatedBooking.Transfers.First().Code.Should().Be(amendTransfer.Transfer.Code);
        updatedBooking.DiscountCode.Should().NotBeNullOrEmpty();
    }

    [Fact(DisplayName = "Can not to receive transfer price for booking with amend transfer restriction status.")]
    [AllureIssue("CSSDA-649")]
    public async Task AmendTransfer_RandomBooking_ChangeFewTimes_CatchErrorResponse()
    {
        var errorResponse =
            await RepeatDecorator<Dictionary<string, string>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var amendSettings = await GetAmendBookingSettingsStep();

                AmendTransferItem amendTransfer = null;

                ApiResponse<BookingResponse> amendResponse = null;

                for (int i = 0; i < amendSettings.AmendTransferCount; i++)
                {
                    var availableTransfers = await GetAltTransfersStep(bookingContext.Content.BookingResponse.BookingReference, loginCookie);

                    amendTransfer = availableTransfers.Content.Transfers.First();

                    amendResponse = await AmendTransferStep(bookingContext.Content.BookingResponse, amendTransfer, loginCookie);
                }

                var availableTransfersErrorResponse = await GetAltTransfersStep(bookingContext.Content.BookingResponse.BookingReference, loginCookie);

                var errorResponse = JsonConvert.DeserializeObject<Dictionary<string, string>>(availableTransfersErrorResponse.Error.Content);

                return errorResponse;
            });

        errorResponse["code"].Should().Be("API-ERR-240002");
    }

    [Fact(DisplayName = "Can not commit transfer changes for booking with amend transfer restriction status.")]
    [AllureIssue("CSSDA-649")]
    public async Task AmendTransfer_RandomBooking_ChangeFewTimes_CatchErrorResponseDuringCommit()
    {
        var errorResponse =
            await RepeatDecorator<Dictionary<string, string>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var amendSettings = await GetAmendBookingSettingsStep();

                AmendTransferItem amendTransfer = null;
                ApiResponse<BookingResponse> amendResponse = null;

                for (int i = 0; i < amendSettings.AmendTransferCount; i++)
                {
                    var availableTransfers = await GetAltTransfersStep(bookingContext.Content.BookingResponse.BookingReference, loginCookie);

                    amendTransfer = availableTransfers.Content.Transfers.First();

                    amendResponse = await AmendTransferStep(bookingContext.Content.BookingResponse, amendTransfer, loginCookie);
                }

                amendResponse = await AmendTransferStep(bookingContext.Content.BookingResponse, amendTransfer, loginCookie);

                var errorResponse = JsonConvert.DeserializeObject<Dictionary<string, string>>(amendResponse.Error.Content);

                return errorResponse;
            });

        errorResponse["code"].Should().Be("API-ERR-240002");
    }

    [Fact(DisplayName = "Memo added after amending transfer.")]
    [AllureIssue("CSSDA-649")]
    public async Task AmendTransfer_RandomBooking_UpdateTransfer_MemoCodeShouldBeAdded()
    {
        var transferMemo =
            await RepeatDecorator<IEnumerable<Memo>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var availableTransfers = await GetAltTransfersStep(bookingContext.Content.BookingResponse.BookingReference, loginCookie);

                var amendTransfer = availableTransfers.Content.Transfers.First();

                var amendResponse = await AmendTransferStep(bookingContext.Content.BookingResponse, amendTransfer, loginCookie);

                var updatedBooking =
                    await LoadBookingStep(
                        bookingContext.Content.BookingResponse.BookingReference,
                        bookingContext.Content.Customer.LastName,
                        bookingContext.Content.BookingResponse.Package.Accom.StartDate);

                var transferMemo = updatedBooking.Memo.Where(x => string.Equals(x.Code, "AMD2"));

                return transferMemo;
            });

        transferMemo.Count().Should().Be(1);
    }

    [Fact(DisplayName = "Customer pay for booking during amend transfer flow.")]
    [AllureIssue("CSSDA-649")]
    public async Task AmendTransfer_RandomBooking_UpdateTransfer_AddNewItemToPaymentHistory()
    {
        var (paymentHistoryItems, amendTransfer) =
            await RepeatDecorator<(PaymentHistoryItem[], AmendTransferItem)>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep(new CreateBookingRequest
                {
                    BookingCreationParams = new BookingCreationParams
                    {
                        Theme = "BA"
                    }
                });

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var availableTransfers = await GetAltTransfersStep(bookingContext.Content.BookingResponse.BookingReference, loginCookie);

                var amendTransfer = availableTransfers.Content.Transfers.MaxBy(x => x.AmendmentCharges);

                var amendResponse = await AmendTransferStep(bookingContext.Content.BookingResponse, amendTransfer, loginCookie);

                var updatedBooking =
                    await LoadBookingStep(
                        bookingContext.Content.BookingResponse.BookingReference,
                        bookingContext.Content.Customer.LastName,
                        bookingContext.Content.BookingResponse.Package.Accom.StartDate);

                var paymentHistoryItems = updatedBooking.PaymentInfo.PaymentHistory;
                return (paymentHistoryItems, amendTransfer);
            });

        paymentHistoryItems.Any(x => x.Amount == amendTransfer.AmendmentCharges.Value).Should().BeTrue();
    }

    [Fact(DisplayName = "For luxury holiday available only private transfer.")]
    [AllureIssue("CSSDA-649")]
    public async Task AmendTransfer_LuxaryBooking_OnlyPrivateTransferAvailable()
    {
        var availableTransfers =
            await RepeatDecorator<AmendBookingTransfersResponse>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep(new CreateBookingRequest
                {
                    BookingCreationParams = new BookingCreationParams
                    {
                        Theme = "BL"
                    }
                });

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var availableTransfers = await GetAltTransfersStep(bookingContext.Content.BookingResponse.BookingReference, loginCookie);
                return availableTransfers.Content;
            });

        availableTransfers.Transfers.Count().Should().Be(1);
        availableTransfers.Transfers.First().AmendmentCharges.Should().Be(0m);
        availableTransfers.Transfers.First().Transfer.Type.Should().Be(TransferItemType.NoTransfer);
    }

    [Fact(DisplayName = "Beach holiday can not have WITHOUT_TRANSFER option.")]
    [AllureIssue("CSSDA-649")]
    public async Task AmendTransfer_BeachBooking_CanNotRemoveTransfer()
    {

        var availableTransfers =
            await RepeatDecorator<AmendBookingTransfersResponse>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep(new CreateBookingRequest
                {
                    BookingCreationParams = new BookingCreationParams
                    {
                        Theme = "B"
                    }
                });

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var availableTransfers = await GetAltTransfersStep(bookingContext.Content.BookingResponse.BookingReference, loginCookie);
                return availableTransfers.Content;
            });

        availableTransfers.Transfers.Count(x => x.Transfer.Code == "DEFAULT").Should().Be(0);
    }

    [AllureStep("Get alternative transfer for {bookingRef}")]
    private async Task<ApiResponse<AmendBookingTransfersResponse>> GetAltTransfersStep(string bookingRef, [Skip] string loginCookie)
    {
        var availableTransfers =
            await amendBookingApi.AlternativeTransferRequest(new AlternativeTransfersSearchRequest { BookingReference = bookingRef }, loginCookie);

        return availableTransfers;
    }

    [AllureStep("Amend transfer option.")]
    private async Task<ApiResponse<BookingResponse>> AmendTransferStep(BookingResponse booking, AmendTransferItem transfer, [Skip] string loginCookie)
    {
        var paymentInfo = transfer.AmendmentCharges.Value < 0
            ? PaymentInfoConstants.AmountOnlyPaymentInfo(transfer.AmendmentCharges.Value)
            : PaymentInfoConstants.CreatePaymentInfo(transfer.AmendmentCharges.Value);

        var convertType = transfer.AmendmentCharges.Value < 0
            ? ConvertType.CREDIT
            : ConvertType.REFUND;

        var amendBookingRequest = new AmendBookingRequest
        {
            BookingReference = booking.BookingReference,
            BrowserInfo = BrowserInfoConstants.DefaultBrowserInfo(),
            Date = booking.BookingDate.DateTime,
            DeviceId = Guid.NewGuid().ToString(),
            LastName = booking.Guests.Single(x => x.IsLead).LastName,
            PaymentInfo = paymentInfo,
            ConvertType = convertType,
            Transfers = new List<TransferItem> { transfer.Transfer },
            DiscountCode = booking.DiscountCode
        };

        var amendResponse = await amendBookingApi.AmmendBooking(amendBookingRequest, Guid.NewGuid().ToString(), loginCookie);

        return amendResponse;
    }
}

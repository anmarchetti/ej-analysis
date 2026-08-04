using easyJet.Holiday.IntegrationTests.Shared.Api;
using easyJet.Holiday.IntegrationTests.Shared.Extensions;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Customer;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Offers;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holiday.IntegrationTests.Shared.Models.CallCentre;
using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holiday.IntegrationTests.Shared.Models.SharedServices;
using easyJet.Holiday.IntegrationTests.Shared.Strategies.BookingCreationStrategy;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using Microsoft.Extensions.Options;
using Refit;
using BookingCancellationWithFeeOverrideRequest = easyJet.Holiday.IntegrationTests.Shared.Models.Booking.BookingCancellationWithFeeOverrideRequest;
using CancelBookingRequest = easyJet.Holiday.IntegrationTests.Shared.Models.Booking.CancelBookingRequest;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Booking;

public class BookingService : IBookingService
{
    private ICustomerApi _customerApi;
    private IBookingApi _bookingApi;
    private ICallCentreApi _callCentreApi;
    private readonly CallCentreSettings _settings;
    private readonly CustomerFaker _customerFaker;
    private readonly IBookingCreationStrategySelector _bookingCreationStrategySelector;
    private readonly SharedServicesSettings _sharedServicesSettings;

    private readonly IBookingBuilder _bookingBuilder;

    public BookingService(
        ICustomerApi customerApi,
        IBookingApi bookingApi,
        ICallCentreApi callCentreApi,
        CustomerFaker customerFaker,
        IOptions<CallCentreSettings> callCentreSettings,
        IBookingCreationStrategySelector bookingCreationStrategySelector,
        IBookingBuilder bookingBuilder,
        IOptions<SharedServicesSettings> sharedServicesSettings)
    {
        _customerApi = customerApi;
        _callCentreApi = callCentreApi;
        _bookingApi = bookingApi;
        _customerFaker = customerFaker;
        _settings = callCentreSettings?.Value ?? throw new ArgumentNullException(nameof(callCentreSettings));
        _bookingCreationStrategySelector = bookingCreationStrategySelector;
        _bookingBuilder = bookingBuilder;
        _sharedServicesSettings = sharedServicesSettings?.Value ??
                                  throw new ArgumentNullException(
                                      nameof(sharedServicesSettings));
    }

    public async Task<CreateBookingsResponse> CreateRandomBooking(CreateBookingRequest createBookingRequest)
    {
        ArgumentNullException.ThrowIfNull(createBookingRequest);

        createBookingRequest.Payment ??= new Payment()
        {
            PaymentCompletion = createBookingRequest.BookingCreationParams.IsDeposit ? PaymentCompletion.DEPOSIT : PaymentCompletion.FULLY_PAID,
            PaymentOption = createBookingRequest.BookingCreationParams.IsCredited ? PaymentOption.CREDIT : PaymentOption.CARD
        };

        var bookings = await _bookingBuilder
            .ForUser(createBookingRequest.CustomerCredentials, createBookingRequest.AgentCredentials, createBookingRequest.IsTradePortal)
            .WithPayment(createBookingRequest.Payment)
            .WithLanguage(createBookingRequest.Language)
            .ApplyCreationParameters(createBookingRequest.BookingCreationParams)
            .BuildMany(createBookingRequest.NumberOfBookings);

        return bookings;
    }

    public async Task<CreateBookingResponse> CreateBookingWithRoom(CreateBookingRequest createBookingRequest)
    {
        ArgumentNullException.ThrowIfNull(createBookingRequest);
        var booking = await _bookingBuilder
            .ForUser(createBookingRequest.CustomerCredentials, createBookingRequest.AgentCredentials, createBookingRequest.IsTradePortal)
            .WithLanguage(createBookingRequest.Language)
            .ShouldHaveAlternativeRooms()
            .Build();

        return booking;
    }

    public async Task<CreateBookingResponse> CreateCancelledWithCreditBooking()
    {
        var booking = await _bookingBuilder
            .Build();

        await _callCentreApi.CreditBooking(new CreditBookingRequest
        {
            BookingRef = booking.BookingResponse.BookingReference,
            Date = booking.BookingResponse.Package.Accom.StartDate,
            LastName = booking.Customer.LastName!,
        }, _settings.CallCentreKey);

        await RefreshBooking(booking);

        return booking;
    }

    public async Task<CreateBookingResponse> CreateCancelledBooking()
    {
        var booking = await _bookingBuilder
            .Build();

        await _bookingApi.CancelBooking(new CancelBookingRequest
        {
            BookingReference = booking.BookingResponse.BookingReference,
            Reason = "TestAPI"
        }, booking.CustomerCredentials!.LoginCookie);

        await RefreshBooking(booking);

        return booking;
    }

    public async Task<CreateBookingResponse> CreateDepositOnlyBooking()
    {
        var booking = await _bookingBuilder
            .WithPayment(new Payment() { PaymentCompletion = PaymentCompletion.DEPOSIT })
            .Build();

        await RefreshBooking(booking);

        return booking;
    }

    private async Task RefreshBooking(CreateBookingResponse booking)
    {
        var displayBooking = await _bookingApi.DisplayBooking(
            new DisplayBookingRequest
            {
                BookingReference = booking.BookingResponse.BookingReference,
                Date = booking.BookingResponse.Package.Accom.StartDate,
                LastName = booking.Customer.LastName!
            }, booking.CustomerCredentials!.LoginCookie);

        if (displayBooking.Content != null)
        {
            booking.BookingResponse = displayBooking.Content;
        }
    }

    private async Task<BookingResponse> DisplayBooking(DisplayBookingRequest displayBookingRequest, string loginCookie)
    {
        var displayBooking = await _bookingApi.DisplayBooking(displayBookingRequest, loginCookie);

        return displayBooking.Content;
    }

    [Obsolete]
    public async Task<CreateBookingResponse> CreateBooking(CreateBookingRequest createBookingRequest)
    {
        ArgumentNullException.ThrowIfNull(createBookingRequest);

        CustomerInfo customerInfo;
        string loginCookie;
        ApiResponse<CustomerInfo> customerApiResponse;

        // Create user if we don`t pass creds
        if (createBookingRequest.CustomerCredentials is null)
        {
            var customer = _customerFaker.Generate();

            var customerCreateRequest = new CreateCustomerRequest
            {
                Customer = customer,
                Password = "!Qwerty_123",
                RememberMe = true
            };

            customerApiResponse = await _customerApi.CreateCustomer(customerCreateRequest);

            ArgumentNullException.ThrowIfNull(customerApiResponse.Content);

            createBookingRequest.CustomerCredentials = new CustomerCredentials
            {
                Email = customerApiResponse.Content.Email!,
                Password = customerCreateRequest.Password,
                RememberMe = customerCreateRequest.RememberMe
            };
        }

        var loggedCustomer = await _customerApi.Login(createBookingRequest.CustomerCredentials);

        loginCookie = loggedCustomer.Headers.GetAuthCookies();

        customerApiResponse = await _customerApi.CustomerDetails();

        customerInfo = customerApiResponse.Content;

        // create booking
        var bookingResponse =
            await _bookingCreationStrategySelector
            .Select(createBookingRequest.BookingCreationCause)
            .CreateBooking(customerInfo, loginCookie, GetPackagesRequestFaker(createBookingRequest));

        // cancel and credit booking
        if (createBookingRequest.BookingCreationParams?.IsCredited == true)
        {
            await _callCentreApi.CreditBooking(new CreditBookingRequest
            {
                BookingRef = bookingResponse.BookingReference,
                Date = bookingResponse.Package.Accom.StartDate,
                LastName = customerInfo.LastName!,
            }, _settings.CallCentreKey);
        }

        // cancel only
        else if (createBookingRequest.BookingCreationParams?.IsCanceled == true)
        {
            await _bookingApi.CancelBooking(
                new CancelBookingRequest
                {
                    BookingReference = bookingResponse.BookingReference,
                    Reason = "TestAPI"
                },
                loginCookie);
        }

        var displayBooking = await _bookingApi.DisplayBooking(
            new DisplayBookingRequest
            {
                BookingReference = bookingResponse.BookingReference,
                Date = bookingResponse.Package.Accom.StartDate,
                LastName = customerInfo.LastName!
            }, loginCookie);

        if (displayBooking.Content != null)
        {
            bookingResponse = displayBooking.Content;
        }

        return new CreateBookingResponse
        {
            BookingResponse = bookingResponse,
            CustomerCredentials = createBookingRequest.CustomerCredentials,
            Customer = customerInfo
        };
    }

    [Obsolete]
    private GetPackagesRequestFaker GetPackagesRequestFaker(CreateBookingRequest createBookingRequest)
    {
        if (createBookingRequest.BookingCreationParams is null)
            return new GetPackagesRequestFaker();

        return UpdateFakerRules(createBookingRequest.BookingCreationParams);
    }

    [Obsolete]
    //TODO: implement logic for all booking creation request param
    public async Task<DisplayBookingResponse> GetBooking(DisplayBookingRequest request)
    {
        var loggedCustomer = await _customerApi.Login(request.Credentials);
        var loginCookie = loggedCustomer.Headers.GetAuthCookies();

        var booking = await _bookingApi.DisplayBooking(request,
            loginCookie);

        return new DisplayBookingResponse { BookingResponse = booking.Content };
    }

    [Obsolete]
    private GetPackagesRequestFaker UpdateFakerRules(BookingCreationParams bookingCreationParams)
    {
        var getPackagesRequestFaker = new GetPackagesRequestFaker();

        if (!string.IsNullOrEmpty(bookingCreationParams.Theme))
        {
            //getPackagesRequestFaker.RuleFor(x => x.PlacementId, "promo_hotel_list");
            //getPackagesRequestFaker.RuleFor(x => x.SearchType, "promo");
            getPackagesRequestFaker
                .RuleFor(x => x.InitialThemes, bookingCreationParams.Theme)
                .RuleFor(x => x.Themes, bookingCreationParams.Theme);
        }

        return getPackagesRequestFaker;
    }

    public async Task<PayRemainingBalanceResponse> PayRemainingBalance(Holiday.IntegrationTests.Shared.Models.Booking.PayRemainingBalanceRequest createBookingRequest)
    {
        var booking = await _bookingApi.PayRemainingBalance(createBookingRequest, Guid.NewGuid().ToString());
        return new PayRemainingBalanceResponse { BookingResponse = booking.Content };
    }

    public async Task<BookingCancellationSummaryResponse> CancellationCustomerLedSummary(easyJet.Holiday.IntegrationTests.Shared.Models.Booking.BookingCancellationSummaryRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.CustomerCredentials);

        var loggedCustomer = await _customerApi.Login(request.CustomerCredentials);
        var loginCookie = loggedCustomer.Headers.GetAuthCookies();

        var summary = await _bookingApi.CustomerLedCancellationSummary(request, loginCookie);
        return summary;
    }

    public async Task<CancellationResponse> CancelBookingCustomerLedOverrideFee(BookingCancellationWithFeeOverrideRequest request)
    {
        var cancellationResponse = await _bookingApi.CancelBookingCustomerLedOverrideFee(request, _sharedServicesSettings.Key);
        return cancellationResponse;
    }
}
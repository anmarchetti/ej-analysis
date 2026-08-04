using Allure.Xunit.Attributes.Steps;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Settings;
using easyJet.Holiday.IntegrationTests.Shared.Api;
using easyJet.Holiday.IntegrationTests.Shared.Constants;
using easyJet.Holiday.IntegrationTests.Shared.Extensions;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Customer;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holiday.IntegrationTests.Shared.Models.CallCentre;
using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holiday.IntegrationTests.Shared.Models.Offer;
using easyJet.Holiday.IntegrationTests.Shared.RedHatSSO;
using easyJet.Holiday.IntegrationTests.Shared.SitecoreApi;
using easyJet.Holiday.IntegrationTests.Shared.TestApi;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using Refit;
using Xunit.Abstractions;
using SharedServicesCancelBookingRequest = easyJet.Holidays.Api.Domain.Data.SharedServices.Booking.CancelBookingRequest;

namespace easyJet.Holiday.IntegrationTests.Tests
{
    public abstract class BaseTest
    {
        internal IOfferTestApi offerTestApi;
        internal IBookingTestApi bookingTestApi;
        internal ISharedServicesBookingTestApi sharedServicesBookingTestApi;
        internal ISharedServicesDataHubTestApi sharedServicesDataHubTestApi;
        internal ICustomerTestApi customerTestApi;
        internal ICustomerApi customerApi;
        internal IAmendBookingApi amendBookingApi;
        internal IBookingApi bookingApi;
        internal ISharedServicesBookingApi sharedServicesBookingApi;
        internal ISitecoreApi sitecoreApi;
        internal ISearchApi searchApi;
        internal IOffersApi offersApi;
        internal IOpenIdConnectApi openIdConnectApi;
        internal ISeatsApi seatsApi;
        internal ICallCentreTestApi callCentreApi;
        internal IContactUsApi contactUsApi;
        internal IShortlistApi shortlistApi;
        internal ICreditApi creditApi;
        internal readonly ITestOutputHelper _testOutputHelper;

        internal CustomerFaker customerFaker;

        protected BaseTest(
            IHttpClientFactory HttpClientFactory,
            TestApiHttpClient testApiHttpClient,
            ITestOutputHelper testOutputHelper)
        {
            ArgumentNullException.ThrowIfNull(HttpClientFactory);

            var refitSettings = new RefitSettings { ContentSerializer = new NewtonsoftJsonContentSerializer() };

            var atcomRefitSettings = new RefitSettings { ContentSerializer = new XmlContentSerializer() };

            var webApiHttpClient = HttpClientFactory.CreateClient(Endpoints.WebApiEndpointName);
            var sitecoreHttpClient = HttpClientFactory.CreateClient(Endpoints.SitecoreApiEndpointName);
            var atcomVrpHttpClient = HttpClientFactory.CreateClient(Endpoints.AtcomVrpEndpointName);
            var openIdConnectHttpClient =
                HttpClientFactory.CreateClient(Endpoints.TradePortalOpenIdConnectEndpointName);

            customerTestApi = RestService.For<ICustomerTestApi>(testApiHttpClient.Client, refitSettings);
            offerTestApi = RestService.For<IOfferTestApi>(testApiHttpClient.Client, refitSettings);
            bookingTestApi = RestService.For<IBookingTestApi>(testApiHttpClient.Client, refitSettings);
            sharedServicesBookingTestApi =
                RestService.For<ISharedServicesBookingTestApi>(testApiHttpClient.Client, refitSettings);
            sharedServicesDataHubTestApi =
                RestService.For<ISharedServicesDataHubTestApi>(testApiHttpClient.Client, refitSettings);
            sitecoreApi = RestService.For<ISitecoreApi>(sitecoreHttpClient, refitSettings);

            customerApi = RestService.For<ICustomerApi>(webApiHttpClient, refitSettings);
            amendBookingApi = RestService.For<IAmendBookingApi>(webApiHttpClient, refitSettings);
            searchApi = RestService.For<ISearchApi>(webApiHttpClient, refitSettings);
            offersApi = RestService.For<IOffersApi>(webApiHttpClient, refitSettings);
            bookingApi = RestService.For<IBookingApi>(webApiHttpClient, refitSettings);
            sharedServicesBookingApi = RestService.For<ISharedServicesBookingApi>(webApiHttpClient, refitSettings);
            seatsApi = RestService.For<ISeatsApi>(webApiHttpClient, refitSettings);
            callCentreApi = RestService.For<ICallCentreTestApi>(testApiHttpClient.Client, refitSettings);
            contactUsApi = RestService.For<IContactUsApi>(webApiHttpClient, refitSettings);
            shortlistApi = RestService.For<IShortlistApi>(webApiHttpClient, refitSettings);
            creditApi = RestService.For<ICreditApi>(webApiHttpClient, refitSettings);

            openIdConnectApi = RestService.For<IOpenIdConnectApi>(openIdConnectHttpClient, refitSettings);

            _testOutputHelper = testOutputHelper;

            customerFaker = new CustomerFaker();
        }

        [AllureStep("Create random offer")]
        internal async Task<ApiResponse<IEnumerable<Offer>>> SearchOffersStep(
            SearchOffersRequest? searchOffersRequest = null)
        {
            var result = await offerTestApi.ProvideRandomOffers(searchOffersRequest ?? new SearchOffersRequest());

            return result;
        }

        [AllureStep("Create random booking with promocode")]
        internal async Task<ApiResponse<CreateBookingResponse>> CreateBookingWithPromocodeStep()
        {
            //"INT" is a customer promocode for integration tests
            var result = await bookingTestApi.CreateRandomBooking(new CreateBookingRequest
            {
                BookingCreationParams = new BookingCreationParams { PriceFrom = 1001, Promocode = "INT" }
            });

            return result;
        }

        [AllureStep("Create random booking")]
        internal async Task<ApiResponse<CreateBookingResponse>> CreateBookingStep()
        {
            var result = await bookingTestApi.CreateRandomBooking(new CreateBookingRequest());

            return result;
        }

        [AllureStep("Create booking with some parameters.")]
        internal async Task<ApiResponse<CreateBookingResponse>> CreateBookingStep(CreateBookingRequest request)
        {
            var result = await bookingTestApi.CreateRandomBooking(request);

            return result;
        }

        [AllureStep("Create random booking with alternative rooms.")]
        internal async Task<ApiResponse<CreateBookingResponse>> CreateBookingWithAltRooms()
        {
            var result = await bookingTestApi.CreateBookingWithAltRooms(new CreateBookingRequest());

            return result;
        }

        [AllureStep("Login")]
        internal async Task<string> LoginAsAdminUserStep(CustomerCredentials creds)
        {
            var response = await customerApi.Login(creds);

            var authCookie = response.Headers.GetAuthCookies();

            return authCookie;
        }

        [AllureStep("Load booking information")]
        internal async Task<BookingResponse> LoadBookingStep(string bookingRef, string lastName,
            string bookingStartDate)
        {
            var displayBookingRequest = new DisplayBookingRequest
            {
                BookingReference = bookingRef, LastName = lastName, Date = bookingStartDate
            };

            var updatedBooking = await bookingApi.DisplayBooking(displayBookingRequest);

            return updatedBooking.Content;
        }

        [AllureStep("Create account step.")]
        internal async Task<ApiResponse<CustomerInfo>> CreateAccountStep(CreateCustomerRequest request)
        {
            return await CreateAccount(request);
        }

        [AllureStep("Load amend booking settings.")]
        internal async Task<AmendBookingSetting> GetAmendBookingSettingsStep()
        {
            var result = await sitecoreApi.GetAmendBookingSettings();

            return result.Content ?? throw result.Error;
        }

        internal async Task<ApiResponse<CustomerInfo>> CreateAccount(CreateCustomerRequest request)
        {
            var customer = await customerApi.CreateCustomer(request);

            return customer;
        }

        [AllureStep("Pay remaining balance")]
        internal async Task<BookingResponse> PayRemainingBalanceStep(string bookingRef, string lastName,
            string bookingStartDate, decimal amount)
        {
            var payRemainingBalanceRequest = new Shared.Models.Booking.PayRemainingBalanceRequest
            {
                BookingReference = bookingRef,
                LastName = lastName,
                BrowserInfo = BrowserInfoConstants.DefaultBrowserInfo(),
                PaymentInfo = PaymentInfoConstants.CreatePaymentInfo(amount),
                Date = bookingStartDate
            };

            var bookingResponse = await bookingTestApi.PayRemainingBalance(payRemainingBalanceRequest);

            return bookingResponse.BookingResponse;
        }

        [AllureStep("Load trade portal auth token.")]
        internal async Task<GetAuthTokenResponse?> GetTradePortalAuthToken()
        {
            var request = new GetAuthTokenRequest
            {
                GrantType = "password", ClientId = "trade-portal", UserName = "trudyvogl", Password = "123",
            };

            var response = await openIdConnectApi.GetAuthTokenAsync(request);

            return response?.Content;
        }

        [AllureStep("Cancel booking step.")]
        internal async Task<ApiResponse<CancelBookingResponse>> CancelBookingStep(
            SharedServicesCancelBookingRequest request)
        {
            var result = await sharedServicesBookingTestApi.CancelBooking(request);

            return result;
        }

        [AllureStep("Add credits step.")]
        internal async Task<ApiResponse<MyCreditInfo>> AddCreditsToAccountStep(AddCreditsRequest request)
        {
            return await callCentreApi.AddCredits(request);
        }
        
        [AllureStep("Get user credits step.")]
        internal async Task<ApiResponse<IEnumerable<MyCreditInfo>>> GetUserCreditsStep(CustomerCredentials customerCredentials)
        {
            var response = await customerApi.Login(customerCredentials);

            var authCookie = response.Headers.GetAuthCookies();
            
            return await creditApi.GetCreditInfoForUser(authCookie);
        }
        
        [AllureStep("Get user credits history step.")]
        internal async Task<ApiResponse<Dictionary<string, IEnumerable<CreditHistoryItem>>>>  GetUserCreditsHistoryStep(CustomerCredentials customerCredentials)
        {
            var response = await customerApi.Login(customerCredentials);

            var authCookie = response.Headers.GetAuthCookies();
            
            return await creditApi.GetCreditHistoryForUser(authCookie);
        }

        [AllureStep("Get customer led summary.")]
        internal async Task<ApiResponse<BookingCancellationSummaryResponse>> GetCustomerLedSummaryStep(
            Shared.Models.Booking.BookingCancellationSummaryRequest request)
        {
            var result = await bookingTestApi.CustomerLedSummary(request);

            return result;
        }
        
        [AllureStep("Cancel booking customer led with override fee.")]
        internal async Task<ApiResponse<CancellationResponse>> CancelBookingCustomerLedOverrideFeeStep(
            Shared.Models.Booking.BookingCancellationWithFeeOverrideRequest request)
        {
            var result = await bookingTestApi.CancellationCustomerLedCancelBookingOverrideFee(request);

            return result;
        }
        
        [AllureStep("Get booking")]
        internal async Task<ApiResponse<BookingResponse>> GetBookingStep(DisplayBookingRequest request, CustomerCredentials customerCredentials)
        {
            var result = await bookingApi.DisplayBooking(request, customerCredentials.LoginCookie);

            return result;
        }
    }
}
using Bogus;
using easyJet.Holiday.IntegrationTests.Shared.Api;
using easyJet.Holiday.IntegrationTests.Shared.Constants;
using easyJet.Holiday.IntegrationTests.Shared.Decorators;
using easyJet.Holiday.IntegrationTests.Shared.Exceptions;
using easyJet.Holiday.IntegrationTests.Shared.Helpers;
using easyJet.Holiday.IntegrationTests.Shared.Mappers;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Booking;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Offers;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holiday.IntegrationTests.Shared.Models.Language;
using easyJet.Holiday.IntegrationTests.Shared.Models.Offer;
using easyJet.Holiday.IntegrationTests.Shared.Models.TradePortals;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Data.Seats;
using easyJet.Holidays.Api.Domain.Data.SharedServices.Booking;
using easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.IntegrationTests.TestApi.Service.CallCentre;
using easyJet.Holidays.IntegrationTests.TestApi.Service.Credit;
using Force.DeepCloner;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Refit;
using System.Diagnostics.CodeAnalysis;
using Person = easyJet.Holidays.Api.Domain.Data.Guests.Person;
using Route = easyJet.Holidays.Api.Domain.Data.PackageOffers.Route;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Booking;

/// <summary>
/// Interacts with orchestrator endpoints, maps requests and responses between domain and netwodk models
/// </summary>
public class BookingApiService : IBookingApiService
{
    private readonly ISearchApi _searchApi;
    private readonly IBookingApi _bookingApi;
    private readonly ISeatsApi _seatsApi;
    private readonly IVoucherApi _voucherApi;
    private readonly ICreditService _creditService;
    private readonly ICallCentreService _callCentreService;
    private readonly ISharedServicesVouchersService _sharedServicesVouchersService;
    private readonly ISharedServicesAccountService _sharedServicesAccountService;
    private readonly ISharedServicesBookingService _sharedServicesBookingService;

    private readonly MarketSettings _marketSettings;

    private readonly AdultFaker _adultFaker = new();
    private readonly ChildFaker _childFaker = new();
    private readonly InfantFaker _infantFaker = new();

    private string _language = "en";

    public BookingApiService(
        ISearchApi searchApi,
        IBookingApi bookingApi,
        ISeatsApi seatsApi,
        IVoucherApi voucherApi,
        ICreditService creditService,
        ICallCentreService callCentreService,
        ISharedServicesVouchersService sharedServicesVouchersService,
        ISharedServicesAccountService sharedServicesAccountService,
        ISharedServicesBookingService sharedServicesBookingService,
        IOptions<MarketSettings> marketSettings)
    {
        _searchApi = searchApi;
        _bookingApi = bookingApi;
        _seatsApi = seatsApi;
        _voucherApi = voucherApi;
        _creditService = creditService;
        _callCentreService = callCentreService;
        _sharedServicesVouchersService = sharedServicesVouchersService;
        _sharedServicesAccountService = sharedServicesAccountService;
        _sharedServicesBookingService = sharedServicesBookingService;
        _marketSettings = marketSettings.Value;
    }

    [SuppressMessage("Security", "CA5394:Do not use insecure randomness", Justification = "Don't need secure randomness to shuffle offers")]
    public async Task<Offer[]> GetOffers(BookingCreationParams bookingParams)
    {
        var request = BuildPackagesRequest(bookingParams);
        var response = await _searchApi.GetPackages(request, GetLanguageCookie());
        var packages = MapApiResponseToPayloadOrThrowException(response, "packages search failed");
        //travel gate accoms cannot be booked in test environments
        var allOffers = packages.Offers.Where(x => GetAccomContractType(x.Accom.Code) != AccomContractType.TravelGate).ToArray();

        if (allOffers.Length == 0)
            throw new BookingException("no offers found");

        if (bookingParams.ContractType is AccomContractTypeUI.Any)
            return allOffers;

        var contractType = bookingParams.ContractType == AccomContractTypeUI.Direct ? AccomContractType.Direct : AccomContractType.HotelBeds;
        var filteredOffers = allOffers.Where(x => GetAccomContractType(x.Accom.Code) == contractType).ToArray();

        if (filteredOffers.Length == 0)
            throw new BookingException($"no {contractType} offers found");

        return filteredOffers;
    }

    private static AccomContractType GetAccomContractType(string accomCode)
    {
        if (accomCode.StartsWith('X'))
            return AccomContractType.HotelBeds;

        if (accomCode.StartsWith('Z'))
            return AccomContractType.TravelGate;

        return AccomContractType.Direct;
    }

    public async Task<AlternativeFlightsResponse> GetAlternativeFlights(Offer offer)
    {
        var altFlightsRequest = BuildAlternativeFlightsRequest(offer);
        var apiResponse = await _searchApi.GetAlternativeFlights(altFlightsRequest);

        var flights = MapApiResponseToPayloadOrThrowException(apiResponse, "alternative flights search failed");

        // alternative flights response also contains original flight
        if (flights.Offers.IsNullOrEmpty() || flights.Offers.Count == 1)
            throw new BookingException("no alternative flights found");

        return flights;
    }

    public async Task<RoomVariantsSearchResponse> GetAlternativeRoomsAndBoards(Offer offer)
    {
        var altRoomsAndBoardsRequest = BuildRoomAndBoardSearchRequest(offer);
        var apiResponse = await _searchApi.OffersAlterations(altRoomsAndBoardsRequest);

        var roomsAndBoards =
            MapApiResponseToPayloadOrThrowException(apiResponse, "alternative rooms and boards search failed");

        // alt rooms response contains original room
        if (roomsAndBoards.Rooms.IsNullOrEmpty() || roomsAndBoards.Rooms.First().Count() == 1)
            throw new BookingException("no alternative rooms found");

        // alt rooms response doesn't contain original board
        if (roomsAndBoards.AltBoards.IsNullOrEmpty())
            throw new BookingException("no alternative boards found");

        return roomsAndBoards;
    }

    public async Task<ValidateBookingResponse> ValidatePackage(Offer offer, BookingCreationParams bookingParams,
        List<SeatMap>? seatSelection = null, Agent? agent = null, bool isTradePortal = false)
    {
        var validateRequest = new ValidateBookingRequest()
        {
            ExtraLuggageInfo = offer.ExtraLuggageInfo.DeepClone(),
            Offer = offer,
            Guests = CreateGuests(bookingParams),
            DiscountCode = bookingParams.Promocode,
            SeatSelection = seatSelection
        };
        string? cookies = CombineCookies(agent?.AgentCredentials.LoginCookie, GetLanguageCookie());;
        
        if (agent?.AgentCredentials.SsoBearerAccessToken == null)
        {
            cookies = CombineCookies(agent?.AgentCredentials.LoginCookie, GetLanguageCookie());
        }
        var validateResponse = await _bookingApi.ValidatePackage(validateRequest, cookies, agent?.AgentCredentials.SsoBearerAccessToken, GetSiteHeaderValue(isTradePortal));
        return MapApiResponseToPayloadOrThrowException(validateResponse, "validate package failed");
    }

    public async Task<BookingResponse> CommitBooking(Offer offer, ValidateBookingResponse validateResponse,
        BookingCreationParams bookingParams, Customer? customer, Payment? payment, Agent? agent, bool isTradePortal = false)
    {
        if (isTradePortal)
        {
            var offerPriceWithTradeAgentCharges = validateResponse.PaymentInfo.BalanceDueAmount +
                                                  validateResponse.PaymentInfo.AgentComission +
                                                  validateResponse.PaymentInfo.CommissionIncludingVAT;
            offer.Price = offerPriceWithTradeAgentCharges;
        }
        else
        {
            offer.Price = validateResponse.PaymentInfo.BalanceDueAmount;
        }
        
        
        string? cookies = CombineCookies(customer?.Credentials?.LoginCookie ?? agent?.AgentCredentials.LoginCookie,
            GetLanguageCookie());;
        
        if (agent?.AgentCredentials.SsoBearerAccessToken.IsNullOrEmpty() ?? true)
        {
            cookies = CombineCookies(customer?.Credentials?.LoginCookie ?? agent?.AgentCredentials.LoginCookie,
                GetLanguageCookie());
        }
        var commitRequest = BuildBookingCommitRequest(offer, validateResponse, bookingParams, customer, payment, agent);
        var commitResponse = await _bookingApi.Commit(commitRequest, Guid.NewGuid().ToString(),
            cookies, agent?.AgentCredentials.SsoBearerAccessToken, GetSiteHeaderValue(isTradePortal));
        return MapApiResponseToPayloadOrThrowException(commitResponse, "commit booking failed");
    }
    
    private static string? GetSiteHeaderValue(bool isTradePortal) => isTradePortal ? "TradePortal" : null;

    public async Task<List<SeatMapSeat>> GetSeats(Route route, BookingCreationParams bookingParams)
    {
        int seatsNumber = bookingParams.PayingCustomersCount;
        var marketCode = _marketSettings.Markets.First(x => x.Value.Languages.Contains(_language)).Key;
        var market = _marketSettings.Markets[marketCode];

        var seatsRequest = new GetSeatsMapRequest(route, market?.Currency);
        var seatMap = await _seatsApi.Seats(seatsRequest);
        var seats = seatMap
            .GetAvailableSeats(seatsNumber, bookingParams.InfantsNumber > 0, bookingParams.SeatsPriceBand).ToList();

        if (seats.Count < seatsNumber)
            throw new BookingException("unable to book seats");

        return seats;
    }

    public async Task<bool> IsPromocodeValid(string promocode)
    {
        var validateResponse = await _voucherApi.ValidateVoucher(promocode);
        return validateResponse.IsSuccessStatusCode && validateResponse.Content.VoucherType == "PROMO_VOUCHER";
    }

    public void SetLanguage(string language)
    {
        _language = language;
    }

    private string GetLanguageCookie()
    {
        return CookiesHelper.BuildCookieString("holidays#lang", _language);
    }

    private GetPackagesRequest BuildPackagesRequest(BookingCreationParams bookingParams)
    {
        var faker = new Faker();
        var packageFaker = new GetPackagesRequestFaker();
        var fakedSearchRequest = packageFaker.Generate();

        var marketCode = _marketSettings.Markets.First(x => x.Value.Languages.Contains(_language)).Key;

        var request = new GetPackagesRequest()
        {
            StartDate =
                bookingParams.StartDate ?? fakedSearchRequest.StartDate,
            Duration = bookingParams.Duration,
            Departure = bookingParams.Departure ?? faker.PickRandom(OfferConstants.DepartureAirportList[marketCode]),
            Geography = fakedSearchRequest.Geography,
            OriginalGeography = fakedSearchRequest.OriginalGeography,
            Destinations = fakedSearchRequest.Destinations,
            Adults = bookingParams.AdultsNumber,
            Children = bookingParams.ChildrenNumber,
            Infants = bookingParams.InfantsNumber,
            Take = 20,
            Page = 1,
            SearchType = fakedSearchRequest.SearchType,
            PlacementId = fakedSearchRequest.PlacementId,
            PriceFrom = bookingParams.PriceFrom,
            PriceTo = bookingParams.PriceTo,
#pragma warning disable CS8601 // Possible null reference assignment.
            Themes = bookingParams.Theme,
            InitialThemes = bookingParams.Theme,
#pragma warning restore CS8601 // Possible null reference assignment.
            OrderBy = "random",
            PromCollection = bookingParams.PromoCollection
        };

        return request;
    }

    private static AlternativeFlightsSearchRequest BuildAlternativeFlightsRequest(Offer offer)
    {
        return new AlternativeFlightsSearchRequestDecorator
        {
            StartDate = offer.Accom.Date.ToString("yyyy-MM-dd"),
            FlexibleDays = 0,
            Duration = new List<int> { offer.Accom.Stay },
            Departure = offer.Transport.Routes[0].DepPt,
            Adults = offer.Accom.Unit.Sum(x => x.Occupation.Adults),
            Infants = offer.Accom.Unit.Sum(x => x.Occupation.Infants),
            Children = offer.Accom.Unit.Sum(x => x.Occupation.Children),
            RoomCode = offer.Accom.Unit[0].Code,
            AccommodationId = offer.Accom.Id,
            BoardType = offer.Accom.Unit[0].BoardType.Code,
            WithHotels = false,
            OriginalAirport = offer.Transport.Routes[0].DepPt
        };
    }

    private static RoomVariantsSearchRequest BuildRoomAndBoardSearchRequest(Offer offer)
    {
        return new RoomVariantsSearchRequestDecorator
        {
            StartDate = offer.Accom.Date.ToString("yyyy-MM-dd"),
            FlexibleDays = 0,
            Duration = new List<int> { offer.Accom.Stay },
            Departure = offer.Transport.Routes[0].DepPt,
            Adult = offer.Accom.Unit.Sum(x => x.Occupation.Adults),
            Infant = offer.Accom.Unit.Sum(x => x.Occupation.Infants),
            Children = offer.Accom.Unit.Sum(x => x.Occupation.Children),
            RoomCode = offer.Accom.Unit[0].Code,
            AccommodationId = offer.Accom.Id,
            OutboundRouteId = offer.Transport.Routes[0].Id,
            InboundRouteId = offer.Transport.Routes[1].Id,
            PackageId = offer.Accom.PackageId,
            BoardType = offer.Accom.Unit[0].BoardType.Code
        };
    }

    private BookingRequest BuildBookingCommitRequest(Offer offer, ValidateBookingResponse validateResponse,
        BookingCreationParams bookingParams, Customer? customer, Payment? payment, Agent? agent)
    {
        var customerInfo = customer?.Info ?? agent?.CustomerInfo;
        var paymentInfo =
            MapPaymentToPaymentInfo(payment, bookingParams.PayingCustomersCount, validateResponse, customer, agent);
        var leadPassenger = customerInfo!.MapToLeadPassenger();

        return new BookingRequest
        {
            DeviceId = Guid.NewGuid().ToString(),
            Offer = offer,
            SeatSelection = validateResponse.SeatSelection,
            LeadPassenger = leadPassenger,
            Guests = CreateGuestsWithDetails(bookingParams, customerInfo!),
            PaymentInfo = paymentInfo,
            BrowserInfo = BrowserInfoConstants.DefaultBrowserInfo(),
            DiscountCode = bookingParams.Promocode,
            ExtraLuggageInfo = validateResponse.ExtraLuggageInfo.DeepClone(),
            AirportParking = validateResponse.AirportParking.DeepClone()
        };
    }

    private List<PersonWithDetails> CreateGuestsWithDetails(BookingCreationParams bookingParams, CustomerInfo customerInfo)
    {
        List<PersonWithDetails> guests =
        [
            customerInfo.MapToPersonWithDetails(true),
            .. _adultFaker.Generate(bookingParams.AdultsNumber - 1),
            .. _childFaker.Generate(bookingParams.ChildrenNumber),
            .. _infantFaker.Generate(bookingParams.InfantsNumber),
        ];
        return guests;
    }

    private static List<Person> CreateGuests(BookingCreationParams bookingParams)
    {
        List<Person> guests =
        [
            .. Enumerable.Range(0, bookingParams.AdultsNumber)
                .Select(_ => new Person { Age = 30, Sex = Sex.Unknown, Type = PersonType.Adult }),
            .. Enumerable.Range(0, bookingParams.ChildrenNumber)
                .Select(_ => new Person { Age = 10, Sex = Sex.Unknown, Type = PersonType.Child }),
            .. Enumerable.Range(0, bookingParams.InfantsNumber)
                .Select(_ => new Person { Age = 1, Sex = Sex.Unknown, Type = PersonType.Infant }),
        ];
        return guests;
    }

    public static T MapApiResponseToPayloadOrThrowException<T>(ApiResponse<T> apiResponse, string errorMessage)
        where T : class
    {
        if (apiResponse.IsSuccessStatusCode)
            return apiResponse.Content;

        if (apiResponse.Error.Content is null)
        {
            var attempt =
                new BookingAttempt("Empty error response") { HttpStatusCode = (int)apiResponse.Error.StatusCode };
            throw new BookingException(attempt);
        }

        var apiErrorResponse = JsonConvert.DeserializeObject<ApiErrorResponse>(apiResponse.Error.Content);

        if (apiErrorResponse is null)
        {
            var attempt =
                new BookingAttempt("Unable to deserialize api error response")
                {
                    HttpStatusCode = (int)apiResponse.StatusCode
                };
            throw new BookingException(attempt);
        }

        var apiCall = new BookingAttempt(errorMessage)
        {
            CorrelationId = apiErrorResponse.CorrelationId,
            Error = apiErrorResponse.Error,
            HttpStatusCode = (int)apiResponse.StatusCode,
            InnerErrors = apiErrorResponse.InnerErrors,
        };

        throw new BookingException(apiCall);
    }

    private PaymentInfo MapPaymentToPaymentInfo(Payment? payment, int payingCustomers,
        ValidateBookingResponse validateResponse, Customer? customer, Agent? agent)
    {
        var amount = validateResponse.PaymentInfo.BalanceDueAmount;
        const int DefaultDepositPerPerson = 60;

        if (agent != null)
        {
            return new CardPaymentInfo()
            {
                Amount = 0,
                CreditAmount = 0,
            };
        }

        if (payment is null)
            return PaymentInfoConstants.CreatePaymentInfo(amount);

        return (payment.PaymentOption, payment.PaymentCompletion) switch
        {
            (PaymentOption.CARD, PaymentCompletion.FULLY_PAID) =>
                PaymentInfoConstants.CreatePaymentInfo(amount),
            (PaymentOption.CARD, PaymentCompletion.DEPOSIT) =>
                PaymentInfoConstants.CreatePaymentInfo(DefaultDepositPerPerson * payingCustomers),
            (PaymentOption.CREDIT, PaymentCompletion.FULLY_PAID) =>
                PaymentInfoConstants.CreditOnlyPaymentInfo(amount),
            (PaymentOption.CREDIT, PaymentCompletion.DEPOSIT) =>
                PaymentInfoConstants.CreditOnlyPaymentInfo(DefaultDepositPerPerson * payingCustomers),
            (PaymentOption.CARD_AND_CREDIT, PaymentCompletion.FULLY_PAID) =>
                PaymentInfoConstants.CreatePaymentInfo(amount, 100),
            (PaymentOption.CARD_AND_CREDIT, PaymentCompletion.DEPOSIT) =>
                PaymentInfoConstants.CreatePaymentInfo(DefaultDepositPerPerson * payingCustomers,
                    (DefaultDepositPerPerson * payingCustomers) / 2),
            (PaymentOption.CUSTOM, PaymentCompletion.DEPOSIT) =>
                CustomPaymentInfo(validateResponse.Currency.Code, validateResponse.Currency.Code,
                    DefaultDepositPerPerson * payingCustomers, validateResponse.BookingReference, payment, customer!,
                    payment.ClearVouchers),
            (PaymentOption.CUSTOM, PaymentCompletion.FULLY_PAID) =>
                CustomPaymentInfo(validateResponse.Currency.Code, validateResponse.Currency.Code, amount,
                    validateResponse.BookingReference, payment, customer!, payment.ClearVouchers),
            _ =>
                PaymentInfoConstants.CreatePaymentInfo(amount),
        };
    }

    private static string CombineCookies(params string?[] cookies)
    {
        return string.Join("; ", cookies.Where(x => !string.IsNullOrEmpty(x)));
    }

    private PaymentInfo CustomPaymentInfo(string? currency, string bookingCurrency, decimal amount,
        string? bookingReference, Payment payment, Customer customer, bool clearVouchers)
    {
        try
        {
            var email = customer.Info.Email ?? "";
            var customerIdentifiers =
                _sharedServicesAccountService.CustomerIdentifiers(customer.Credentials.LoginCookie).GetAwaiter()
                    .GetResult();
            var voucherCustomer = _sharedServicesVouchersService.GetOrCreate(new GetOrCreateRequest()
            {
                CustomerId = customerIdentifiers.MappedId,
                CustomerDetails = new easyJet.Holidays.Api.Domain.Data.Authentication.CustomerDetails()
                {
                    Email = customer.Info.Email,
                    Id = customerIdentifiers.Id,
                    Address1 = customer.Info.Address1,
                    Address2 = customer.Info.Address2,
                    City = customer.Info.City,
                    Title = customer.Info.Title,
                    CountryCode = customer.Info.CountryCode,
                    DialingCode = customer.Info.DialingCode,
                    FirstName = customer.Info.FirstName,
                    LastName = customer.Info.LastName,
                    MailingsFlag = customer.Info.MailingsFlag,
                    MobilePhone = customer.Info.MobilePhone,
                    PostalCode = customer.Info.PostalCode,
                    easyJetMailingsFlag = customer.Info.EasyJetMailingsFlag,
                }
            }).GetAwaiter().GetResult();
            var customerCreditHistory =
                _creditService.GetCustomerCreditInfo(customer.Credentials).GetAwaiter().GetResult().ToList();
            while (customerCreditHistory.Any(x => x.Balance > 0) && clearVouchers)
            {
                var creditInfo = customerCreditHistory.First(x => x.Balance > 0);
                _sharedServicesBookingService.Redeem(new RedeemRequest()
                {
                    BookingReference = "TestApi",
                    Amount = creditInfo.Balance,
                    Currency = creditInfo.Currency,
                    CustomerId = customerIdentifiers.MappedId,
                    AccomCode = "TestApi",
                    RedemptionMetadata = new(),
                    BookingMarketCode = "TestApi",
                }).GetAwaiter().GetResult();
                customerCreditHistory =
                    _creditService.GetCustomerCreditInfo(customer.Credentials).GetAwaiter().GetResult().ToList();
            }

            if ((payment.OneTimeCreditPercent ?? 0) > 0)
            {
                CreateCredit("onetimeuse", amount, payment.OneTimeCreditPercent, bookingCurrency, bookingReference,
                        email, customer)
                    .GetAwaiter().GetResult();
            }

            if ((payment.GoodWillCreditPercent ?? 0) > 0)
            {
                CreateCredit("goodwill", amount, payment.GoodWillCreditPercent, bookingCurrency, bookingReference,
                        email, customer)
                    .GetAwaiter().GetResult();
            }

            if ((payment.RefundCreditPercent ?? 0) > 0)
            {
                CreateCredit("refund", amount, payment.RefundCreditPercent, bookingCurrency, bookingReference, email,
                        customer)
                    .GetAwaiter().GetResult();
            }

            if ((payment.GiftCardCreditPercent ?? 0) > 0)
            {
                CreateCredit("giftcard", amount, payment.GiftCardCreditPercent, bookingCurrency, bookingReference,
                        email, customer)
                    .GetAwaiter().GetResult();
            }

            var customerCreditHistoryAfter =
                _creditService.GetCustomerCreditInfo(customer.Credentials).GetAwaiter().GetResult();
            return PaymentInfoConstants.CreatePaymentInfo(amount,
                Math.Min(customerCreditHistoryAfter.First().Balance, amount), currency);
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            throw;
        }
    }

    private static decimal GetAmount(decimal amount, decimal? percentage) =>
        RoundUpValue(amount * (percentage ?? 0) / 100, 2);

    private static decimal RoundUpValue(decimal value, int decimalPoint)
    {
        var result = Math.Round(value, decimalPoint);
        if (result < value)
        {
            result += (decimal)Math.Pow(10, -decimalPoint);
        }

        return result;
    }

    private async Task CreateCredit(string reason, decimal amount, decimal? percentage, string bookingCurrency,
        string? bookingReference, string email, Customer customer)
    {
        var created = false;
        var historyTry = 10;
        while (!created)
        {
            var creditInfo = await _callCentreService.AddCredits(
                new easyJet.Holiday.IntegrationTests.Shared.Models.CallCentre.AddCreditsRequest()
                {
                    Currency = bookingCurrency,
                    Amount = GetAmount(amount, percentage),
                    BookingReference = bookingReference ?? "TestAPiUiBookingCreation",
                    EmailAddress = email,
                    Reason = reason
                });
            while (historyTry > 0)
            {
                var customerCreditHistory =
                    await _creditService.GetCustomerCreditInfo(customer.Credentials);
                if (customerCreditHistory.Sum(x => x.Balance) <
                    GetAmount(amount, percentage))
                {
                    await Task.Delay(200);
                    historyTry--;
                }
                else
                {
                    historyTry = 0;
                }
            }

            if (creditInfo.Balance >= GetAmount(amount, percentage))
            {
                created = true;
            }
        }
    }

    private enum AccomContractType
    {
        Direct, HotelBeds, TravelGate
    }
}
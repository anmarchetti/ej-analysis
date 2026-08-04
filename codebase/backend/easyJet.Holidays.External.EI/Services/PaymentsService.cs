using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Exceptions.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.Payment;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.EI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Globalization;
using System.Net.NetworkInformation;
using System.Net.Sockets;

namespace easyJet.Holidays.External.EI.Services.Payment
{
    public class PaymentsService : IPaymentsService
    {
        private readonly IApiService _apiService;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly HeadersSettings _headerSettings;
        private readonly ILogger<PaymentsService> _logger;
        private readonly PaymentsSettings _paymentSettings;
        private readonly IMarketService _marketService;

        public PaymentsService(
            IApiService apiService,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            IOptions<PaymentsSettings> paymentSettings,
            ILogger<PaymentsService> logger,
            IOptions<HeadersSettings> headerSettings,
            IMarketService marketService
            )
        {
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _paymentSettings = paymentSettings.Value ?? throw new ArgumentNullException(nameof(paymentSettings)); ;
            _headerSettings = headerSettings.Value ?? throw new ArgumentNullException(nameof(headerSettings));
            _marketService = marketService;
        }

        public async Task<Holidays.Api.Domain.Data.Payment.MakePaymentResponse> MakePayment(BookingAccommodation accom, PriceInfo paymentInfo, BookingRequest bookingRequest, string bookingReference, string sessionId, MarketSettings market)
        {
            ArgumentNullException.ThrowIfNull(bookingRequest);
            
            try
            {
                MakePaymentRequest paymentRequest = PrepareMakePaymentModel(accom, paymentInfo, bookingRequest, bookingReference, market);

                var response = await _apiService.GetResponseContentAsyncWithErrorMapping<
                    MakePaymentRequest, Models.MakePaymentResponse>(paymentRequest, ApiExceptionCodes.PaymentError);

                var body = response.Payload.Body;
                var result = new easyJet.Holidays.Api.Domain.Data.Payment.MakePaymentResponse
                {
                    ResultCode = body.ResultCode,
                    AuthCode = body.TransactionDetail.AuthCode,
                    TransNo = body.TransactionDetail.TransactionId,
                    TransactionTime = body.TransactionDetail.TransactionTime,
                    PayDetails = body.TransactionDetail.Provider,
                    PaymentId = body.PaymentId,
                    PaymentMethodTypeCode = body.PaymentMethodTypeCode,

                    Amount = body.Amount.Value.Value,
                    Currency = body.Amount.CurrencyCode,
                    CardNumber = body.TransactionDetail?.Card?.CardNumber
                };

                var threeDs2Data = body.PayerAuthToken?.ThreeDS2Data?.Data;
                var threeDsServerTransId = threeDs2Data?.FirstOrDefault(kv => kv.Key == "threeDSServerTransID")?.Value;

                if (body.ResultCode == PaymentResultCode.IDENTIFY)
                {
                    result.ThreeDSServerTransID = threeDsServerTransId;
                    result.TransactionReference = body.TransactionDetail.TransactionReference;
                    result.ThreeDSMethodURL = threeDs2Data?.FirstOrDefault(kv => kv.Key == "threeDSMethodURL")?.Value;
                    result.MethodNotificationURL = _paymentSettings.ThreeDSCallbackHost + _paymentSettings.IdentifyNotificationUrl;
                }

                if (body.ResultCode == PaymentResultCode.CHALLENGE)
                {
                    result.ThreeDSServerTransID = threeDsServerTransId;
                    result.TransactionReference = body.TransactionDetail.TransactionReference;
                    result.AcsTransID = threeDs2Data?.FirstOrDefault(kv => kv.Key == "acsTransID")?.Value;
                    result.MessageVersion = threeDs2Data?.FirstOrDefault(kv => kv.Key == "messageVersion")?.Value;
                    result.AcsURL = threeDs2Data?.FirstOrDefault(kv => kv.Key == "acsURL")?.Value;
                }

                if (body.ResultCode == PaymentResultCode.REDIRECT)
                {
                    result.IssuerUrl = body.PayerAuthToken?.IssuerUrl;
                    result.Md = body.PayerAuthToken?.Md;
                    result.PaReq = body.PayerAuthToken?.PaReq;
                    result.TermUrl = _paymentSettings.ThreeDSCallbackHost + _paymentSettings.ThreeDSOneNotificationUrl;
                }

                return result;
            }
            catch (ApiException ex)
            {
                throw new PaymentGatewayException("Failed to make payment for the booking", bookingReference, sessionId, ex.InnerErrors, ex);
            }
            catch (Exception ex)
            {
                throw new PaymentGatewayException("Something terribly wrong has happened", bookingReference, sessionId, null, ex);
            }
        }

        /// <summary>
        /// Returns whether payment request is first or after 3DS challenge
        /// </summary>
        /// <param name="bookingRequest"></param>
        /// <returns></returns>
        private static bool IsFirstRequest(BookingRequest bookingRequest)
        {
            if (bookingRequest.PaymentInfo.PaymentType == PaymentType.ApplePay)
            {
                return true;
            }
            
            CardPaymentInfo paymentInfo = bookingRequest.PaymentInfo.AsCardPayment();
            
            return string.IsNullOrEmpty(paymentInfo.ThreeDSServerTransID)
                   && string.IsNullOrEmpty(paymentInfo.Md);
        }

        /// <summary>
        /// Prepare model for makePayment request
        /// </summary>
        /// <param name="accom"></param>
        /// <param name="paymentInfo"></param>
        /// <param name="bookingRequest">commit booking request</param>
        /// <param name="bookingReference">booking reference if exists</param>
        /// <param name="market"></param>
        /// <returns></returns>
        private MakePaymentRequest PrepareMakePaymentModel(BookingAccommodation accom,
            PriceInfo paymentInfo, BookingRequest bookingRequest, string bookingReference, MarketSettings market)
        {
            switch (bookingRequest.PaymentInfo.PaymentType)
            {
                case PaymentType.CreditDebitCard:
                    return PrepareMakePaymentModelForCardPayment(accom, paymentInfo, bookingRequest, bookingReference, market);
                    
                case PaymentType.ApplePay:
                    return PrepareMakePaymentModelForApplePayPayment(accom, paymentInfo, bookingRequest, bookingReference, market);
                    
                default:
                    throw new InvalidPaymentTypeException("PaymentInfo is not valid");
            }
        }

        /// <summary>
        /// Prepare model for makePayment request
        /// </summary>
        /// <param name="accom"></param>
        /// <param name="paymentInfo"></param>
        /// <param name="bookingRequest">commit booking request</param>
        /// <param name="bookingReference">booking reference if exists</param>
        /// <param name="market"></param>
        /// <returns></returns>
        private MakePaymentRequest PrepareMakePaymentModelForCardPayment(BookingAccommodation accom, PriceInfo paymentInfo, BookingRequest bookingRequest, string bookingReference, MarketSettings market)
        {
            CardPaymentInfo reqPaymentInfo = bookingRequest.PaymentInfo.AsCardPayment();
            
            (string billingFirstName, string billingLastName) = SplitFullName(reqPaymentInfo.BillingInfo.FullName);
            
            (int expirationMonth, int expirationYear) = ParseExpirationDate(reqPaymentInfo.ExpirationDate);

            (decimal? amount, decimal? amountDue, decimal? receivedAmount) =
                CalculateAmounts(reqPaymentInfo.Amount, paymentInfo);

            (string transactionStatus, string completionIndicator) = Get3DSIndicators(reqPaymentInfo);

            MakePaymentRequestPaymentDetail paymentDetailForCard = MakePaymentRequestPaymentDetailForCard(completionIndicator, transactionStatus, reqPaymentInfo, billingFirstName, billingLastName, expirationMonth, expirationYear);
            
            MakePaymentRequest paymentRequest = new ();
            paymentRequest.Endpoint = _endpointsProvider.GetEndpoint(PaymentEndpoint.MakePayment, _httpContextAccessor.HttpContext.Request.Cookies);
            paymentRequest.Payload.Body = MakePaymentRequestBody(accom, paymentInfo, bookingRequest, bookingReference, market, amountDue, receivedAmount, amount, paymentDetailForCard);

            return paymentRequest;
        }

        private MakePaymentRequestBody MakePaymentRequestBody(BookingAccommodation accom, PriceInfo paymentInfo, BookingRequest bookingRequest, string bookingReference, MarketSettings market, decimal? amountDue, decimal? receivedAmount, decimal? amount, MakePaymentRequestPaymentDetail paymentDetailForCard)
        {
            return new MakePaymentRequestBody()
            {
                ClientData = new MakePaymentRequestClientData()
                {
                    ApiKey = _paymentSettings.ApiKey,
                    IpAddress = GetClientIpAddress(),
                    // Please include the transaction Id in the FIRST payment request only (as this is the point where we'll fraud screen)
                    DeviceId = IsFirstRequest(bookingRequest) ? bookingRequest.DeviceId : string.Empty,
                    ProfileId = string.Empty,
                    EmailAddress = bookingRequest.LeadPassenger.Email,
                    PhoneNumber = bookingRequest.LeadPassenger.Phone,
                },
                OrderData = new OrderData
                {
                    AgentType = "WEB",
                    CreateDateTime = DateFormatUtils.Iso8601(DateTime.UtcNow),
                    AmountDue = amountDue,
                    ReceivedAmount = receivedAmount
                },
                Lodging = new Lodging
                {
                    new LodgingInner
                    {
                        Address = new Address
                        {
                            Address1 = accom?.Hotel?.Address,
                            City = accom?.Hotel?.City,
                            StateProvince = accom?.Hotel?.Location?.Name,
                            Country = accom?.Hotel?.Country?.Code
                        },
                        Name = accom?.Hotel?.Name,
                        Rating = accom?.Hotel?.StarRating,
                        CheckInDate = accom?.StartDate,
                        CheckOutDate = accom?.EndDate,
                        Id = accom?.Code,
                        BasePrice = paymentInfo.TotalPrice,
                        Rooms = accom?.Rooms.Select(r => new Room
                        {
                            Stay = r.Board,
                            StayDetail = r.BoardName,
                            //Code = r.Code != null ? r.Code.Substring(0, Math.Min(r.Code.Length, 20)) : string.Empty,
                            PaxPrices = r.PaxPrices.Select(pp => new PaxPrice
                            {
                                Id = pp.PaxIndex,
                                BasePrice = (decimal)pp.Price
                            }).ToList()
                        }).ToList()
                    }
                },
                AirlineData = new MakePaymentRequestAirlineData
                {
                    BookingReferenceNumber = bookingReference,
                    FlightDetails = new MakePaymentRequestAirlineDataFlightDetails
                    {
                        Sector = bookingRequest.Offer.Transport.Routes.Select(r => new MakePaymentRequestAirlineDataFlightDetailsSector
                        {
                            DepartureAirportCode = r.DepPt,
                            ArrivalAirportCode = r.ArrPt,
                            DateOfTravel = DateFormatUtils.Iso8601(r.DepDate),
                            FlightNumber = r.FltNo
                        }).ToList()
                    },
                    Passengers = new MakePaymentRequestAirlineDataPassengers
                    {
                        Passenger = bookingRequest.Guests.Select(g => new MakePaymentRequestAirlineDataPassengersPassenger
                        {
                            Id = g.Index,
                            FirstName = g.FirstName,
                            LastName = g.LastName,
                            Gender = g.Title?.ToUpperInvariant() == "MR" ? "Male" : "Female",
                            Age = g.Age
                        }).ToList()
                    }
                },
                Amount = new MakePaymentRequestAmount()
                {
                    Value = amount,
                    CurrencyCode = paymentInfo.Currency ?? "GBP"
                },
                BrowserInfo = new MakePaymentRequestBrowserInfo()
                {
                    AcceptHeader = bookingRequest.BrowserInfo.AcceptHeader,
                    ColourDepth = bookingRequest.BrowserInfo.ColourDepth,
                    JavaEnabled = bookingRequest.BrowserInfo.JavaEnabled,
                    JavaScriptEnabled = bookingRequest.BrowserInfo.JavaScriptEnabled,
                    Language = bookingRequest.BrowserInfo.Language,
                    ScreenHeight = bookingRequest.BrowserInfo.ScreenHeight,
                    ScreenWidth = bookingRequest.BrowserInfo.ScreenWidth,
                    TimeZoneOffset = bookingRequest.BrowserInfo.TimeZoneOffset,
                    UserAgent = bookingRequest.BrowserInfo.UserAgent
                },
                Channel = _paymentSettings.Channel,
                DepartureCountry = market?.CountryCode,
                DepartureDate = DateFormatUtils.Iso8601(bookingRequest.Offer.Transport.Routes[0].DepDate),
                Market = market?.Code,
                PaymentDetail = paymentDetailForCard,
                Reference = bookingReference
            };
        }

        private MakePaymentRequestPaymentDetail MakePaymentRequestPaymentDetailForCard(string completionIndicator,
            string transactionStatus, CardPaymentInfo reqPaymentInfo, string billingFirstName, string billingLastName,
            int expirationMonth, int expirationYear)
        {
            MakePaymentRequestPaymentDetail paymentDetailForCard = new MakePaymentRequestPaymentDetail()
            {
                AuthData = new AuthData()
                {
                    CustomerServiceUrl = _paymentSettings.CustomerServiceUrl,
                    ChallengeNotificationUrl =
                        _paymentSettings.ThreeDSCallbackHost + _paymentSettings.ChallengeNotificationUrl,
                    CompletionIndicator = completionIndicator,
                    TransactionStatus = transactionStatus
                },
                Card = new Card()
                {
                    BillingAddress = new CardBillingAddress()
                    {
                        Address1 = reqPaymentInfo.BillingInfo.Address,
                        Address2 = reqPaymentInfo.BillingInfo.Address2,
                        City = reqPaymentInfo.BillingInfo.City,
                        PostalCode = reqPaymentInfo.BillingInfo.PostCode,
                        //Country = bookingRequest.LeadPassenger.CountryCode,
                        FirstName = billingFirstName,
                        LastName = billingLastName
                    },
                    CardNumber = reqPaymentInfo.CardNumber,
                    CardSecurityNumber = reqPaymentInfo.CVV,
                    ExpiryMonth = new int?(expirationMonth),
                    ExpiryYear = new int?(expirationYear),
                    NameOnCard = reqPaymentInfo.NameOnCard,
                    IssueNumber = reqPaymentInfo.IssueNumber,
                    PayerAuthToken = !string.IsNullOrEmpty(reqPaymentInfo.PaRes) ||
                                     !string.IsNullOrEmpty(reqPaymentInfo.Md)
                        ? new PayerAuthToken
                        {
                            Md = reqPaymentInfo.Md,
                            PaRes = GetPaRes(reqPaymentInfo),
                            IssuerUrl = reqPaymentInfo.IssuerUrl,
                        }
                        : null,
                },
                PaymentMethod = "Card",
                TransactionReference = reqPaymentInfo.TransactionReference
            };
            return paymentDetailForCard;
        }
        
        private string GetPaRes(CardPaymentInfo reqPaymentInfo)
        {
            // Use error code (ACF) if there was client error or PaRes is not presented
            if (reqPaymentInfo.AuthenticationError || string.IsNullOrEmpty(reqPaymentInfo.PaRes))
            {
                return _paymentSettings.ErrorCodes.Authentication;
            }

            return reqPaymentInfo.PaRes;
        }

        private string GetClientIpAddress()
        {
            var trueIpHeader = _httpContextAccessor.HttpContext.Request.Headers[_headerSettings.TrueIpAddress];
            return !string.IsNullOrWhiteSpace(trueIpHeader)
                ? trueIpHeader.ToString()
                : _httpContextAccessor.HttpContext.Connection?.RemoteIpAddress?.ToString();
        }
        
        private static (string FirstName, string LastName) SplitFullName(string fullName)
        {
            var names = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var firstName = names.Length != 0 ? names[0] : string.Empty;
            var lastName = fullName.Remove(0, firstName.Length == fullName.Length ? firstName.Length : firstName.Length + 1);
            return (firstName, lastName);
        }
        
        private static (int Month, int Year) ParseExpirationDate(string expirationDate)
        {
            var chunks = expirationDate.Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (chunks.Length != 2 ||
                !int.TryParse(chunks[0], out int month) ||
                !int.TryParse(chunks[1], out int year))
            {
                throw new ArgumentException($"Invalid expiration date format: {expirationDate}", nameof(expirationDate));
            }
            
            // payments service requires expiration year to be 4 digits
            // we are not doing this against original string, because of possible 0-padding
            if (year.ToString(CultureInfo.InvariantCulture).Length == 2)
                year += 2000;
            
            return (month, year);
        }
        
        private static (decimal? Amount, decimal? AmountDue, decimal? ReceivedAmount) CalculateAmounts(decimal amount, PriceInfo paymentInfo)
        {
            /*
             * Local Amount = Amount of current transaction
             * Balance/Amount Due = amount still to be paid, excluding the amount of the current payment
             * Amount Received = amount already paid, not including the amount of the current payment
             * Received Amount + Amount + Amount Due = Total Package Amount
             *
             * Example (total is 1000, balanceDue is 200, amount is 150)
             *  Amount			= 150
             *  Amount Due		= 200 - 150 = 50
             *  Received Amount	= 1000-200=800
             * 150+50+800=1000
             */
            var localAmount = new decimal?(amount);
            var amountDue = paymentInfo.BalanceDueAmount - localAmount;
            var receivedAmount = paymentInfo.TotalPrice - paymentInfo.BalanceDueAmount;
            return (localAmount, amountDue, receivedAmount);
        }
        
        private (string TransactionStatus, string CompletionIndicator) Get3DSIndicators(CardPaymentInfo reqPaymentInfo)
        {
            // Transaction & completion statuses
            // ChallengeComplete=true means it's 3DS2 last step. We should use value from bank postback or use CCF error code if it's not presented
            string transactionStatus = reqPaymentInfo.ChallengeComplete
                ? (string.IsNullOrWhiteSpace(reqPaymentInfo.TransStatus) ? _paymentSettings.ErrorCodes.Challenge : reqPaymentInfo.TransStatus)
                : null;
            string completionIndicator = !string.IsNullOrWhiteSpace(reqPaymentInfo.ThreeDSServerTransID) && !reqPaymentInfo.ChallengeComplete ? "Y" : null;
            
            if (reqPaymentInfo.FingerprintError)
            {
                _logger.LogInformation("3DS2 fingerprint step technical error");
                completionIndicator = _paymentSettings.ErrorCodes.Fingerprint;
                transactionStatus = null;
            }
            else if (reqPaymentInfo.ChallengeError)
            {
                _logger.LogInformation("3DS2 challenge step technical error");
                completionIndicator = null;
                transactionStatus = _paymentSettings.ErrorCodes.Challenge;
            }
            else if (reqPaymentInfo.FingerprintTimeout)
            {
                _logger.LogInformation("3DS2 fingerprint timeout error");
                completionIndicator = "N";
            }

            _logger.LogInformation("transactionStatus={TransactionStatus}, completionIndicator={CompletionIndicator}", transactionStatus, completionIndicator);
            return (transactionStatus, completionIndicator);
        }

        /// <summary>
        /// Prepare model for makePayment request
        /// </summary>
        /// <param name="accom"></param>
        /// <param name="paymentInfo"></param>
        /// <param name="bookingRequest">commit booking request</param>
        /// <param name="bookingReference">booking reference if exists</param>
        /// <param name="market"></param>
        /// <returns></returns>
        private MakePaymentRequest PrepareMakePaymentModelForApplePayPayment(BookingAccommodation accom, PriceInfo paymentInfo, BookingRequest bookingRequest, string bookingReference, MarketSettings market)
        {
            ApplePayPaymentInfo reqPaymentInfo = bookingRequest.PaymentInfo.AsApplePayPayment();
            
            (decimal? amount, decimal? amountDue, decimal? receivedAmount) =
                CalculateAmounts(reqPaymentInfo.Amount, paymentInfo);

            MakePaymentRequestPaymentDetail paymentDetailForApplePay = MakePaymentRequestPaymentDetailForApplePay(reqPaymentInfo);
            
            MakePaymentRequest paymentRequest = new ();
            paymentRequest.Endpoint = _endpointsProvider.GetEndpoint(PaymentEndpoint.MakePayment, _httpContextAccessor.HttpContext.Request.Cookies);
            paymentRequest.Payload.Body = MakePaymentRequestBody(accom, paymentInfo, bookingRequest, bookingReference, market, amountDue, receivedAmount, amount, paymentDetailForApplePay);
            
            return paymentRequest;
        }

        private static MakePaymentRequestPaymentDetail MakePaymentRequestPaymentDetailForApplePay(
            ApplePayPaymentInfo reqPaymentInfo)
        {
            MakePaymentRequestPaymentDetail paymentDetailForApplePay = new MakePaymentRequestPaymentDetail()
            {
                PaymentMethod = "ApplePay",
                ApplePay = new ApplePay()
                {
                    CardType = GetApplePayCardType(reqPaymentInfo.Token),
                    Base64Token = ApplePayTokenToBase64(reqPaymentInfo.Token.PaymentData),
                }
            };
            return paymentDetailForApplePay;
        }

        private static string ApplePayTokenToBase64(ApplePayPaymentData paymentData)
        {
            string json = JsonConvert.SerializeObject(paymentData);
            byte[] bytes = System.Text.Encoding.UTF8.GetBytes(json);
            return Convert.ToBase64String(bytes);
        }

        private static string GetApplePayCardType(ApplePayToken token)
        {
            return ApplePayCardType.GetApplePayCardType(
                token.PaymentMethod.Network,
                token.PaymentMethod.Type);
        }

        /// <summary>
        /// Prepare model for makePayment request
        /// </summary>
        /// <param name="bookingRequest">commit booking request</param>
        /// <param name="bookingReference">booking reference if exists</param>
        /// <returns></returns>
        private CancelPaymentRequest PrepareCancelPaymentModel(string bookingReference, string paymentId, string customerEmail)
        {
            CancelPaymentRequest paymentRequest = new CancelPaymentRequest();
            paymentRequest.Endpoint = _endpointsProvider.GetEndpoint(PaymentEndpoint.CancelPayment, _httpContextAccessor.HttpContext.Request.Cookies);
            paymentRequest.Payload.Body = new CancelPaymentRequestBody()
            {
                ClientData = new CancelRequestClientData()
                {
                    ApiKey = _paymentSettings.ApiKey,
                    IpAddress = _httpContextAccessor.HttpContext.Connection?.RemoteIpAddress?.ToString(),
                    DeviceId = string.Empty,
                    ProfileId = string.Empty,
                    EmailAddress = customerEmail
                },
                Channel = _paymentSettings.Channel,
                PaymentId = paymentId,
                Reference = bookingReference
            };

            return paymentRequest;
        }

        /// <summary>
        /// Prepare model for refundPayment request
        /// </summary>
        /// <param name="bookingRequest">commit booking request</param>
        /// <param name="bookingReference">booking reference if exists</param>
        /// <returns></returns>
        private RefundPaymentRequest PrepareRefundPaymentModel(string transactionNo, string paymentId, decimal amount, string currency, string customerEmail)
        {
            RefundPaymentRequest paymentRequest = new RefundPaymentRequest();
            paymentRequest.Endpoint = _endpointsProvider.GetEndpoint(PaymentEndpoint.RefundPayment, _httpContextAccessor?.HttpContext?.Request?.Cookies);
            paymentRequest.Payload.Body = new RefundPaymentRequestBody()
            {
                ClientData = new RefundRequestClientData()
                {
                    ApiKey = _paymentSettings.ApiKey,
                    IpAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? GetLocalIPAddress(),
                    DeviceId = string.Empty,
                    ProfileId = string.Empty,
                    EmailAddress = customerEmail
                },
                Amount = new RefundAmount
                {
                    Value = amount,
                    Currency = currency
                },
                Channel = _paymentSettings.RefundChannel,
                PaymentId = paymentId,
                Reference = transactionNo
            };

            return paymentRequest;
        }

        private string GetLocalIPAddress()
        {
            try
            {
                // order interfaces by speed and filter out down and loopback
                // take first of the remaining
                var firstUpInterface = NetworkInterface.GetAllNetworkInterfaces()
                    .OrderByDescending(c => c.Speed)
                    .FirstOrDefault(c => c.NetworkInterfaceType != NetworkInterfaceType.Loopback && c.OperationalStatus == OperationalStatus.Up);
                if (firstUpInterface != null)
                {
                    var props = firstUpInterface.GetIPProperties();
                    // get first IPV4 address assigned to this interface
                    var firstIpV4Address = props.UnicastAddresses
                        .Where(c => c.Address.AddressFamily == AddressFamily.InterNetwork)
                        .Select(c => c.Address)
                        .FirstOrDefault();

                    return firstIpV4Address.ToString();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Can't get local IP address", ex);
            }

            return string.Empty;
        }

        public async Task<easyJet.Holidays.Api.Domain.Data.Payment.CancelPaymentResponse> CancelPayment(string bookingReference, string paymentId, string customerEmail)
        {
            try
            {
                var cancelRequest = PrepareCancelPaymentModel(bookingReference, paymentId, customerEmail);

                var response = await _apiService.GetResponseContentAsyncWithErrorMapping<
                    CancelPaymentRequest, Models.CancelPaymentResponse>(cancelRequest, ApiExceptionCodes.PaymentError);

                var body = response.Payload.Body;

                var result = new easyJet.Holidays.Api.Domain.Data.Payment.CancelPaymentResponse
                {
                    PaymentId = body.PaymentId
                };

                return result;
            }
            catch (ApiException ex)
            {
                throw new PaymentCancellationException("Failed to cancel payment for the booking", bookingReference, ex.InnerErrors, ex);
            }
            catch (Exception ex)
            {
                throw new PaymentCancellationException("Something terribly wrong has happened", bookingReference, null, ex);
            }
        }

        public async Task<easyJet.Holidays.Api.Domain.Data.Payment.RefundPaymentResponse> RefundPayment(string bookingReference, string paymentId, decimal amount, string currency, string customerEmail)
        {
            try
            {
                RefundPaymentRequest refundRequest = PrepareRefundPaymentModel(bookingReference, paymentId, amount, currency, customerEmail);

                var response = await _apiService.GetResponseContentAsyncWithErrorMapping<
                    RefundPaymentRequest, Models.RefundPaymentResponse>(refundRequest, ApiExceptionCodes.PaymentError);

                var body = response.Payload.Body;

                var result = new easyJet.Holidays.Api.Domain.Data.Payment.RefundPaymentResponse
                {
                    Result = body.TransactionDetail?.Result,
                    Status = body.TransactionDetail?.Status,
                    PaymentId = body.PaymentId
                };

                return result;
            }
            catch (ApiException ex)
            {
                throw new PaymentCancellationException("Failed to refund payment for the booking", bookingReference, ex.InnerErrors, ex);
            }
            catch (Exception ex)
            {
                throw new PaymentCancellationException("Something terribly wrong has happened", bookingReference, null, ex);
            }
        }
    }
}

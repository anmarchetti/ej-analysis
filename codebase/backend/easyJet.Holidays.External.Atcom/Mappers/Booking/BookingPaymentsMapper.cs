using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Exceptions.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.Transliteration;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Models.Internal;
using System.Globalization;

namespace easyJet.Holidays.External.Atcom.Mappers.Booking
{
    public class BookingPaymentsMapper : IBookingPaymentsMapper
    {
        private readonly ITransliterationService _transliterationService;

        public BookingPaymentsMapper(ITransliterationService transliterationService)
        {
            _transliterationService = transliterationService;
        }

        /// <inheritdoc/>
        public Models.Booking.BookingWithPaymentRequest MapModifyCustPaymentRequest(
            PaymentInfo paymentInfo,
            LeadPassenger leadPassenger,
            MakePaymentResponse paymentResponse,
            Models.Booking.BookingRequest atcomRequest,
            string bookingId,
            string authSys,
            bool offline = false)
        {
            var ccPay = MapCCPayFromPaymentResponse(paymentInfo, leadPassenger, paymentResponse, offline);

            var paymentRequest = new Models.Booking.BookingWithPaymentRequest(atcomRequest);

            paymentRequest.Payload.Body.BkgNum = new BkgNum()
            {
                BkgId = bookingId
            };

            paymentRequest.Payload.Body.PayData = new PayData()
            {
                Pay = new[] {
                    new Pay()
                    {
                        Item = ccPay,
                        CurISO = paymentResponse.Currency,
                        AuthCode = paymentResponse.PaymentId,
                        TransNo = paymentResponse.TransNo,
                        PayDetails = paymentResponse.PayDetails,
                        PayDtTmForXml = paymentResponse.TransactionTime,
                        AuthSysSpecified = true,
                        AuthSys = authSys
                    }
                }
            };

            return paymentRequest;
        }

        /// <inheritdoc />
        public Models.Booking.BookingWithPaymentRequest MapCreditModifyCustPaymentRequest(
           decimal amount,
           string bookingId,
           PaymentTypeSettings type,
           Models.Booking.BookingRequest bookingAtcomRequest,
           string voucherId = null)
        {
            var ccPay = new CCPay
            {
                Card_Cd = type.Code,
                CCType = type.Group,
                PayAmt = amount.ToString(CultureInfo.InvariantCulture),
            };

            var paymentRequest = new Models.Booking.BookingWithPaymentRequest(bookingAtcomRequest);
            var body = paymentRequest.Payload.Body;
            // Build transaction ID, should be less than 50 chars
            var fullTransactionId = !string.IsNullOrEmpty(voucherId) ? voucherId : null;
            var transactionId = fullTransactionId?.Substring(0, fullTransactionId.Length > 50 ? 50 : fullTransactionId.Length);

            body.BkgNum = new BkgNum
            {
                BkgId = bookingId
            };

            body.PayData = new PayData
            {
                Pay =
                [
                    new Pay
                    {
                        Item = ccPay,
                        TransNo = transactionId,
                        CurISO = null, // we don't have currency from payment response, use default one
                    }
                ]
            };
            return paymentRequest;
        }

        /// <summary>
        /// Create <see cref="CCPay"/> based on <see cref="PaymentInfo"/>.
        /// </summary>
        /// <param name="paymentInfo"></param>
        /// <param name="leadPassenger"></param>
        /// <param name="paymentResponse"></param>
        /// <param name="offline"></param>
        /// <returns></returns>
        private CCPay MapCCPayFromPaymentResponse(
            PaymentInfo paymentInfo,
            LeadPassenger leadPassenger,
            MakePaymentResponse paymentResponse = null,
            bool offline = false)
        {
            var ccPay = new CCPay();

            if (paymentInfo != null)
            {
                (string nameOnCard, string cardNumber, string expirationDate) = ExtractPaymentInfo(paymentInfo);
                
                var names = nameOnCard?.Split((char[])[' '], StringSplitOptions.RemoveEmptyEntries);
                var firstName = names?.Length > 0 ? names[0] : string.Empty;
                var lastName = nameOnCard?.Remove(0, firstName.Length == nameOnCard.Length ? firstName.Length : firstName.Length + 1);

                var billingInfo = Array.Empty<Add>();
                if (paymentInfo.BillingInfo != null)
                {
                    billingInfo = new[] {
                        new Add()
                        {
                            Name = paymentInfo.BillingInfo.Address,
                            Street = paymentInfo.BillingInfo.Address2,
                            ZipCode = paymentInfo.BillingInfo.PostCode,
                            City = paymentInfo.BillingInfo.City,
                            CountryISOCode = leadPassenger?.CountryCode
                        }
                    };
                }

                ccPay = new CCPay
                {
                    CNum = string.IsNullOrEmpty(cardNumber) ? paymentResponse?.CardNumber : cardNumber,
                    Card_Cd = paymentResponse?.PaymentMethodTypeCode,
                    ExpDate = expirationDate,
                    Payer = new Payer
                    {
                        Person = new Models.Internal.Person
                        {
                            Add = billingInfo,
                            FirstName = _transliterationService.ToEnglish(firstName),
                            LastName = _transliterationService.ToEnglish(lastName)
                        }
                    },
                    PayAmt = paymentResponse?.Amount.ToString(CultureInfo.InvariantCulture)
                };

                if (offline)
                {
                    ccPay.CCType = "OFF";
                    ccPay.Card_Cd = "OFF";
                }
            }

            return ccPay;
        }
        
        private static (string nameOnCard, string cardNumber, string expirationDate) ExtractPaymentInfo(PaymentInfo paymentInfo)
        {
            string nameOnCard;
            string cardNumber;
            string expirationDate;
            switch (paymentInfo.PaymentType)
            {
                case PaymentType.CreditDebitCard:
                    CardPaymentInfo cardPaymentInfo = paymentInfo.AsCardPayment();
                    nameOnCard = cardPaymentInfo.NameOnCard;
                    cardNumber = cardPaymentInfo.CardNumber;
                    expirationDate = cardPaymentInfo.ExpirationDate;
                    break;
                case PaymentType.ApplePay:
                    ApplePayPaymentInfo applePayPaymentInfo = paymentInfo.AsApplePayPayment();
                    nameOnCard = null;
                    string displayName = applePayPaymentInfo.Token.PaymentMethod.DisplayName;
                    string last4 = displayName?.Length >= 4 ? displayName.Substring(displayName.Length - 4) : "XXXX";
                    cardNumber = $"XXXXXXXXXXXX{last4}"; 
                    expirationDate = "12/99";
                    break;
                default:
                    throw new InvalidPaymentTypeException("Invalid payment type");
            }
            return (nameOnCard, cardNumber, expirationDate);
        }


        /// <inheritdoc />
        public Models.Booking.BookingWithPaymentRequest MapModifyCustPaymentRequest(
            string bookingId,
            PaymentHistoryItem paymentItem,
            string refundAgainstId,
            string paymentId,
            Models.Booking.BookingRequest bookingAtcomRequest)
        {
            var isRefund = !string.IsNullOrEmpty(refundAgainstId);

            var ccPay = new CCPay
            {
                CNum = paymentItem.Card?.Number,
                Card_Cd = paymentItem.Card?.Code,
                ExpDate = paymentItem.Card?.ExpDate,
                PayAmt = (isRefund ? -paymentItem.Amount : paymentItem.Amount).ToString(CultureInfo.InvariantCulture)
            };

            var paymentRequest = new Models.Booking.BookingWithPaymentRequest(bookingAtcomRequest);
            var body = paymentRequest.Payload.Body;

            body.BkgNum = new BkgNum
            {
                BkgId = bookingId
            };

            body.PayData = new PayData
            {
                Pay =
                [
                    new Pay
                    {
                        Item = ccPay,

                        CurISO = paymentItem.CurIso,
                        AuthCode = paymentId,
                        TransNo = paymentItem.TransNo,
                        PayDetails = paymentItem.PayDetails,

                        AuthSys = paymentItem.AuthSys,
                        AuthSysSpecified = true,

                        PayDtTm = paymentItem.PayDtTm ?? DateTimeOffset.Now,
                        PayDtTmSpecified = paymentItem.PayDtTm.HasValue,

                        Refund_Against_Id = refundAgainstId
                    }
                ]
            };

            return paymentRequest;
        }
    }
}
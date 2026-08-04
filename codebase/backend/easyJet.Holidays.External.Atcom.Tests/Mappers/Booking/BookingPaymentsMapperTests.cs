using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.Transliteration;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using FluentAssertions;
using Moq;
using System.Collections;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Booking
{
    public class BookingPaymentsMapperTests
    {
        private readonly BookingPaymentsMapper _sut;

        public BookingPaymentsMapperTests()
        {
            var transliterationService = new Mock<ITransliterationService>();
            transliterationService
                .Setup(x => x.ToEnglish(It.IsAny<string>()))
                .Returns<string>(x => x);

            _sut = new BookingPaymentsMapper(transliterationService.Object);
        }

        [Theory]
        [ClassData(typeof(MapModifyCustPaymentRequest_ValidDataData))]
        public void MapModifyCustPaymentRequest_ValidData_ShouldAddBookingReference(BookingRequest request, Holidays.Api.Domain.Data.Payment.MakePaymentResponse paymentResponse, Models.Booking.BookingRequest atcomRequest, string bookingId)
        {
            // Act
            var actual = _sut.MapModifyCustPaymentRequest(request.PaymentInfo, request.LeadPassenger, paymentResponse, atcomRequest, bookingId, "EasyJetPGS", false);

            // Assert
            actual.Payload.Body.BkgNum.BkgId.Should().Be("66609");
        }

        [Theory]
        [ClassData(typeof(MapModifyCustPaymentRequest_ValidDataData))]
        public void MapModifyCustPaymentRequest_ValidData_ShouldAddCardDetails(BookingRequest request, Holidays.Api.Domain.Data.Payment.MakePaymentResponse paymentResponse, Models.Booking.BookingRequest atcomRequest, string bookingId)
        {
            // Act
            var actual = _sut.MapModifyCustPaymentRequest(request.PaymentInfo, request.LeadPassenger, paymentResponse, atcomRequest, "EasyJetPGS", bookingId);

            // Assert
            (actual.Payload.Body.PayData.Pay[0].Item as Models.Internal.CCPay).CNum.Should().Be("1234567890123456");
            (actual.Payload.Body.PayData.Pay[0].Item as Models.Internal.CCPay).ExpDate.Should().Be("10/30");
            (actual.Payload.Body.PayData.Pay[0].Item as Models.Internal.CCPay).PayAmt.Should().Be("15");
        }

        [Theory]
        [ClassData(typeof(MapModifyCustPaymentRequest_ValidDataData))]
        public void MapModifyCustPaymentRequest_ValidData_ShouldSplitNameProperly(BookingRequest request, Holidays.Api.Domain.Data.Payment.MakePaymentResponse paymentResponse, Models.Booking.BookingRequest atcomRequest, string bookingId)
        {
            // Act
            var actual = _sut.MapModifyCustPaymentRequest(request.PaymentInfo, request.LeadPassenger, paymentResponse, atcomRequest, "EasyJetPGS", bookingId);

            // Assert
            (actual.Payload.Body.PayData.Pay[0].Item as Models.Internal.CCPay).Payer.Person.FirstName.Should().Be("Peter");
            (actual.Payload.Body.PayData.Pay[0].Item as Models.Internal.CCPay).Payer.Person.LastName.Should().Be("Parker");
        }

        [Theory]
        [ClassData(typeof(AddPaymentInfo_NameIsMoreThenTwoWords))]
        public void MapModifyCustPaymentRequest_NameIsMoreThenTwoWords_ShouldSplitNameProperly(BookingRequest request, Holidays.Api.Domain.Data.Payment.MakePaymentResponse paymentResponse, Models.Booking.BookingRequest atcomRequest, string bookingId)
        {
            // Act
            var actual = _sut.MapModifyCustPaymentRequest(request.PaymentInfo, request.LeadPassenger, paymentResponse, atcomRequest, "EasyJetPGS", bookingId);

            // Assert
            (actual.Payload.Body.PayData.Pay[0].Item as Models.Internal.CCPay).Payer.Person.FirstName.Should().Be("Xio");
            (actual.Payload.Body.PayData.Pay[0].Item as Models.Internal.CCPay).Payer.Person.LastName.Should().Be("Lao Chi Tsun");
        }

        [Theory]
        [ClassData(typeof(AddPaymentInfo_NameIsOneWord))]
        public void MapModifyCustPaymentRequest_NameIsOneWord_ShouldSplitNameProperly(BookingRequest request, Holidays.Api.Domain.Data.Payment.MakePaymentResponse paymentResponse, Models.Booking.BookingRequest atcomRequest, string bookingId)
        {
            // Act
            var actual = _sut.MapModifyCustPaymentRequest(request.PaymentInfo, request.LeadPassenger, paymentResponse, atcomRequest, "EasyJetPGS", bookingId);

            // Assert
            (actual.Payload.Body.PayData.Pay[0].Item as Models.Internal.CCPay).Payer.Person.FirstName.Should().Be("Emperor");
            (actual.Payload.Body.PayData.Pay[0].Item as Models.Internal.CCPay).Payer.Person.LastName.Should().Be(string.Empty);
        }
        
        [Theory]
        [ClassData(typeof(MapModifyApplePayPaymentRequest_ValidDataData))]
        public void MapModifyApplePayPaymentRequest_ValidData_ShouldSplitNameProperly(BookingRequest request, Holidays.Api.Domain.Data.Payment.MakePaymentResponse paymentResponse, Models.Booking.BookingRequest atcomRequest, string bookingId)
        {
            // Act
            var actual = _sut.MapModifyCustPaymentRequest(request.PaymentInfo, request.LeadPassenger, paymentResponse, atcomRequest, "EasyJetPGS", bookingId);

            // Assert
            Models.Internal.CCPay ccPay = actual.Payload.Body.PayData.Pay[0].Item as Models.Internal.CCPay;
            Assert.NotNull(ccPay);
            ccPay.CNum.Should().Be("XXXXXXXXXXXX0121");
            ccPay.ExpDate.Should().Be("12/99");
            ccPay.PayAmt.Should().Be("15");
            ccPay.Payer.Person.FirstName.Should().Be("");
            ccPay.Payer.Person.LastName.Should().BeNull();
        }
    }

    public class MapModifyCustPaymentRequest_ValidDataData : IEnumerable<object[]>
    {
        public IEnumerator<object[]> GetEnumerator()
        {
            yield return new object[] {
                new BookingRequest() {
                     PaymentInfo = new Holidays.Api.Domain.Data.Payment.CardPaymentInfo()
                     {
                         CardNumber = "1234567890123456",
                         Amount = 123.4M,
                         CVV = "123",
                         ExpirationDate = "10/30",
                         NameOnCard = "Peter Parker"
                     }
                },
                new Holidays.Api.Domain.Data.Payment.MakePaymentResponse
                {
                    Amount = 15,
                    Currency = "GBP"
                },
                new Models.Booking.BookingRequest() {
                    Payload = new Domain.Models.Api.Payload.XmlApiPayload<Models.Internal.BookingRequest>()
                    {
                        Body = new Models.Internal.BookingRequest()
                        {

                        }
                    }
                },
                "66609"
            };
        }

        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
    }
    
    public class AddPaymentInfo_NameIsMoreThenTwoWords : IEnumerable<object[]>
    {
        public IEnumerator<object[]> GetEnumerator()
        {
            yield return new object[] {
                new BookingRequest() {
                     PaymentInfo = new Holidays.Api.Domain.Data.Payment.CardPaymentInfo()
                     {
                         CardNumber = "1234567890123456",
                         NameOnCard = "Xio Lao Chi Tsun"
                     }
                },
                new Holidays.Api.Domain.Data.Payment.MakePaymentResponse
                {

                },
                new Models.Booking.BookingRequest() {
                    Payload = new Domain.Models.Api.Payload.XmlApiPayload<Models.Internal.BookingRequest>()
                    {
                        Body = new Models.Internal.BookingRequest()
                        {

                        }
                    }
                },
                "66609"
            };
        }

        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
    }

    public class AddPaymentInfo_NameIsOneWord : IEnumerable<object[]>
    {
        public IEnumerator<object[]> GetEnumerator()
        {
            yield return new object[] {
                new BookingRequest() {
                     PaymentInfo = new Holidays.Api.Domain.Data.Payment.CardPaymentInfo()
                     {
                         CardNumber = "1234567890123456",
                         NameOnCard = "Emperor"
                     }
                },
                new Holidays.Api.Domain.Data.Payment.MakePaymentResponse
                {

                },
                new Models.Booking.BookingRequest() {
                    Payload = new Domain.Models.Api.Payload.XmlApiPayload<Models.Internal.BookingRequest>()
                    {
                        Body = new Models.Internal.BookingRequest()
                        {

                        }
                    }
                },
                "66609"
            };
        }

        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
    }
    
    
    public class MapModifyApplePayPaymentRequest_ValidDataData : IEnumerable<object[]>
    {
        public IEnumerator<object[]> GetEnumerator()
        {
            yield return new object[] {
                new BookingRequest() {
                    PaymentInfo = new ApplePayPaymentInfo()
                    {
                        Amount = 123.4M,
                        Token = new ApplePayToken()
                        {
                            PaymentMethod = new ApplePayPaymentMethod(){ 
                                DisplayName = "Visa 0121"
                            }, 
                        }
                    }
                },
                new Holidays.Api.Domain.Data.Payment.MakePaymentResponse
                {
                    Amount = 15,
                    Currency = "GBP"
                },
                new Models.Booking.BookingRequest() {
                    Payload = new Domain.Models.Api.Payload.XmlApiPayload<Models.Internal.BookingRequest>()
                    {
                        Body = new Models.Internal.BookingRequest()
                        {

                        }
                    }
                },
                "66609"
            };
        }

        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
    }
}

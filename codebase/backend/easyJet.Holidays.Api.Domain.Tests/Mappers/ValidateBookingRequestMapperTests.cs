using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Mappers
{
    public class ValidateBookingRequestMapperTests
    {

        private readonly IValidateBookingRequestMapper _amendBookingTransfersService;

        public ValidateBookingRequestMapperTests()
        {
            _amendBookingTransfersService = new ValidateBookingRequestMapper();
        }

        [Theory]
        [MemberData(nameof(GetData))]
        public void BuildValidateBookingRequest_ValidInput_Success(BookingResponse bookingResponse, ValidateAmendBookingResponse validateAmendBookingResponse, ValidateBookingRequest expectedOutput)
        {
            // Act
            var offer = _amendBookingTransfersService.BuildValidateBookingRequest(bookingResponse, validateAmendBookingResponse);

            // Assert
            offer.Should().BeEquivalentTo(expectedOutput);
        }

        [Theory]
        [MemberData(nameof(GetDataValidateAmendBookingResponse))]
        public void BuildValidateBookingRequestValidateAmendBookingResponse_ValidInput_Success(BookingResponse bookingResponse, ValidateAmendBookingResponse validateAmendBookingResponse, ValidateBookingRequest expectedOutput)
        {
            // Act
            var offer = _amendBookingTransfersService.BuildValidateBookingRequest(bookingResponse, validateAmendBookingResponse);

            // Assert
            offer.Should().BeEquivalentTo(expectedOutput);
        }

        public static IEnumerable<object[]> GetDataAlternativePackage()
        {
            yield return new object[]
            {
                new BookingResponse
                {
                    BookingReference = "1",
                    DiscountCode = "disc",
                    BookingDate = new DateTime(2022, 01, 01),
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            Code = "code",
                            Rooms = new List<Unit>(),
                            IsExt = true,
                            StartDate = "2022-01-01",
                            EndDate = "2022-01-08",
                            Prom = String.Empty,
                            Hotel = new OfferHotel { Theme = new(), Type = new() } ,
                            Id = "1"
                        }
                    },
                    PriceBreakdown = new PriceCategory[] { new PriceCategory { Amount = 10, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new AlternativePackage
                {
                    AlternativePackagePrice = 100,
                    AlternativePackagePricePerPerson = 100,
                    Duration = 7
                },
                new ValidateBookingRequest
                {
                    DiscountCode = "disc",
                    Offer = new Offer
                    {
                        Date = new DateTime(2022, 01, 01),
                        Price = 100,
                        PricePP = 100,
                        Stay = 7,
                        Accom = new Accom
                        {
                            Date = new DateTime(2022, 01, 01),
                            Code = "code",
                            Theme = new (),
                            Type = new (),
                            Unit = new List<Unit>(),
                            Id = "1"
                        }
                    }
                }
            };
        }
        public static IEnumerable<object[]> GetData()
        {
            yield return new object[]
   {
                new BookingResponse
                {
                    BookingReference = "1",
                    DiscountCode = "disc",
                    BookingDate = new DateTime(2022, 01, 01),
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            Code = "code",
                            Rooms = new List<Unit>(),
                            IsExt = true,
                            StartDate = "2022-01-01",
                            EndDate = "2022-01-08",
                            Prom = String.Empty,
                            Hotel = new OfferHotel { Theme = new(), Type = new () } ,
                            Id = "1"
                        }
                    },
                    PriceBreakdown = new PriceCategory[] { new PriceCategory { Amount = 10, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new ValidateAmendBookingResponse
                {
                    PaymentInfo = new PriceInfo
                    {
                        TotalPrice = 100,
                        PricePP = 100,
                        BookingPriceEx = 110,
                    },
                    Duration = 7
                },
                new ValidateBookingRequest
                {
                    DiscountCode = "disc",
                    Offer = new Offer
                    {
                        Date = new DateTime(2022, 01, 01),
                        Price = 110,
                        PricePP = 100,
                        Stay = 7,
                        Accom = new Accom
                        {
                            Date = new DateTime(2022, 01, 01),
                            Code = "code",
                            Theme = new(),
                            Type = new (),
                            Unit = new List<Unit>(),
                            Id = "1",
                            Prom = String.Empty,
                        }
                    }
                }
   };
        }
        public static IEnumerable<object[]> GetDataValidateAmendBookingResponse()
        {
            yield return new object[]
           {
                new BookingResponse
                {
                    BookingReference = "1",
                    DiscountCode = "disc",
                    BookingDate = new DateTime(2022, 01, 01),
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            Code = "code",
                            Rooms = new List<Unit>(),
                            IsExt = true,
                            StartDate = "2022-01-01",
                            EndDate = "2022-01-08",
                            Prom = String.Empty,
                            Hotel = new OfferHotel { Theme = new(), Type = new() } ,
                            Id = "1"
                        }
                    },
                    PriceBreakdown = new PriceCategory[] { new PriceCategory { Amount = 10, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new ValidateAmendBookingResponse
                {
                    PaymentInfo = new PriceInfo
                    {
                        TotalPrice = 100,
                        PricePP = 100,
                        BookingPriceEx = 110,
                    },
                    Duration = 7
                },
                new ValidateBookingRequest
                {
                    DiscountCode = "disc",
                    Offer = new Offer
                    {
                        Price = 110,
                        PricePP = 100,
                        Stay = 7,
                        Date = new DateTime(2022, 01, 01),
                        Accom = new Accom
                        {
                            Date = new DateTime(2022, 01, 01),
                            Code = "code",
                            Theme = new (),
                            Type = new (),
                            Unit = new List<Unit>(),
                            Id = "1",
                            Prom = string.Empty,
                        }
                    }
                }
           };
        }
    }
}
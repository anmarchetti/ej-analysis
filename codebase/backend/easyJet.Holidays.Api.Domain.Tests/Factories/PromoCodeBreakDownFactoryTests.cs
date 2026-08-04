using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Factories.PromoCodeBreakDownFactory;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Factories
{
    public class PromoCodeBreakDownFactoryTests
    {
        private readonly IOptions<AtcomSettings> _atcomSettings;
        private readonly PromoCodeBreakDownFactory _promoCodeBreakDownFactory;

        public PromoCodeBreakDownFactoryTests()
        {
            _atcomSettings = Options.Create(new AtcomSettings
            {
                PromotionsCodeName = "promo code",
                PromoCodeErrorCodesToIgnore = new()
                {
                    {"code-1", "desc" }
                }
            });

            _promoCodeBreakDownFactory = new(_atcomSettings);
        }

        [Theory]
        [MemberData(nameof(GetData))]
        public void BuildValidateBookingRequest_ValidInput_Success(BookingResponse bookingResponse, ValidateAmendBookingResponse validateAmendBookingResponse, PromoCodeBreakDown expectedOutput)
        {
            // Act            
            var breakdown = _promoCodeBreakDownFactory.Create(validateAmendBookingResponse, bookingResponse);

            // Assert
            breakdown.Should().BeEquivalentTo(expectedOutput);
        }

        public static IEnumerable<object[]> GetData()
        {
            yield return new object[]
   {
                new BookingResponse
                {
                    BookingReference = "1",
                    DiscountCode = "disc",
                    Package = new()
                    {
                        Accom = new()
                        {
                            Code = "code",
                            Rooms = new(),
                            IsExt = true,
                            StartDate = "2022-01-01",
                            EndDate = "2022-01-08",
                            Prom = string.Empty,
                            Hotel = new() { Theme = new(), Type = new() } ,
                            Id = "1"
                        }
                    },
                    PriceBreakdown = new PriceCategory[] { new() { Amount = 10, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new ValidateAmendBookingResponse
                {
                    PaymentInfo = new()
                    {
                        TotalPrice = 100,
                        PricePP = 100,
                    }
                },
                new PromoCodeBreakDown
                {
                    Due = 10,
                    Errors = new(),
                    PromoCodeStatus = PromoCodeStatus.PROMOCODE_REMOVED
                }
   };
            yield return new object[]
{
                new BookingResponse
                {
                    BookingReference = "1",
                    DiscountCode = "disc",
                    Package = new()
                    {
                        Accom = new()
                        {
                            Code = "code",
                            Rooms = new(),
                            IsExt = true,
                            StartDate = "2022-01-01",
                            EndDate = "2022-01-08",
                            Prom = string.Empty,
                            Hotel = new() { Theme = new(), Type = new() } ,
                            Id = "1"
                        }
                    },
                    PriceBreakdown = new PriceCategory[] { new() { Amount = 10, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new ValidateAmendBookingResponse
                {
                    PaymentInfo = new()
                    {
                        TotalPrice = 100,
                        PricePP = 100,
                    },
                    DiscountCode = "disc",
                    PriceBreakdown = new PriceCategory[] { new() { Amount = -10, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new PromoCodeBreakDown
                {
                    Due = -10,
                    PromoCode = "disc",
                    Errors = new(),
                    PromoCodeStatus = PromoCodeStatus.APPLIED_ORIGINALLY
                }
};
            yield return new object[]
{
                new BookingResponse
                {
                    BookingReference = "1",
                    DiscountCode = "disc",
                    Package = new()
                    {
                        Accom = new()
                        {
                            Code = "code",
                            Rooms = new(),
                            IsExt = true,
                            StartDate = "2022-01-01",
                            EndDate = "2022-01-08",
                            Prom = string.Empty,
                            Hotel = new() { Theme = new(), Type = new() } ,
                            Id = "1"
                        }
                    },
                    PriceBreakdown = new PriceCategory[] { new() { Amount = -10, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new ValidateAmendBookingResponse
                {
                    PaymentInfo = new()
                    {
                        TotalPrice = 200,
                        PricePP = 200,
                    },
                    DiscountCode = "disc better",
                    PriceBreakdown = new PriceCategory[] { new() { Amount = -200, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new PromoCodeBreakDown
                {
                    Due = -200,
                    PromoCode = "disc better",
                    Errors = new(),
                    PromoCodeStatus = PromoCodeStatus.TIER_UPGRADE
                }
};
            yield return new object[]
{
                new BookingResponse
                {
                    BookingReference = "1",
                    DiscountCode = "disc",
                    Package = new()
                    {
                        Accom = new()
                        {
                            Code = "code",
                            Rooms = new(),
                            IsExt = true,
                            StartDate = "2022-01-01",
                            EndDate = "2022-01-08",
                            Prom = string.Empty,
                            Hotel = new() { Theme = new(), Type = new() } ,
                            Id = "1"
                        }
                    },
                    PriceBreakdown = new PriceCategory[] { new() { Amount = -10, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new ValidateAmendBookingResponse
                {
                    PaymentInfo = new()
                    {
                        TotalPrice = 200,
                        PricePP = 200,
                    },
                    DiscountCode = "disc",
                    PriceBreakdown = new PriceCategory[] { new() { Amount = -11, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new PromoCodeBreakDown
                {
                    Due = -11,
                    PromoCode = "disc",
                    Errors = new(),
                    PromoCodeStatus = PromoCodeStatus.APPLIED_ORIGINALLY
                }
};
            yield return new object[]
{
                new BookingResponse
                {
                    BookingReference = "1",
                    DiscountCode = "disc",
                    Package = new()
                    {
                        Accom = new()
                        {
                            Code = "code",
                            Rooms = new(),
                            IsExt = true,
                            StartDate = "2022-01-01",
                            EndDate = "2022-01-08",
                            Prom = string.Empty,
                            Hotel = new() { Theme = new(), Type = new() } ,
                            Id = "1"
                        }
                    },
                    PriceBreakdown = new PriceCategory[] { new() { Amount = -10, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new ValidateAmendBookingResponse
                {
                    PaymentInfo = new()
                    {
                        TotalPrice = 200,
                        PricePP = 200,
                    },
                    DiscountCode = "disc lesser",
                    PriceBreakdown = new PriceCategory[] { new() { Amount = -5, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new PromoCodeBreakDown
                {
                    Due = -5,
                    PromoCode = "disc lesser",
                    Errors = new(),
                    PromoCodeStatus = PromoCodeStatus.TIER_DOWNGRADE
                }
};
            yield return new object[]
{
                new BookingResponse
                {
                    BookingReference = "1",
                    DiscountCode = "disc",
                    Package = new()
                    {
                        Accom = new()
                        {
                            Code = "code",
                            Rooms = new(),
                            IsExt = true,
                            StartDate = "2022-01-01",
                            EndDate = "2022-01-08",
                            Prom = string.Empty,
                            Hotel = new() { Theme = new(), Type = new() } ,
                            Id = "1"
                        }
                    },
                    PriceBreakdown = new PriceCategory[] { new() { Amount = -10, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new ValidateAmendBookingResponse
                {
                    PaymentInfo = new()
                    {
                        TotalPrice = 200,
                        PricePP = 200,
                    }
                },
                new PromoCodeBreakDown
                {
                    Due = 10,
                    Errors = new(),
                    PromoCodeStatus = PromoCodeStatus.PROMOCODE_REMOVED
                }
};
            yield return new object[]
{
                new BookingResponse
                {
                    BookingReference = "1",
                    DiscountCode = "disc",
                    Package = new()
                    {
                        Accom = new()
                        {
                            Code = "code",
                            Rooms = new(),
                            IsExt = true,
                            StartDate = "2022-01-01",
                            EndDate = "2022-01-08",
                            Prom = String.Empty,
                            Hotel = new() { Theme = new(), Type = new() } ,
                            Id = "1"
                        }
                    },
                    PriceBreakdown = new PriceCategory[] { new() { Amount = -10, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new ValidateAmendBookingResponse
                {
                    PaymentInfo = new()
                    {
                        TotalPrice = 200,
                        PricePP = 200,
                    },
                    ApiErrors = new ApiError[] { new() { Code = "code-1" } }
                },
                new PromoCodeBreakDown
                {
                    Due = 10,
                    Errors = new(),
                    PromoCodeStatus = PromoCodeStatus.ERROR
                }
};
            yield return new object[]
{
                new BookingResponse
                {
                    BookingReference = "1",
                    DiscountCode = "disc",
                    Package = new()
                    {
                        Accom = new()
                        {
                            Code = "code",
                            Rooms = new(),
                            IsExt = true,
                            StartDate = "2022-01-01",
                            EndDate = "2022-01-08",
                            Prom = string.Empty,
                            Hotel = new() { Theme = new(), Type = new() } ,
                            Id = "1"
                        }
                    },
                    PriceBreakdown = new PriceCategory[] { new() { Amount = -10, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new ValidateAmendBookingResponse
                {
                    PaymentInfo = new()
                    {
                        TotalPrice = 200,
                        PricePP = 200,
                    },
                    ApiErrors = new ApiError[] { new() { Code = "sitecore-error", Message = "invalid airport" } }
                },
                new PromoCodeBreakDown
                {
                    Due = 10,
                    Errors = new() { new() { Code = "sitecore-error", Message = "invalid airport" } },
                    PromoCodeStatus = PromoCodeStatus.PROMOCODE_REMOVED
                }
            };
            yield return new object[]
            {
                new BookingResponse
                {
                    BookingReference = "1",
                    DiscountCode = "disc",
                    Package = new()
                    {
                        Accom = new()
                        {
                            Code = "code",
                            Rooms = new(),
                            IsExt = true,
                            StartDate = "2022-01-01",
                            EndDate = "2022-01-08",
                            Prom = String.Empty,
                            Hotel = new() { Theme = new(), Type = new() } ,
                            Id = "1"
                        }
                    },
                    PriceBreakdown = new PriceCategory[] { new() { Amount = -10, Code = "promo code", Name = "promo code", Quantity = 1 } }
                },
                new ValidateAmendBookingResponse
                {
                    PaymentInfo = new()
                    {
                        TotalPrice = 200,
                        PricePP = 200,
                    },
                    ApiErrors = new ApiError[] { new() { Code = "sitecore-error", Message = "invalid airport" }, new() { Code = "code-1" } }
                },
                new PromoCodeBreakDown
                {
                    Due = 10,
                    Errors = new(),
                    PromoCodeStatus = PromoCodeStatus.ERROR
                }
            };
        }
    }
}
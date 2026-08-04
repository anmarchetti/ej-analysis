using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Factories.PromoCodeBreakDownFactory;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.RoomAndBoard;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Mappers;

public class ValidateBookingResponseMapperTests
{
    private readonly IFixture fixture = FixtureUtils.AutoMoqFixture();
    private readonly Mock<IPromoCodeBreakDownFactory> _promoCodeBreakDownFactoryMock = new();
    private readonly Mock<IHotelOfferService> _hotelOfferServiceMock = new();
    private readonly Mock<IHotelThemeService> _hotelThemeService = new();
    private readonly Mock<ISettingsService> _settingService = new();
    private readonly Mock<IAmendmentChargesService> _amendmentChargesService = new();

    private readonly ValidateBookingResponseMapper _sut;

    private readonly ITestOutputHelper _testOutput;

    public ValidateBookingResponseMapperTests(ITestOutputHelper testOutput)
    {
        _testOutput = testOutput;

        var options = Options.Create(new AtcomSettings
        {
            PromotionsCodeName = "Promotions"
        });

        _sut = new ValidateBookingResponseMapper(_promoCodeBreakDownFactoryMock.Object,
            _settingService.Object,
            _hotelThemeService.Object,
            _hotelOfferServiceMock.Object,
            _amendmentChargesService.Object,
            options);
    }

    [Fact]
    public async Task MapToOfferTest()
    {
        var date = new DateTime(2014, 1, 1);

        var accom = fixture
            .Build<BookingAccommodation>()
            .With(x => x.StartDate, date.ToString("yyyy-MM-dd"))
            .Create();
        var transport = fixture.Create<Transport>();
        var transfer = fixture.CreateMany<TransferItem>(1).ToList();
        var price = (new Random()).Next(1000, 3000);


        var validateAmendBookingResponse = new ValidateAmendBookingResponse
        {
            Accom = accom,
            Transfers = transfer,
            Transport = transport,
            PaymentInfo = new PriceInfo
            {
                BookingPriceEx = price
            }
        };

        var result = await _sut.MapToOffer(validateAmendBookingResponse);

        result.Price.Should().Be(price);
        result.Accom.Date.Should().Be(date);
        result.Accom.Should().BeEquivalentTo(accom, options => options.ExcludingMissingMembers());
        result.Transfers.Should().BeEquivalentTo(transfer, options => options.ExcludingMissingMembers());
        result.Transport.Should().BeEquivalentTo(transport, options => options.ExcludingMissingMembers());
    }

    [Theory]
    [MemberData(nameof(MapToRoomVariant_MappingWithoutPromoCodeData))]
    public void MapToRoomVariant_MappingWithoutPromocode(
        string reason,
        decimal offerPrice,
        decimal originalBookingPrice,
        decimal seatsPrice,
        decimal fullAmendmentsCharges,
        decimal amendmentCharges,
        ValidateAmendBookingResponse validateResponse,
        BookingResponse bookingResponse,
        AmendRoomValidationRequest amendRoomValidationRequest)
    {
        _testOutput.WriteLine(reason);

        var result = _sut.MapToRoomVariant(validateResponse, bookingResponse, amendRoomValidationRequest);

        using (new AssertionScope())
        {
            result.OfferPrice.Should().Be(offerPrice);
            result.BookingPrice.Should().Be(originalBookingPrice);
            result.SeatsPrice.Should().Be(seatsPrice);
            result.FullAmendmentCharges.Should().Be(fullAmendmentsCharges);
            result.AmendmentCharges.Should().Be(amendmentCharges);
        }
    }

    [Fact]
    public void MapToRoomVariant_MappingWithPromocode()
    {
        var validateResponse = new ValidateAmendBookingResponse
        {
            Accom = new BookingAccommodation
            {
                Rooms = new List<Unit>
                {
                    new Unit
                    {
                        Code = "DB01",
                        Board = "AI"
                    }
                }
            },
            PaymentInfo = new PriceInfo
            {
                TotalPrice = 1000m
            },
            SeatSelection = new List<SeatMap>
            {
                new SeatMap
                {
                    Seats = new List<Seat>
                    {
                        new Seat
                        {
                            Price = 0
                        }
                    }
                }
            }
        };

        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                TotalPrice = 2000m
            }
        };

        var amendRoomValidationRequest = new AmendRoomValidationRequest
        {
            SelectedRoomVariant = new AmendRoomVariant
            {
                OfferPrice = 1000m,
                SeatsPrice = 0m
            },
            DiscountCode = "ORANGESALE"
        };

        _promoCodeBreakDownFactoryMock
            .Setup(x => x.Create(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>()))
            .Returns(new PromoCodeBreakDown());

        var result = _sut.MapToRoomVariant(validateResponse, bookingResponse, amendRoomValidationRequest);

        result.PromoCodeBreakDown.Should().NotBeNull();
    }

    [Fact]
    public async Task MapToAmendDatesOffer()
    {
        _settingService.Setup(x => x.GetSeatMapSettings()).ReturnsAsync(new Domain.Data.Settings.SeatMapSettings
        {
            EnableSeatMapDateChange = true
        });
        _hotelThemeService.Setup(x => x.GetTheme(It.IsAny<string>())).ReturnsAsync((new PackageTheme(), new ThemeType()));
        _hotelOfferServiceMock.Setup(x => x.EnrichOfferWithCmsHotelData(It.IsAny<Offer>())).ReturnsAsync(new Offer());
        _amendmentChargesService.Setup(x => x.CalculateAmendmentPaymentInfo(It.IsAny<BookingResponse>(), It.IsAny<ValidateBookingResponse>())).Returns(new AmendmentPaymentInfo());

        var result = await _sut.MapToAmendDatesOffer(new ValidateAmendBookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 1000
                },
                Accom = new BookingAccommodation
                {
                    StartDate = "2020-01-01",
                    EndDate = "2020-01-08"
                }
            }, new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 1000
                },
            }
            , new AmendDatesOffer
            {
                OfferPrice = 100,
                Offer = new Offer
                {
                    Transport = new Transport
                    {
                    }
                }
            });

        result.SeatsChangeEnabled.Should().BeTrue();
    }

    public static IEnumerable<object[]> MapToRoomVariant_MappingWithoutPromoCodeData()
    {
        yield return new object[]
        {
            "Refund without seats, 0 amendCharges",
            1000m,
            2000m,
            0m,
            -1000m,
            0m,
            new ValidateAmendBookingResponse
            {
                Accom = new BookingAccommodation
                {
                    Rooms = new List<Unit>
                    {
                        new Unit
                        {
                            Code = "DB01",
                            Board = "AI"
                        }
                    }
                },
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 1000m
                },
                SeatSelection = new List<SeatMap>
                {
                    new SeatMap
                    {
                        Seats = new List<Seat>
                        {
                            new Seat
                            {
                                Price = 0
                            }
                        }
                    }
                }
            },
            new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 2000m
                }
            },
            new AmendRoomValidationRequest
            {
                SelectedRoomVariant = new AmendRoomVariant
                {
                    OfferPrice = 1000m,
                    SeatsPrice = 0m
                }
            }
        };

        yield return new object[]
        {
            "Refund without seats, 500 amendCharges",
            1000m,
            2000m,
            0m,
            -1000m,
            500m,
            new ValidateAmendBookingResponse
            {
                Accom = new BookingAccommodation
                {
                    Rooms = new List<Unit>
                    {
                        new Unit
                        {
                            Code = "DB01",
                            Board = "AI"
                        }
                    }
                },
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 1000m
                },
                SeatSelection = new List<SeatMap>
                {
                    new SeatMap
                    {
                        Seats = new List<Seat>
                        {
                            new Seat
                            {
                                Price = 0
                            }
                        }
                    }
                }
            },
            new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 2000m
                }
            },
            new AmendRoomValidationRequest
            {
                SelectedRoomVariant = new AmendRoomVariant
                {
                    OfferPrice = 500m,
                    SeatsPrice = 0m
                }
            }
        };

        yield return new object[]
        {
            "Refund without seats, -500 amendCharges",
            1000m,
            2000m,
            0m,
            -1000m,
            -500m,
            new ValidateAmendBookingResponse
            {
                Accom = new BookingAccommodation
                {
                    Rooms = new List<Unit>
                    {
                        new Unit
                        {
                            Code = "DB01",
                            Board = "AI"
                        }
                    }
                },
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 1000m
                },
                SeatSelection = new List<SeatMap>
                {
                    new SeatMap
                    {
                        Seats = new List<Seat>
                        {
                            new Seat
                            {
                                Price = 0
                            }
                        }
                    }
                }
            },
            new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 2000m
                }
            },
            new AmendRoomValidationRequest
            {
                SelectedRoomVariant = new AmendRoomVariant
                {
                    OfferPrice = 1500m,
                    SeatsPrice = 0m
                }
            }
        };

        yield return new object[]
        {
            "Payment without seats, 0 amendCharges",
            2000m,
            1000m,
            00m,
            1000m,
            0m,
            new ValidateAmendBookingResponse
            {
                Accom = new BookingAccommodation
                {
                    Rooms = new List<Unit>
                    {
                        new Unit
                        {
                            Code = "DB01",
                            Board = "AI"
                        }
                    }
                },
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 2000m
                },
                SeatSelection = new List<SeatMap>
                {
                    new SeatMap
                    {
                        Seats = new List<Seat>
                        {
                            new Seat
                            {
                                Price = 0m
                            }
                        }
                    }
                }
            },
            new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 1000m
                }
            },
            new AmendRoomValidationRequest
            {
                SelectedRoomVariant = new AmendRoomVariant
                {
                    OfferPrice = 2000m,
                    SeatsPrice = 0m
                }
            }
        };

        yield return new object[]
        {
            "Payment without seats, 500 amendCharges",
            2000m,
            1000m,
            0m,
            1000m,
            500m,
            new ValidateAmendBookingResponse
            {
                Accom = new BookingAccommodation
                {
                    Rooms = new List<Unit>
                    {
                        new Unit
                        {
                            Code = "DB01",
                            Board = "AI"
                        }
                    }
                },
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 2000m
                },
                SeatSelection = new List<SeatMap>
                {
                    new SeatMap
                    {
                        Seats = new List<Seat>
                        {
                            new Seat
                            {
                                Price = 0m
                            }
                        }
                    }
                }
            },
            new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 1000m
                }
            },
            new AmendRoomValidationRequest
            {
                SelectedRoomVariant = new AmendRoomVariant
                {
                    OfferPrice = 1500m,
                    SeatsPrice = 0m
                }
            }
        };

        yield return new object[]
        {
            "Payment without seats, -500 amendCharges",
            2000m,
            1000m,
            0m,
            1000m,
            -500m,
            new ValidateAmendBookingResponse
            {
                Accom = new BookingAccommodation
                {
                    Rooms = new List<Unit>
                    {
                        new Unit
                        {
                            Code = "DB01",
                            Board = "AI"
                        }
                    }
                },
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 2000m
                },
                SeatSelection = new List<SeatMap>
                {
                    new SeatMap
                    {
                        Seats = new List<Seat>
                        {
                            new Seat
                            {
                                Price = 0m
                            }
                        }
                    }
                }
            },
            new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 1000m
                }
            },
            new AmendRoomValidationRequest
            {
                SelectedRoomVariant = new AmendRoomVariant
                {
                    OfferPrice = 2500m,
                    SeatsPrice = 0m
                }
            }
        };
    }

    [Fact]
    public async Task MapToAmendmentHotelOffer_Should_Map_Properties_Correctly()
    {
        var transfers = fixture.CreateMany<TransferItem>(1).ToList();
        var units = fixture.CreateMany<Unit>(1).ToList();
        var packageTheme = fixture.Create<PackageTheme>();
        var packageType = fixture.Create<ThemeType>();

        // Arrange
        var validateAmendBookingResponse = new ValidateAmendBookingResponse
        {
            Accom = new BookingAccommodation()
                {Prom = "TestProm", StartDate = "2024-01-01", EndDate = "2024-01-10", Id = "1", Code = "TestCode", Rooms = units, IsExt = true},
            Transfers = transfers,
            PaymentInfo = new PriceInfo() {AmendmentCharges = 100}
        };
        var bookingResponse = new BookingResponse{ PaymentInfo = new PriceInfo { TotalPrice = 0}};

        var requestOffer = new AmendHotelOffer
        {
            AmendmentChargesInfo = new AmendmentChargesInfo
            {
                FullAmendmentCharges = 50
            }
        };

        _hotelThemeService.Setup(x => x.GetTheme(It.IsAny<string>())).ReturnsAsync((packageTheme, packageType));
        _promoCodeBreakDownFactoryMock.Setup(x => x.Create(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>())).Returns(new PromoCodeBreakDown());

        // Act
        var result = await _sut.MapToAmendmentHotelOffer(validateAmendBookingResponse, bookingResponse, requestOffer);

        // Assert
        using (new AssertionScope())
        {
            result.Should().NotBeNull();
            result.Transfers.Should().BeEquivalentTo(transfers);
            result.AmendmentChargesInfo.FullAmendmentCharges.Should().Be(100);
            result.AmendmentChargesInfo.PromoCodeBreakDown.Should().NotBeNull();
            result.Accom.Should().NotBeNull();
            result.Accom.Theme.Should().Be(packageTheme);
            result.Accom.Type.Should().Be(packageType);
            result.Accom.Date.Should().Be(new DateTime(2024, 1, 1));
            result.Accom.Stay.Should().Be(9);
            result.Accom.Id.Should().Be("1");
            result.Accom.Code.Should().Be("TestCode");
            result.Accom.Prom.Should().Be("TestProm");
            result.Accom.IsExternal.Should().BeTrue();
            result.AmendmentChargesInfo.AmendmentCharges.Should().Be(50);
        }
    }
}
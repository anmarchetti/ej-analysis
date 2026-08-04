using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Offers
{
    public class HotelOfferServiceTests
    {
        private readonly IFixture _fixture;
        private readonly HotelOfferService _sut;
        private Mock<IBookingCreateService> _bookingCreateServiceMock = new();
        private Mock<IHotelsService> _hotelsServiceMock = new Mock<IHotelsService>();
        private Mock<IReferenceDataService> _referenceDataServiceMock = new Mock<IReferenceDataService>();
        private Mock<ILogger<HotelOfferService>> _loggerMock = new Mock<ILogger<HotelOfferService>>();

        private const string SyntheticNoTransferCode = "SyntheticNoTransfer";

        public HotelOfferServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _fixture.Inject(Options.Create(new AtcomSettings
            {
                Transfers = new TransfersSettings
                {
                    Types = new TransferTypesSettings
                    {
                        SyntheticNoTransfer = SyntheticNoTransferCode
                    }
                }
            }));

            _sut = new HotelOfferService(
                _bookingCreateServiceMock.Object,
                _fixture.Create<IOptions<AtcomSettings>>(),
                _hotelsServiceMock.Object,
                new Mock<IOfferHotelMapper>().Object,
                new Mock<IAirportsMapper>().Object,
                _loggerMock.Object);
        }

        [Theory]
        [MemberData(nameof(SetOfferTransfer_TestData))]
        public void SetOfferTransferTests(Offer offer, string transferCode, bool expected)
        {
            var result = _sut.SetOfferTransfer(offer, transferCode);

            result.Should().Be(expected);
            if (!expected) return;

            offer.Transfers.Count.Should().Be(1);
            offer.Transfers.Single().Code.Should().Be(transferCode);
        }

        public static IEnumerable<object[]> SetOfferTransfer_TestData()
        {
            yield return new object[] { null, null, false };
            yield return new object[] {
                new Offer
                {
                    Transfers = [],
                },
                SyntheticNoTransferCode,
                false
            };
            yield return new object[] {
                new Offer
                {
                    Transfers = new List<TransferItem>
                    {
                        new TransferItem
                        {
                            Code = "TransferCode",
                        },
                    },
                },
                "TransferCode",
                false
            };
            yield return new object[] {
                new Offer
                {
                    Transfers = new List<TransferItem>
                    {
                        new TransferItem
                        {
                            Code = "TransferCode",
                        },
                    },
                },
                "OtherTransferCode",
                true
            };
            yield return new object[] {
                new Offer
                {
                    Transfers = new List<TransferItem>
                    {
                        new TransferItem
                        {
                            Code = "TransferCodeOne",
                        },
                        new TransferItem
                        {
                            Code = "TransferCodeTwo",
                        },
                    },
                },
                "OtherTransferCode",
                true
            };
            yield return new object[] {
                new Offer
                {
                    Transfers = [],
                },
                "OtherTransferCode",
                true
            };
        }

        [Fact]
        public async Task RecalculateOfferPriceWithTransferTests()
        {
            _bookingCreateServiceMock
                .Setup(x => x.Validate(
                    It.IsAny<ValidateBookingRequest>(),
                    It.IsAny<bool>(),
                    It.IsAny<BookingRequest>(),
                    It.IsAny<bool>(),
                    It.IsAny<bool>()))
                .ReturnsAsync(new ValidateBookingResponse
                {
                    PaymentInfo = new PriceInfo
                    {
                        TotalPrice = 20,
                        PricePP = 10,
                    }
                });

            var offer = new Offer
            {
                Price = 2,
                PricePP = 1,
                Accom = new Accom
                {
                    Unit = new List<Unit>()
                }
            };

            await _sut.RecalculateOfferPriceWithTransfer(offer);

            offer.Price.Should().Be(20);
            offer.PricePP.Should().Be(10);
        }

        [Theory]
        [MemberData(nameof(BuildGuests_TestData))]
        public async Task BuildGuestsTests(Unit unit, Person expected)
        {
            _bookingCreateServiceMock
                .Setup(x => x.Validate(
                    It.IsAny<ValidateBookingRequest>(),
                    It.IsAny<bool>(),
                    It.IsAny<BookingRequest>(),
                    It.IsAny<bool>(),
                    It.IsAny<bool>()))
                .ReturnsAsync(new ValidateBookingResponse
                {
                    PaymentInfo = new PriceInfo
                    {
                        TotalPrice = 20,
                        PricePP = 10,
                    }
                });

            var offer = new Offer
            {
                Accom = new Accom
                {
                    Unit = new List<Unit> { unit }
                }
            };

            await _sut.RecalculateOfferPriceWithTransfer(offer);

            _bookingCreateServiceMock.Verify(x =>
                x.Validate(It.Is<ValidateBookingRequest>(y =>
                    y.Guests.All(z =>
                        z.Age == expected.Age && z.Type == expected.Type)),
                    It.IsAny<bool>(),
                    It.IsAny<BookingRequest>(),
                    It.IsAny<bool>(),
                    It.IsAny<bool>()));
        }

        public static IEnumerable<object[]> BuildGuests_TestData()
        {
            yield return new object[] {
                new Unit
                {
                    Occupation = new Occupation
                    {
                        Adults = 1,
                    }
                },
                new Person
                {
                    Type = PersonType.Adult,
                    Age = 30,
                }
            };
            yield return new object[] {
                new Unit
                {
                    Occupation = new Occupation
                    {
                        Children = 1,
                        ChildAges = new List<uint>()
                    }
                },
                new Person
                {
                    Type = PersonType.Child,
                    Age = 2,
                }
            };
            yield return new object[] {
                new Unit
                {
                    Occupation = new Occupation
                    {
                        Children = 1,
                        ChildAges = new List<uint> { 3 }
                    }
                },
                new Person
                {
                    Type = PersonType.Child,
                    Age = 3,
                }
            };
            yield return new object[] {
                new Unit
                {
                    Occupation = new Occupation
                    {
                        Infants = 1,
                    }
                },
                new Person
                {
                    Type = PersonType.Infant,
                }
            };
        }
    }
}

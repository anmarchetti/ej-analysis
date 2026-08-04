using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using FluentAssertions;
using FluentAssertions.Execution;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendmentValidatorsTests
{
    public class AuthorizationValidatorTests
    {

        private Mock<IAuthenticationService> _authenticationServiceMock = new Mock<IAuthenticationService>();
        private Mock<ITradeAgentAuthenticationService> _tradeAgentAuthServiceMock = new Mock<ITradeAgentAuthenticationService>();
        private AuthorizationValidator _sut;

        [Fact]
        public async Task AuthorizationValidation_TradeBooking_LoggedAsTradeAgent()
        {
            var bookingResponse = new BookingResponse
            {
                IsExternalAgency = true,
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        },
                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        }
                    }
                    },
                    Accom = new BookingAccommodation
                    {
                        IsExt = false,
                        Code = "EZY1"
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Route = true,
                    Transfer = new AmendItem
                    {
                        AmendAllow = true,
                        DowngradeAllow = true
                    },
                    ChangeDates = true,
                    Memo = true,
                    Pax = new Pax
                    {
                        AmendAllow = true,
                        AmendNameOnly = true
                    },
                    Seats = true
                }
            };

            var memos = new List<Memo>();


            _authenticationServiceMock
                .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
                .ReturnsAsync(true);

            _tradeAgentAuthServiceMock
                .Setup(x => x.IsLoggedInAsTradeAgent())
                .Returns(true);

            _sut = new AuthorizationValidator(_tradeAgentAuthServiceMock.Object, _authenticationServiceMock.Object);

            await _sut.Validate(bookingResponse, memos, null);

            var expectedStatuses = Enumerable.Empty<AmendBookingStatus>();

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
            }
        }

        [Fact]
        public async Task AuthorizationValidation_TradeBooking_NotLoggedAsTradeAgent()
        {
            var bookingResponse = new BookingResponse
            {
                IsExternalAgency = true,
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        },
                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        }
                    }
                    },
                    Accom = new BookingAccommodation
                    {
                        IsExt = false,
                        Code = "EZY1"
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Route = true,
                    Transfer = new AmendItem
                    {
                        AmendAllow = true,
                        DowngradeAllow = true
                    },
                    ChangeDates = true,
                    Memo = true,
                    Pax = new Pax
                    {
                        AmendAllow = true,
                        AmendNameOnly = true
                    }
                }
            };

            var memos = new List<Memo>();

            _authenticationServiceMock
                .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
                .ReturnsAsync(true);

            _tradeAgentAuthServiceMock
                .Setup(x => x.IsLoggedInAsTradeAgent())
                .Returns(false);

            _sut = new AuthorizationValidator(_tradeAgentAuthServiceMock.Object, _authenticationServiceMock.Object);

            await _sut.Validate(bookingResponse, memos, null);

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.NotLoggedAsTradeAgent
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(false);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(false);
                bookingResponse.AmendmentInfo.Seats.Should().Be(false);
            }
        }

        [Fact]
        public async Task AuthorizationValidation_NoTradeBooking_LoggedAsCustomer()
        {
            var bookingResponse = new BookingResponse
            {
                IsExternalAgency = false,
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        },
                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        }
                    }
                    },
                    Accom = new BookingAccommodation
                    {
                        IsExt = false,
                        Code = "EZY1"
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Route = true,
                    Transfer = new AmendItem
                    {
                        AmendAllow = true,
                        DowngradeAllow = true
                    },
                    ChangeDates = true,
                    Memo = true,
                    Pax = new Pax
                    {
                        AmendAllow = true,
                        AmendNameOnly = true
                    },
                    Seats = true
                }
            };

            var memos = new List<Memo>();

            _authenticationServiceMock
                .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
                .ReturnsAsync(true);

            _tradeAgentAuthServiceMock
                .Setup(x => x.IsLoggedInAsTradeAgent())
                .Returns(false);

            _sut = new AuthorizationValidator(_tradeAgentAuthServiceMock.Object, _authenticationServiceMock.Object);

            await _sut.Validate(bookingResponse, memos, null);

            var expectedStatuses = Enumerable.Empty<AmendBookingStatus>();

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
            }
        }

        [Fact]
        public async Task AuthorizationValidation_NoTradeBooking_NotLoggedAsCustomer()
        {
            var bookingResponse = new BookingResponse
            {
                IsExternalAgency = false,
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        },
                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        }
                    }
                    },
                    Accom = new BookingAccommodation
                    {
                        IsExt = false,
                        Code = "EZY1"
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Route = true,
                    Transfer = new AmendItem
                    {
                        AmendAllow = true,
                        DowngradeAllow = true
                    },
                    ChangeDates = true,
                    Memo = true,
                    Pax = new Pax
                    {
                        AmendAllow = true,
                        AmendNameOnly = true
                    },
                    Seats = true
                }
            };

            var memos = new List<Memo>();

            _authenticationServiceMock
                .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
                .ReturnsAsync(false);

            _tradeAgentAuthServiceMock
                .Setup(x => x.IsLoggedInAsTradeAgent())
                .Returns(false);

            _sut = new AuthorizationValidator(_tradeAgentAuthServiceMock.Object, _authenticationServiceMock.Object);

            await _sut.Validate(bookingResponse, memos, null);
            var expectedStatuses = new List<AmendBookingStatus>
            {
                 AmendBookingStatus.NotLoggedAsBookingLeadPassenger
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(false);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(false);
                bookingResponse.AmendmentInfo.Seats.Should().Be(false);
            }
        }

    }
}
using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.B2B.Models;
using easyJet.Holidays.External.B2B.Models.B2BGetBooking;
using easyJet.Holidays.External.B2B.Services;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.B2B.Tests.Services
{
    public class B2BBookingServiceTests
    {
        private readonly IFixture _fixture;
        private readonly IB2BBookingService _sut;
        private readonly Mock<IApiService> _apiServiceMock = new();
        private readonly Mock<IOptions<B2BSettings>> _b2bSettingsMock;
        protected readonly IOptions<BulkToolSettings> _bulkToolSettings;
        private readonly Mock<EndpointsProvider> _endpointsProviderMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<ILogger<B2BBookingService>> _loggerMock;

        public B2BBookingServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            _b2bSettingsMock = _fixture.Freeze<Mock<IOptions<B2BSettings>>>();

            _loggerMock = _fixture.Freeze<Mock<ILogger<B2BBookingService>>>();

            _fixture.Inject(Options.Create(new B2BSettings
            {
                EresUsername = "usr",
                EresPassword = "pwd",
                Url = "b2b://b2b.com:6666/",
                Api = new B2BApiSettings
                {
                    BasicService = "bs",
                    MyService = "ms"
                }
            }));

            _bulkToolSettings = Options.Create(new BulkToolSettings()
            {
                Statuses = new StatusesSettings
                {
                    Booking = "BOOKING",
                    Canceled = "CANCELED",
                    Lock = "LOCK",
                    Option = "OPTION",
                    Quote = "QUOTE"
                }
            });

            var endpointsProvider = _fixture.Create<EndpointsProvider>();

            _sut = new B2BBookingService(_apiServiceMock.Object, _b2bSettingsMock.Object, endpointsProvider, _httpContextAccessorMock.Object, _bulkToolSettings, _loggerMock.Object);
        }

        [Theory]
        [MemberData(nameof(ValidDataInput))]
        public async Task GetBooking_ValidInput_ReturnsValidOutput(BookingResponse bookingResponse, B2BGetBookingResponse b2BGetBookingResponse, B2BData expectedValue)
        {
            _apiServiceMock.Setup(x => x.GetResponseContentAsync<B2BGetBookingRequest, B2BGetBookingResponse>(
                It.IsAny<B2BGetBookingRequest>())).ReturnsAsync(b2BGetBookingResponse);
            var result = await _sut.GetBooking(bookingResponse);

            result.Should().BeEquivalentTo(expectedValue);
        }

        [Theory]
        [MemberData(nameof(ValidDataInputForException))]
        public async Task GetBooking_ValidInput_B2bServiceThrowsException(BookingResponse bookingResponse, B2BData expectedValue)
        {
            _apiServiceMock.Setup(x => x.GetResponseContentAsync<B2BGetBookingRequest, B2BGetBookingResponse>(
                It.IsAny<B2BGetBookingRequest>())).ThrowsAsync(new Exception());

            var result = await _sut.GetBooking(bookingResponse);

            result.Should().BeEquivalentTo(expectedValue);
        }

        public static IEnumerable<object[]> ValidDataInput()
        {
            yield return new object[]
            {
                new BookingResponse
                {
                    Package = new BookingPackage
                    {
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    ExtRefId = "Ext_Ref_1",
                                    Paxs = new List<RoutePax>()
                                }
                            }
                        }
                    },
                    Guests = new List<PersonWithDetails>
                    {
                       new PersonWithDetails
                       {
                           LastName = "LastName_1",
                           IsLead = true,
                       }
                    },
                    BookingStatus = "BOOKING"
                },

                new B2BGetBookingResponse
                {
                    Payload = new XmlApiPayload<B2BApiResponse<BookingRoot>>()
                    {
                        Body = new B2BApiResponse<BookingRoot>
                        {
                            DataListRoot = new BookingRoot
                            {
                                GetBookingSummaryResponse = new B2BData
                                {
                                    Passengers = new Passengers
                                    {
                                        Passenger = new List<Passenger>
                                            {
                                                new Passenger
                                                {
                                                    Itinerary = new Itinerary
                                                    {
                                                        Segment = new List<Segment>
                                                        {
                                                            new Segment
                                                            {

                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                    }
                                }
                            }
                        }
                    }
                },

                new B2BData
                {
                    Passengers = new Passengers
                    {
                        Passenger = new List<Passenger>
                            {
                                new Passenger
                                {
                                    Itinerary = new Itinerary
                                    {
                                        Segment = new List<Segment>
                                        {
                                            new Segment
                                            {

                                            }
                                        }
                                    }
                                }
                            }
                    }
                }
            };
            yield return new object[]
           {
                new BookingResponse
                {
                    Package = new BookingPackage
                    {
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    ExtRefId = "Ext_Ref_1",
                                    Paxs = new List<RoutePax>()
                                }
                            }
                        }
                    },
                    Guests = new List<PersonWithDetails>
                    {
                       new PersonWithDetails
                       {
                           LastName = "LastName_1",
                           IsLead = true,
                       }
                    },
                    BookingStatus = "BOOKING"
                },

                new B2BGetBookingResponse
                {
                    Payload = new XmlApiPayload<B2BApiResponse<BookingRoot>>()
                    {
                        Body = new B2BApiResponse<BookingRoot>
                        {
                            DataListRoot = new BookingRoot
                            {
                                GetBookingSummaryResponse = new B2BData
                                {
                                    Passengers = new Passengers
                                    {
                                        Passenger = new List<Passenger>
                                            {
                                                new Passenger
                                                {
                                                    Itinerary = new Itinerary
                                                    {
                                                        Segment = new List<Segment>
                                                        {
                                                            new Segment
                                                            {

                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                    }
                                }
                            }
                        }
                    }
                },

                new B2BData
                {
                    Passengers = new Passengers
                    {
                        Passenger = new List<Passenger>
                            {
                                new Passenger
                                {
                                    Itinerary = new Itinerary
                                    {
                                        Segment = new List<Segment>
                                        {
                                            new Segment
                                            {

                                            }
                                        }
                                    }
                                }
                            }
                    }
                }
           };
            yield return new object[]
            {
                new BookingResponse
                {
                    Package = new BookingPackage
                    {
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    ExtRefId = "Ext_Ref_1",
                                    Paxs = new List<RoutePax>()
                                }
                            }
                        }
                    },
                    Guests = new List<PersonWithDetails>
                    {
                       new PersonWithDetails
                       {
                           LastName = "LastName_1",
                           IsLead = true,
                       }
                    },
                    BookingStatus = "BOOKING"
                },

                new B2BGetBookingResponse
                {
                    Payload = new XmlApiPayload<B2BApiResponse<BookingRoot>>()
                    {
                        Body = new B2BApiResponse<BookingRoot>
                        {
                            DataListRoot = new BookingRoot
                            {
                                GetBookingSummaryResponse = new B2BData
                                {
                                    Passengers = new Passengers
                                    {
                                        Passenger = new List<Passenger>
                                            {
                                                new Passenger
                                                {
                                                    Itinerary = new Itinerary
                                                    {
                                                        Segment = new List<Segment>
                                                        {
                                                            new Segment
                                                            {
                                                                Disruption = new Disruption
                                                                {
                                                                    Level = "1",
                                                                    UpdatedAt = "2021"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                    }
                                }
                            }
                        }
                    }
                },

                new B2BData
                {
                    Passengers = new Passengers
                    {
                        Passenger = new List<Passenger>
                            {
                                new Passenger
                                {
                                    Itinerary = new Itinerary
                                    {
                                        Segment = new List<Segment>
                                        {
                                            new Segment
                                            {
                                                Disruption = new Disruption
                                                {
                                                    Level = "1",
                                                    UpdatedAt = "2021"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                    }
                }
            };
            yield return new object[]
           {
                new BookingResponse
                {
                    Package = new BookingPackage
                    {
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                }
                            }
                        }
                    },
                    Guests = new List<PersonWithDetails>
                    {
                       new PersonWithDetails
                       {
                           LastName = "LastName_1",
                           IsLead = true,
                       }
                    },
                    BookingStatus = "BOOKING"
                },

                null,

                new B2BData
                {
                }
           };
            yield return new object[]
            {
                new BookingResponse
                {
                    Package = new BookingPackage
                    {
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    ExtRefId = "Ext_Ref_1",
                                    Paxs = new List<RoutePax>()
                                },
                                new Route
                                {
                                    ExtRefId = "Ext_Ref_2",
                                    Paxs = new List<RoutePax>()
                                }
                            }
                        }
                    },
                    Guests = new List<PersonWithDetails>
                    {
                       new PersonWithDetails
                       {
                           LastName = "LastName_1",
                           IsLead = true,
                       }
                    },
                    BookingStatus = "BOOKING"
                },

                new B2BGetBookingResponse
                {
                    Payload = new XmlApiPayload<B2BApiResponse<BookingRoot>>()
                    {
                        Body = new B2BApiResponse<BookingRoot>
                        {
                            DataListRoot = new BookingRoot
                            {
                                GetBookingSummaryResponse = new B2BData
                                {
                                    Passengers = new Passengers
                                    {
                                        Passenger = new List<Passenger>
                                            {
                                                new Passenger
                                                {
                                                    Itinerary = new Itinerary
                                                    {
                                                        Segment = new List<Segment>
                                                        {
                                                            new Segment
                                                            {

                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                    }
                                }
                            }
                        }
                    }
                },

                new B2BData
                {
                    Passengers = new Passengers
                    {
                        Passenger = new List<Passenger>
                            {
                                new Passenger
                                {
                                    Itinerary = new Itinerary
                                    {
                                        Segment = new List<Segment>
                                        {
                                            new Segment
                                            {

                                            }
                                        }
                                    }
                                },
                                new Passenger
                                {
                                    Itinerary = new Itinerary
                                    {
                                        Segment = new List<Segment>
                                        {
                                            new Segment
                                            {

                                            }
                                        }
                                    }
                                }
                            }
                    }
                }
            };
        }
        public static IEnumerable<object[]> ValidDataInputForException()
        {
            yield return new object[]
            {
                new BookingResponse
                {
                    Package = new BookingPackage
                    {
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    ExtRefId = "Ext_Ref_1",
                                    Paxs = new List<RoutePax>()
                                }
                            }
                        }
                    },
                    Guests = new List<PersonWithDetails>
                    {
                       new PersonWithDetails
                       {
                           LastName = "LastName_1",
                           IsLead = true,
                       }
                    },
                    BookingStatus = "BOOKING"
                },

                new B2BData
                {
                    Passengers = new Passengers
                    {
                        Passenger = new List<Passenger>()
                    }
                }
            };
        }
    }
}
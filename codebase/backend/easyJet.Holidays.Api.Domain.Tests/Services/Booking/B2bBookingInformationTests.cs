using easyJet.Holidays.Api.Domain.Data.Booking;
using FluentAssertions;
using FluentAssertions.Execution;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking
{
    public class B2bBookingInformationTests
    {
        [Fact]
        public void IsDisrupted_CompletesSuccessfullyDisrupted()
        {
            //Arrange
            var _sut = new B2BData
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
            };

            //Act
            var result = _sut.IsDisrupted();

            //Assert

            using (new AssertionScope())
            {
                result.Should().BeTrue();
            }
        }

        [Theory]
        [MemberData(nameof(ValidDataInput))]
        public void IsDisrupted_CompletesSuccessfullyNotDisrupted(B2BData _sut)
        {
            //Arrange            
            //Act
            var result = _sut.IsDisrupted();

            //Assert

            using (new AssertionScope())
            {
                result.Should().BeFalse();
            }
        }

        public static IEnumerable<object[]> ValidDataInput()
        {
            yield return new object[]
            {
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
                                    Segment = new List<Segment> { new Segment { } }
                                }
                            }
                        }
                    }
                }
            };

            yield return new object[]
            {
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
                                            Disruption = new Disruption { Level = "", }
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
                new B2BData
                {
                    Passengers = new Passengers
                    {
                        Passenger = new List<Passenger>
                        {
                            new Passenger
                            {
                                Itinerary = new Itinerary { Segment = new List<Segment> { } }
                            }
                        }
                    }
                }
            };

            yield return new object[]
            {
                new B2BData
                {
                    Passengers = new Passengers
                    {
                        Passenger = new List<Passenger> { new Passenger { Itinerary = new Itinerary { } } }
                    }
                }
            };
            yield return new object[]
            {
                new B2BData
                {
                    Passengers = new Passengers { Passenger = new List<Passenger> { new Passenger { } } }
                }
            };
            yield return new object[]
            {
                new B2BData { Passengers = new Passengers { Passenger = new List<Passenger> { } } }
            };
            yield return new object[] { new B2BData { Passengers = new Passengers { } } };
            yield return new object[] { new B2BData { } };
        }
    }
}
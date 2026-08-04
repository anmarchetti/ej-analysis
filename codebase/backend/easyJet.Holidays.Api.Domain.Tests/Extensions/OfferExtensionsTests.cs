using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using FluentAssertions.Execution;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Extensions;

public class OfferExtensionsTests
{
    private IFixture fixture = FixtureUtils.AutoMoqFixture();

    [Fact]
    public void MergeTransferItemTests()
    {
        var offer = fixture.Create<Offer>();
        var transferItem = fixture.Create<TransferItem>();

        offer = offer.MergeTransferItem(transferItem);

        offer.Transfers.Should().BeEquivalentTo(new List<TransferItem> { transferItem });
    }

    [Fact]
    public void MergeTransferItemTests_TransferItemNull()
    {
        var offer = fixture.Create<Offer>();
        var transferItem = (TransferItem)null;

        offer = offer.MergeTransferItem(transferItem);

        offer.Transfers.Should().BeEquivalentTo(new List<TransferItem> { transferItem });
    }

    [Fact]
    public void EnrichWithExtraLuggage_EmptyList()
    {
        var offers = fixture.CreateMany<Offer>(0).ToList();
        var originalBooking = new BookingResponse
        {
            ExtraLuggageInfo = fixture.Create<ExtraLuggageInfo>()
        };

        offers = offers.EnrichWithExtraLuggage(originalBooking);

        offers.Should().BeEmpty();
    }

    [Fact]
    public void EnrichWithExtraLuggage_ExternalFlight_ShouldEnrich()
    {
        var offers = new List<Offer>
        {
            new Offer
            {
                Transport = new Transport
                {
                    Routes = new List<Route>
                    {
                        new Route
                        {
                            IsExternal = true
                        },
                        new Route
                        {
                            IsExternal = true
                        }
                    }
                }
            }
        };
        var extraLuggage = fixture.Create<ExtraLuggageInfo>();
        var originalBooking = new BookingResponse
        {
            ExtraLuggageInfo = extraLuggage
        };

        offers = offers.EnrichWithExtraLuggage(originalBooking);

        using (new AssertionScope())
        {
            offers.Should().NotBeNullOrEmpty();
            offers[0].ExtraLuggageInfo.Should().Be(extraLuggage);
        }
    }

    [Fact]
    public void EnrichWithExtraLuggage_InternalFlight_ShouldBeNullLuggage()
    {
        var offers = new List<Offer>
        {
            new Offer
            {
                Transport = new Transport
                {
                    Routes = new List<Route>
                    {
                        new Route
                        {
                            IsExternal = false
                        },
                        new Route
                        {
                            IsExternal = true
                        }
                    }
                }
            },
            new Offer
            {
                Transport = new Transport
                {
                    Routes = new List<Route>
                    {
                        new Route
                        {
                            IsExternal = false
                        },
                        new Route
                        {
                            IsExternal = false
                        }
                    }
                }
            }
        };
        var extraLuggage = fixture.Create<ExtraLuggageInfo>();
        var originalBooking = new BookingResponse
        {
            ExtraLuggageInfo = extraLuggage
        };

        offers = offers.EnrichWithExtraLuggage(originalBooking);

        using (new AssertionScope())
        {
            offers.Should().NotBeNullOrEmpty();
            offers[0].ExtraLuggageInfo.Should().BeNull();
            offers[1].ExtraLuggageInfo.Should().BeNull();
        }
    }

    [Fact]
    public void SortOffersByOriginalBooking_SortByDepAirport()
    {
        var offers = new List<Offer>
        {
            new Offer
            {
                Transport = new Transport
                {
                    Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepPt = "LGW",
                            DepDate = DateTimeOffset.Now
                        },
                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepPt = "PMI",
                            DepDate = DateTimeOffset.Now
                        }
                    }
                }
            },
            new Offer
            {
                Transport = new Transport
                {
                    Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepPt = "LTN",
                            DepDate = DateTimeOffset.Now
                        },
                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepPt = "PMI",
                            DepDate = DateTimeOffset.Now
                        }
                    }
                }
            }
        };

        var originalBooking = new BookingResponse
        {
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepPt = "LTN",
                            DepDate = DateTimeOffset.Now
                        },
                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepPt = "PMI",
                            DepDate = DateTimeOffset.Now
                        }
                    }
                }
            }
        };

        var sortedOffers = offers.SortOffersByOriginalBooking(originalBooking);

        using (new AssertionScope())
        {
            sortedOffers[0].Should().Be(offers[1]);
            sortedOffers[1].Should().Be(offers[0]);
        }
    }

    [Fact]
    public void SortOffersByOriginalBooking_EmptyList()
    {
        var offers = new List<Offer>();

        var originalBooking = new BookingResponse
        {
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepPt = "LTN",
                            DepDate = DateTimeOffset.Now
                        },
                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepPt = "PMI",
                            DepDate = DateTimeOffset.Now
                        }
                    }
                }
            }
        };

        var sortedOffers = offers.SortOffersByOriginalBooking(originalBooking);

        sortedOffers.Count.Should().Be(0);
    }

    [Fact]
    public void SortByDepartureTime_Success()
    {
        var offers = new List<Offer>
        {
            new Offer
            {
                Transport = new Transport
                {
                    Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepPt = "LGW",
                            DepDate = DateTimeOffset.Now.AddHours(10)
                        },
                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepPt = "PMI",
                            DepDate = DateTimeOffset.Now.AddHours(10)
                        }
                    }
                }
            },
            new Offer
            {
                Transport = new Transport
                {
                    Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepPt = "LTN",
                            DepDate = DateTimeOffset.Now
                        },
                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepPt = "PMI",
                            DepDate = DateTimeOffset.Now
                        }
                    }
                }
            }
        };

        var originalBooking = new BookingResponse
        {
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepPt = "LGW",
                            DepDate = DateTimeOffset.Now
                        },
                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepPt = "PMI",
                            DepDate = DateTimeOffset.Now
                        }
                    }
                }
            }
        };

        var sortedOffers = offers.SortByDepartureTime(originalBooking);

        using (new AssertionScope())
        {
            sortedOffers[0].Should().Be(offers[1]);
            sortedOffers[1].Should().Be(offers[0]);
        }
    }

    [Fact]
    public void SortByPrice_Success()
    {
        var offers = new List<Offer>
        {
            new Offer
            {
                Price = 10000
            },
            new Offer
            {
                Price = 1000
            }
        };
        var sortedOffers = offers.SortByPrice();

        using (new AssertionScope())
        {
            sortedOffers[0].Should().Be(offers[1]);
            sortedOffers[1].Should().Be(offers[0]);
        }
    }

    [Fact]
    public void SortByPrice_EmptyList()
    {
        var offers = new List<Offer>();
        var sortedOffers = offers.SortByPrice();

        sortedOffers.Count.Should().Be(0);
    }

    [Fact]
    public void Paginate_ReturnsEmptyList_WhenOffersIsNull()
    {
        // Arrange
        IEnumerable<Offer> offers = null;

        // Act
        var result = offers.Paginate(1, 10);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public void Paginate_ReturnsEmptyList_WhenOffersIsEmpty()
    {
        // Arrange
        var offers = new List<Offer>();

        // Act
        var result = offers.Paginate(1, 10);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public void Paginate_ReturnsCorrectItems_WhenOffersIsNotEmpty()
    {
        // Arrange
        var offers = new List<Offer>
        {
            new Offer { Price = 10 },
            new Offer { Price = 20 },
            new Offer { Price = 30 },
            new Offer { Price = 40 },
            new Offer { Price = 50 }
        };

        // Act
        var result = offers.Paginate(2, 2);

        // Assert
        Assert.Equal(2, result.Count());
        Assert.Equal(30, result.First().Price);
        Assert.Equal(40, result.Last().Price);
    }
}
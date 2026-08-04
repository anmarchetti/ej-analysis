using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Extensions;

public class BookingResponseExctensionsTests
{
    private IFixture fixture = FixtureUtils.AutoMoqFixture();

    [Fact]
    public void MergeWithOffer_OfferIsNull_ThrowException()
    {
        var booking = new BookingResponse();
        var offer = (Offer)null;

        Func<BookingResponse> act = () => booking.MergeWithOffer(offer);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void MergeWithOffer()
    {
        var booking = new BookingResponse
        {
            Transfers = fixture.CreateMany<TransferItem>(1).ToList(),
            AmendmentInfo = fixture.Create<AmendmentsInfo>(),
            Package = fixture.Create<BookingPackage>(),
            SeatSelection = fixture.CreateMany<SeatMap>(2).ToList()
        };

        var offer = fixture.Create<Offer>();

        var result = booking.MergeWithOffer(offer);

        result.Transfers.Should().BeEquivalentTo(offer.Transfers);
        result.SeatSelection.Should().BeEquivalentTo(offer.SeatSelection);
        result.Package.Transport.Should().BeEquivalentTo(offer.Transport);
        result.Package.Accom.Rooms.Should().BeEquivalentTo(offer.Accom.Unit);

        result.Package.Accom.StartDate.Should().Be(DateFormatUtils.DateOnly(offer.Accom.Date));
        result.Package.Accom.EndDate.Should().Be(DateFormatUtils.DateOnly(offer.Accom.Date.Date.AddDays(offer.Accom.Stay)));
    }

    [Fact]
    public void UpdatePromoCode()
    {
        var booking = new BookingResponse
        {
            AmendmentInfo = fixture.Create<AmendmentsInfo>(),
        };

        var discountCode = fixture.Create<string>();

        var result = booking.UpdatePromoCode(discountCode);

        result.AmendmentInfo.PromoCode.Should().BeEquivalentTo(discountCode);
    }

    [Theory]
    [MemberData(nameof(ValidData))]
    public void GetAllExternalPnrs(BookingResponse bookingResponse, List<string> expected)
    {
        var result = bookingResponse.GetAllExternalPnrs();

        result.Should().BeEquivalentTo(expected);
    }

    public static IEnumerable<object[]> ValidData()
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
                    }
                },

                new List<string>
                {
                    "Ext_Ref_1"
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
                                    Paxs = new List<RoutePax>()
                                    {
                                        new RoutePax
                                        {
                                            ExternalPNR = "Ext_Ref_1"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },

                new List<string>
                {
                    "Ext_Ref_1"
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
                                    Paxs = new List<RoutePax>()
                                    {
                                        new RoutePax
                                        {
                                            ExternalPNR = "Ext_Ref_1"
                                        },
                                        new RoutePax
                                        {
                                            ExternalPNR = "Ext_Ref_2"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },

                new List<string>
                {
                    "Ext_Ref_1",
                    "Ext_Ref_2"
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
                                    ExtRefId = "Route_ref",
                                    Paxs = new List<RoutePax>()
                                    {
                                        new RoutePax
                                        {
                                            ExternalPNR = "Ext_Ref_1"
                                        },
                                        new RoutePax
                                        {
                                            ExternalPNR = "Ext_Ref_2"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },

                new List<string>
                {
                    "Route_ref",
                    "Ext_Ref_1",
                    "Ext_Ref_2"
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
                                    Paxs = new List<RoutePax>()
                                }
                            }
                        }
                    }
                },

                new List<string>
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
                                    ExtRefId = "Ext_Ref_1",
                                    Paxs = new List<RoutePax>()
                                }
                            }
                        }
                    }
                },

                new List<string>
                {
                    "Ext_Ref_1"
                }
        };
    }
}
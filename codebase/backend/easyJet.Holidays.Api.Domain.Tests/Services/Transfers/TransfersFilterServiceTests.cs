using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Transfers
{
    public class TransfersFilterServiceTests
    {

        private static readonly DateTime DateTimeNow = new DateTime(DateTime.Now.Year, DateTime.Now.Month, DateTime.Now.Day);

        [Theory]
        [MemberData(nameof(FilterBookingTransfersData))]
        public async Task FilterBookingTransfers(IEnumerable<TransferItem> transfers, Offer offer, IEnumerable<string> codes, IEnumerable<TransferItem> result)
        {
            var service = new TransfersFilterService(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { DefaultTimezoneId = "GMT Standard Time", DisableTransfersInHours = 24 } }));

            var res = service.FilterBookingTransfers(transfers, offer, codes);
            res.Should().BeEquivalentTo(result);
        }

        [Theory]
        [MemberData(nameof(HideTransfersIfNeededMultipleOffersData))]
        public async Task HideTransfersIfNeededMultipleOffers(List<Offer> offers, List<Offer> offersRes)
        {
            var service = new TransfersFilterService(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { DefaultTimezoneId = "GMT Standard Time", DisableTransfersInHours = 24 } }));

            service.HideTransfersIfNeeded(offers);
            offers.Should().BeEquivalentTo(offersRes);
        }

        public static IEnumerable<object[]> FilterBookingTransfersData()
        {
            yield return new object[] {
                new List<TransferItem>() {
                    new TransferItem()
                    {
                        Code = "TESTS",
                        Type = TransferItemType.Shared
                    },
                },
                new Offer()
                {
                    Transport = new Transport()
                    {
                        Routes = new List<Route>()
                        {
                            new Route()
                            {
                                Direction = Direction.Outbound,
                                DepDate = DateTimeNow.AddDays(100),
                            }
                        }
                    }
                },
                null,
                new List<TransferItem>() {
                    new TransferItem()
                    {
                        Code = "TESTS",
                        Type = TransferItemType.Shared
                    },
                },
            };

            yield return new object[] {
                new List<TransferItem>() {
                    new TransferItem()
                    {
                        Code = "TESTS",
                        Type = TransferItemType.Shared
                    },
                     new TransferItem()
                    {
                        Code = "TESTP",
                        Type = TransferItemType.Private
                    },
                },
                new Offer()
                {
                    Transport = new Transport()
                    {
                        Routes = new List<Route>()
                        {
                            new Route()
                            {
                                Direction = Direction.Outbound,
                                DepDate = DateTimeNow.AddDays(100),
                            }
                        }
                    }
                },
                new List<string>() { "TESTS"},
                new List<TransferItem>() {
                    new TransferItem()
                    {
                        Code = "TESTS",
                        Type = TransferItemType.Shared
                    },
                },
            };

            yield return new object[] {
                new List<TransferItem>() {
                    new TransferItem()
                    {
                        Code = "TESTS",
                        Type = TransferItemType.Shared
                    },
                     new TransferItem()
                    {
                        Code = "TESTH",
                        Type = TransferItemType.NoTransfer
                    },
                },
                new Offer()
                {
                    Transport = new Transport()
                    {
                        Routes = new List<Route>()
                        {
                            new Route()
                            {
                                Direction = Direction.Outbound,
                                DepDate = DateTimeNow,
                            }
                        }
                    }
                },
                null,
                new List<TransferItem>() {
                    new TransferItem()
                    {
                        Code = "TESTH",
                        Type = TransferItemType.NoTransfer,
                        IsHidden = true,
                    },
                },
            };

        }

        public static IEnumerable<object[]> HideTransfersIfNeededData()
        {
            yield return new object[] {
                new Offer()
                {
                    Transport = new Transport()
                    {
                        Routes = new List<Route>()
                        {
                            new Route()
                            {
                                Direction = Direction.Outbound,
                                DepDate = DateTimeNow.AddDays(100),
                            }
                        }
                    },
                    Transfers = new List<TransferItem>()
                    {
                        new TransferItem()
                        {
                            Code = "TESTS",
                            Type = TransferItemType.Shared,
                        }
                    }
                },
                new Offer()
                {
                    Transport = new Transport()
                    {
                        Routes = new List<Route>()
                        {
                            new Route()
                            {
                                Direction = Direction.Outbound,
                                DepDate = DateTimeNow.AddDays(100),
                            }
                        }
                    },
                    Transfers = new List<TransferItem>()
                    {
                        new TransferItem()
                        {
                            Code = "TESTS",
                            Type = TransferItemType.Shared,
                        }
                    }
                },
            };

            yield return new object[] {
                new Offer()
                {
                    Transport = new Transport()
                    {
                        Routes = new List<Route>()
                        {
                            new Route()
                            {
                                Direction = Direction.Outbound,
                                DepDate = DateTimeNow,
                            }
                        }
                    },
                    Transfers = new List<TransferItem>()
                    {
                        new TransferItem()
                        {
                            Code = "TESTS",
                            Type = TransferItemType.Shared,
                        }
                    }
                },
                new Offer()
                {
                    Transport = new Transport()
                    {
                        Routes = new List<Route>()
                        {
                            new Route()
                            {
                                Direction = Direction.Outbound,
                                DepDate = DateTimeNow,
                            }
                        }
                    },
                    Transfers = new List<TransferItem>()
                    {
                        new TransferItem()
                        {
                            Code = "TESTS",
                            Type = TransferItemType.Shared,
                            IsHidden = true,
                        }
                    }
                },
            };
        }

        public static IEnumerable<object[]> HideTransfersIfNeededMultipleOffersData()
        {
            yield return new object[] {
                new List<Offer>(){
                    new Offer()
                    {
                        Transport = new Transport()
                        {
                            Routes = new List<Route>()
                            {
                                new Route()
                                {
                                    Direction = Direction.Outbound,
                                    DepDate = DateTimeNow.AddDays(100),
                                }
                            }
                        },
                        Transfers = new List<TransferItem>()
                        {
                            new TransferItem()
                            {
                                Code = "TESTS",
                                Type = TransferItemType.Shared,
                            }
                        }
                    }
                },
                new List<Offer>(){
                    new Offer()
                    {
                        Transport = new Transport()
                        {
                            Routes = new List<Route>()
                            {
                                new Route()
                                {
                                    Direction = Direction.Outbound,
                                    DepDate = DateTimeNow.AddDays(100),
                                }
                            }
                        },
                        Transfers = new List<TransferItem>()
                        {
                            new TransferItem()
                            {
                                Code = "TESTS",
                                Type = TransferItemType.Shared,
                            }
                        }
                    },
                }
            };

            yield return new object[] {
                new List<Offer>(){
                    new Offer()
                    {
                        Transport = new Transport()
                        {
                            Routes = new List<Route>()
                            {
                                new Route()
                                {
                                    Direction = Direction.Outbound,
                                    DepDate = DateTimeNow,
                                }
                            }
                        },
                        Transfers = new List<TransferItem>()
                        {
                            new TransferItem()
                            {
                                Code = "TESTS",
                                Type = TransferItemType.Shared,
                            }
                        }
                    }
                },
                new List<Offer>(){
                    new Offer()
                    {
                        Transport = new Transport()
                        {
                            Routes = new List<Route>()
                            {
                                new Route()
                                {
                                    Direction = Direction.Outbound,
                                    DepDate = DateTimeNow,
                                }
                            }
                        },
                        Transfers = new List<TransferItem>()
                        {
                            new TransferItem()
                            {
                                Code = "TESTS",
                                Type = TransferItemType.Shared,
                                IsHidden = true,
                            }
                        }
                    },
                }
            };
        }
    }
}

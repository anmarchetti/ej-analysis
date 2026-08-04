using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Services.Search;
using FluentAssertions;
using Xunit;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.External.Atcom.Tests.Services.Search
{
    public class SearchAvailablePackagesAggregatorTests
    {
        [Fact]
        public void RecalculateGuestIds_NullValue_NotThrowException()
        {
            // Arrange
            Action nullArg = () => SearchAvailablePackagesAggregator.RecalculateGuestIds(null);

            // Assert

            nullArg.Should().NotThrow();
        }

        // Expect IDs to be in order: adults, children, infants
        [Fact]
        public void RecalculateGuestIds_ValidData_IdsInOrder_AdultsChildrenInfants()
        {
            // Arrange
            var units = new List<Unit>() {
                new Unit {
                    Occupation = new Occupation {
                        Adults = 2,
                        Children=1,
                        Infants=1,
                        PaxIds = new List<int>() {
                            1,2,3,4
                        }
                    }
                },
                new Unit {
                    Occupation = new Occupation {
                        Adults = 1,
                        Children=1,
                        PaxIds = new List<int>() {
                            5,6
                        }
                    }
                },
                new Unit {
                    Occupation = new Occupation {
                        Adults = 1,
                        Infants=1,
                        PaxIds = new List<int>() {
                            7,8
                        }
                    }
                }
            };

            var expected = new List<Unit>() {
                new Unit {
                    Occupation = new Occupation {
                        Adults = 2,
                        Children=1,
                        Infants=1,
                        PaxIds = new List<int>() {
                            1, 2, 5, 7
                        }
                    }
                },
                new Unit {
                    Occupation = new Occupation {
                        Adults = 1,
                        Children=1,
                        PaxIds = new List<int>() {
                            3, 6,
                        }
                    }
                },
                new Unit {
                    Occupation = new Occupation {
                        Adults = 1,
                        Infants=1,
                        PaxIds = new List<int>() {
                            4, 8
                        }
                    }
                }
            };

            // Act
            SearchAvailablePackagesAggregator.RecalculateGuestIds(units);

            // Assert
            units.Should().BeEquivalentTo(expected);
        }

        [Fact]
        public void AggregateSingleUnitAccommodations_FreeKids_NotIncludedInPricePerPerson()
        {
            var price = 5000;
            var numberOfPax = 6;
            var freeKidsUnits = 1;
            var expectedPpPrice = price / (numberOfPax - freeKidsUnits);

            var responses = new List<SearchOffersResponse>
            {
                new()
                {
                    Offers = new List<Offer>
                    {
                        new()
                        {
                            Price = price,
                            Accom = new Accom
                            {
                                PackageId = "id",
                                Unit = new List<Unit>()
                                {
                                    new()
                                    {
                                        Occupation = new Occupation
                                        {
                                            Adults = 2,
                                            Children = 1,
                                            PaxIds = new List<int>() {1, 2, 3}
                                        },
                                        FreeForKids = true // single free kids place
                                    },
                                    new()
                                    {
                                        Occupation = new Occupation
                                        {
                                            Adults = 2,
                                            Children = 1,
                                            PaxIds = new List<int>() {4, 5, 6}
                                        },
                                        FreeForKids = false
                                    },
                                }
                            }
                        }
                    }
                }
            };
            var targetResponse = responses.First();

            // Arrange
            SearchAvailablePackagesAggregator.AggregateSingleUnitAccommodations(responses, numberOfPax, targetResponse);

            // Assert

            targetResponse.Offers.First().PricePP.Should().Be(expectedPpPrice);
        }

        [Fact]
        public void AggregateSingleUnitAccommodations_NullResponses_DoesNotModifyTarget()
        {
            // Arrange
            var targetResponse = new SearchOffersResponse
            {
                Offers = new List<Offer>
                {
                    new()
                    {
                        Price = 100m,
                        PricePP = 50m,
                        Accom = new Accom
                        {
                            PackageId = "pkg-1",
                            Unit = new List<Unit>()
                        }
                    }
                }
            };

            // Act
            SearchAvailablePackagesAggregator.AggregateSingleUnitAccommodations(null, 2, targetResponse);

            // Assert
            targetResponse.Offers.Single().Price.Should().Be(100m);
            targetResponse.Offers.Single().PricePP.Should().Be(50m);
        }

        [Fact]
        public void AggregateSingleUnitAccommodations_EmptyResponses_DoesNotModifyTarget()
        {
            // Arrange
            var targetResponse = new SearchOffersResponse
            {
                Offers = new List<Offer>
                {
                    new()
                    {
                        Price = 200m,
                        PricePP = 100m,
                        Accom = new Accom
                        {
                            PackageId = "pkg-2",
                            Unit = new List<Unit>()
                        }
                    }
                }
            };

            // Act
            SearchAvailablePackagesAggregator.AggregateSingleUnitAccommodations(new List<SearchOffersResponse>(), 2, targetResponse);

            // Assert
            targetResponse.Offers.Single().Price.Should().Be(200m);
            targetResponse.Offers.Single().PricePP.Should().Be(100m);
        }

        [Fact]
        public void AggregateSingleUnitAccommodations_OfferNotMatchedByPackageId_OfferRemainsUnchanged()
        {
            // Arrange
            var targetOffer = new Offer
            {
                Price = 100,
                PricePP = 50,
                Accom = new Accom
                {
                    PackageId = "target-package",
                    Unit = new List<Unit>
                    {
                        new()
                        {
                            Occupation = new Occupation
                            {
                                Adults = 2,
                                PaxIds = new List<int> { 1, 2 }
                            }
                        }
                    }
                }
            };

            var responses = new List<SearchOffersResponse>
            {
                new()
                {
                    Offers = new List<Offer>
                    {
                        new()
                        {
                            Price = 500,
                            Accom = new Accom
                            {
                                PackageId = "different-package",
                                Unit = new List<Unit>
                                {
                                    new()
                                    {
                                        Occupation = new Occupation
                                        {
                                            Adults = 2,
                                            PaxIds = new List<int> { 1, 2 }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };

            var targetResponse = new SearchOffersResponse
            {
                Offers = new List<Offer> { targetOffer }
            };

            // Act
            SearchAvailablePackagesAggregator.AggregateSingleUnitAccommodations(responses, 2, targetResponse);

            // Assert
            targetResponse.Offers.Single().Price.Should().Be(100);
            targetResponse.Offers.Single().PricePP.Should().Be(50);
            targetResponse.Offers.Single().Accom.Unit.Should().HaveCount(1);
        }

        [Fact]
        public void AggregateSingleUnitAccommodations_MultiCurrencyTaxesAndFees_AggregatesExpectedValues()
        {
            // Arrange
            var numberOfPax = 4;
            var responses = new List<SearchOffersResponse>
            {
                new()
                {
                    Offers = new List<Offer>
                    {
                        new()
                        {
                            Price = 1000m,
                            TouristTax = 35m,
                            TouristTaxPP = 8.75m,
                            PriceExcludingTouristTax = 965m,
                            PricePPExcludingTouristTax = 241.25m,
                            Accom = new Accom
                            {
                                PackageId = "pkg-1",
                                Unit = new List<Unit>
                                {
                                    new()
                                    {
                                        FreeForKids = true,
                                        Occupation = new Occupation
                                        {
                                            Adults = 2,
                                            Children = 1,
                                            PaxIds = new List<int> { 1, 2, 3 }
                                        }
                                    }
                                }
                            },
                            AltBoards = new List<AltBoardType>
                            {
                                new() { Code = "HB", Price = 120m },
                                new() { Code = "AI", Price = 200m }
                            },
                            Transfers = new List<TransferItem>
                            {
                                new() { Code = "SHARED", Quantity = 1 },
                                new() { Code = "PRIVATE", Quantity = 1 }
                            },
                            TaxesAndFees = new Dictionary<string, TaxesAndFeesSummary>
                            {
                                ["es-tax"] = new TaxesAndFeesSummary
                                {
                                    Currency = "EUR",
                                    ExchRt = 1m,
                                    TotalLocalPrice = 10m,
                                    TotalLocalPricePP = 2.5m
                                },
                                ["eg-fee"] = new TaxesAndFeesSummary
                                {
                                    Currency = "EGP",
                                    ExchRt = 0.016m,
                                    TotalLocalPrice = 300m,
                                    TotalLocalPricePP = 75m
                                },
                                ["us-fee"] = new TaxesAndFeesSummary
                                {
                                    Currency = "USD",
                                    ExchRt = 0.8m,
                                    TotalLocalPrice = 20m,
                                    TotalLocalPricePP = 5m
                                }
                            }
                        }
                    }
                },
                new()
                {
                    Offers = new List<Offer>
                    {
                        new()
                        {
                            Price = 500m,
                            TouristTax = 15m,
                            TouristTaxPP = 3.75m,
                            PriceExcludingTouristTax = 485m,
                            PricePPExcludingTouristTax = 121.25m,
                            Accom = new Accom
                            {
                                PackageId = "pkg-1",
                                Unit = new List<Unit>
                                {
                                    new()
                                    {
                                        FreeForKids = false,
                                        Occupation = new Occupation
                                        {
                                            Adults = 1,
                                            Children = 0,
                                            PaxIds = new List<int> { 4 }
                                        }
                                    }
                                }
                            },
                            AltBoards = new List<AltBoardType>
                            {
                                new() { Code = "HB", Price = 80m },
                                new() { Code = "AI", Price = 50m }
                            },
                            Transfers = new List<TransferItem>
                            {
                                new() { Code = "SHARED", Quantity = 2 }
                            },
                            TaxesAndFees = new Dictionary<string, TaxesAndFeesSummary>
                            {
                                ["es-tax"] = new TaxesAndFeesSummary
                                {
                                    Currency = "EUR",
                                    ExchRt = 1m,
                                    TotalLocalPrice = 5m,
                                    TotalLocalPricePP = 1.25m
                                },
                                ["eg-fee"] = new TaxesAndFeesSummary
                                {
                                    Currency = "EGP",
                                    ExchRt = 0.016m,
                                    TotalLocalPrice = 100m,
                                    TotalLocalPricePP = 25m
                                },
                                ["us-fee"] = new TaxesAndFeesSummary
                                {
                                    Currency = "USD",
                                    ExchRt = 0.8m,
                                    TotalLocalPrice = 10m,
                                    TotalLocalPricePP = 2.5m
                                }
                            }
                        }
                    }
                }
            };

            var targetResponse = responses.First();

            // Act
            SearchAvailablePackagesAggregator.AggregateSingleUnitAccommodations(responses, numberOfPax, targetResponse);

            // Assert
            var aggregatedOffer = targetResponse.Offers.Single();
            aggregatedOffer.Accom.Unit.Should().HaveCount(2);
            aggregatedOffer.Price.Should().Be(1500m);
            aggregatedOffer.PricePP.Should().Be(500m);
            aggregatedOffer.TouristTax.Should().Be(50m);
            aggregatedOffer.TouristTaxPP.Should().Be(8.75M);
            aggregatedOffer.PriceExcludingTouristTax.Should().Be(1450m);
            aggregatedOffer.PricePPExcludingTouristTax.Should().Be(241.25M);

            aggregatedOffer.TaxesAndFees.Should().HaveCount(3);
            aggregatedOffer.TaxesAndFees["es-tax"].Currency.Should().Be("EUR");
            aggregatedOffer.TaxesAndFees["es-tax"].TotalLocalPrice.Should().Be(15m);
            aggregatedOffer.TaxesAndFees["es-tax"].TotalLocalPricePP.Should().Be(3.75m);
            aggregatedOffer.TaxesAndFees["eg-fee"].Currency.Should().Be("EGP");
            aggregatedOffer.TaxesAndFees["eg-fee"].TotalLocalPrice.Should().Be(400m);
            aggregatedOffer.TaxesAndFees["eg-fee"].TotalLocalPricePP.Should().Be(100m);
            aggregatedOffer.TaxesAndFees["us-fee"].Currency.Should().Be("USD");
            aggregatedOffer.TaxesAndFees["us-fee"].TotalLocalPrice.Should().Be(30m);
            aggregatedOffer.TaxesAndFees["us-fee"].TotalLocalPricePP.Should().Be(7.5m);

            aggregatedOffer.AltBoards.Should().NotBeNull();
            aggregatedOffer.AltBoards.Should().ContainSingle(x => x.Code == "HB" && x.Price == 200m && x.PricePP == 200m / 3m);
            aggregatedOffer.AltBoards.Should().ContainSingle(x => x.Code == "AI" && x.Price == 250m && x.PricePP == 250m / 3m);

            aggregatedOffer.Transfers.Should().HaveCount(2);
            aggregatedOffer.Transfers.Should().ContainSingle(x => x.Code == "SHARED" && x.Quantity == 3);
            aggregatedOffer.Transfers.Should().ContainSingle(x => x.Code == "PRIVATE" && x.Quantity == 1);
        }
    }
}

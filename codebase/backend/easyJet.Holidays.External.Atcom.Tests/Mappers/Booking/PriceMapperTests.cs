using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Seat = easyJet.Holidays.Api.Domain.Data.Booking.Seat;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Booking
{
    public class PriceMapperTests
    {
        private IFixture _fixture { get; set; }
        private PriceMapper _sut { get; set; }

        public PriceMapperTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _fixture.Inject(Options.Create(new AtcomSettings
            {
                CustomerAgencyNo = new List<string> { "CustomerAgencyNo" },
                PaymentCodes = new Dictionary<string, PaymentCodesSettings>{{"CR", new PaymentCodesSettings
                {
                    Redeemed = new PaymentTypeSettings
                    {
                        Code = "CR",
                        Group = "CA"
                    },
                    Issued = new PaymentTypeSettings
                    {
                        Code = "CI",
                        Group = "CA"
                    }
                }}}
            }));
            _fixture.Inject(Options.Create(new ApiSettings
            {
                Vouchers = new VoucherSettings
                {
                    Types = new VoucherTypeSettings
                    {
                        GiftCard = "giftcard"
                    },
                    PromoVouchers = new VoucherReasonSettings()
                    {
                        Types = new List<string>() { "marketing" }
                    }
                }
            }));

            var tradeAgentAuthService = new Mock<ITradeAgentAuthenticationService>();
            tradeAgentAuthService.Setup(s => s.GetCurrentAgent()).Returns(new AgentDetails { Number = "1" });
            tradeAgentAuthService.Setup(service => service.IsTradePortalEnv()).Returns(true);
            tradeAgentAuthService.Setup(service => service.IsLoggedInAsTradeAgent()).Returns(true);
            _fixture.Inject(tradeAgentAuthService);

            _sut = _fixture.Freeze<PriceMapper>();
        }

        [Theory]
        [MemberData(nameof(PriceMapperTestsData.Map_NullResponse), MemberType = typeof(PriceMapperTestsData))]
        public void Map_Empty_Prices(Bkg_Ent bookingEntity, Dictionary<string, PriceBreakdownCategory> priceCategories)
        {
            // Act
            var actual = _sut.MapPriceBreakdown(bookingEntity, priceCategories);

            // Assert
            actual.Should().NotBeNull();
            actual.Length.Should().Be(0);
        }

        [Theory]
        [MemberData(nameof(PriceMapperTestsData.Map_DefaultCategory), MemberType = typeof(PriceMapperTestsData))]
        public void Map_EmptyPrices_DefaultCategory(Bkg_Ent bookingEntity, Dictionary<string, PriceBreakdownCategory> priceCategories)
        {
            // Act
            var actual = _sut.MapPriceBreakdown(bookingEntity, priceCategories);

            // Assert
            actual.Should().NotBeNull();
            actual.Length.Should().Be(1);
            actual[0].Code.Should().Be("Holiday");
        }

        [Theory]
        [MemberData(nameof(PriceMapperTestsData.Map_UnexpectedPricesDefaultCategory), MemberType = typeof(PriceMapperTestsData))]
        public void Map_UnexpectedPricesIntoDefaultCategory(Bkg_Ent bookingEntity, Dictionary<string, PriceBreakdownCategory> priceCategories)
        {
            // Act
            var actual = _sut.MapPriceBreakdown(bookingEntity, priceCategories);

            // Assert
            actual.Should().NotBeNull();
            actual.Length.Should().Be(1);
            actual[0].Code.Should().Be("Holiday");
            actual[0].Amount.Should().Be(30);
        }


        [Theory]
        [MemberData(nameof(PriceMapperTestsData.Map_Discounts_CaseNotSensitive_SummCorrect), MemberType = typeof(PriceMapperTestsData))]
        public void Map_Discounts_CaseNotSensitive_SummCorrect(Bkg_Ent bookingEntity, Dictionary<string, PriceBreakdownCategory> priceCategories)
        {
            // Act
            var actual = _sut.MapPriceBreakdown(bookingEntity, priceCategories);

            // Assert
            actual.Should().NotBeNull();
            actual.Length.Should().Be(2);
            actual[0].Code.Should().Be("Holiday");
            actual[1].Code.Should().Be("DSCT");
            actual[1].Name.Should().Be("Online Discount");
            actual[1].Amount.Should().Be(-30);
        }

        [Theory]
        [MemberData(nameof(PriceMapperTestsData.Map_ForTradeAgentNoDefaultCategory), MemberType = typeof(PriceMapperTestsData))]
        public void Map_ForTradeAgentNoDefaultCategory(Bkg_Ent bookingEntity, Dictionary<string, PriceBreakdownCategory> priceCategories)
        {
            // Act
            var actual = _sut.MapTradeAgentPriceBreakdown(bookingEntity, priceCategories);
            // Assert
            actual.Should().NotBeNull();
            actual.Length.Should().Be(2);

            actual[0].Code.Should().Be("ACC");
            actual[0].Name.Should().Be("Package Price");
            actual[0].Amount.Should().Be(2000);
            actual[0].Quantity.Should().Be(2);

            actual[1].Code.Should().Be("TAX");
            actual[1].Name.Should().Be("Flight Tax");
            actual[1].Amount.Should().Be(30);
            actual[1].Quantity.Should().Be(2);
        }

        [Theory]
        [MemberData(nameof(PriceMapperTestsData.Map_Currency), MemberType = typeof(PriceMapperTestsData))]
        public void Map_Currency(Bkg_Ent bookingEntity)
        {
            var actual = _sut.MapCurrency(bookingEntity);

            actual.Should().NotBeNull();
            actual.Code.Should().Be("CHF");
        }

        [Fact]
        public void MapTaxesAndFees_WithNullRooms_ReturnsEmpty()
        {
            // Act
            var result = _sut.MapTaxesAndFees(null);

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public void MapTaxesAndFees_GroupsByExchangeRate_AndAppliesQuantityPerLine()
        {
            // Arrange
            var rooms = new[]
            {
                CreateRoom("TT01", "Tax 1", "1.2", "10.00", "8.33", "2", "EUR", "GBP"),
                CreateRoom("TT02", "Tax 2", "1.2", "5.00", "4.17", "3", "EUR", "GBP"),
                CreateRoom("TT03", "Tax 3", "1.5", "7.00", "4.67", "1", "USD", "GBP")
            };

            // Act
            var result = _sut.MapTaxesAndFees(rooms);

            // Assert
            result.Should().HaveCount(2);

            var group12 = result.Single(x => x.ExchangeRate == 1.2m);
            group12.PaylocalAmount.Should().Be(35m); // 10*2 + 5*3
            group12.PaylocalAmountConverted.Should().Be(29.17m); // 8.33*2 + 4.17*3
            group12.PaylocalAmountCurrency.Should().Be("EUR");
            group12.PaylocalAmountConvertedCurrency.Should().Be("GBP");

            var group15 = result.Single(x => x.ExchangeRate == 1.5m);
            group15.PaylocalAmount.Should().Be(7m);
            group15.PaylocalAmountConverted.Should().Be(4.67m);
            group15.PaylocalAmountCurrency.Should().Be("USD");
            group15.PaylocalAmountConvertedCurrency.Should().Be("GBP");
        }

        [Fact]
        public void MapTaxesAndFees_UsesPrcTextValueWhenAmtMissing()
        {
            // Arrange
            var rooms = new[]
            {
                new Rm_Cd
                {
                    Info_Prices = new Info_Prices
                    {
                        Info_Price = new Info_Price
                        {
                            Prc_Cd = "TT10",
                            Prc_Cd_Name = "Tax text value",
                            Exch_Rate = "1.1",
                            Qty = "2",
                            Prc = new Prc
                            {
                                Amt = null,
                                Value = "12.50",
                                CurISO = null,
                                CurISOAttribute = "EUR"
                            },
                            Est_Prc = new Est_Prc
                            {
                                Value = "11.25",
                                CurISO = "GBP"
                            }
                        }
                    }
                }
            };

            // Act
            var result = _sut.MapTaxesAndFees(rooms);

            // Assert
            result.Should().ContainSingle();
            result[0].PaylocalAmount.Should().Be(25m);
            result[0].PaylocalAmountCurrency.Should().Be("EUR");
            result[0].PaylocalAmountConverted.Should().Be(22.5m);
            result[0].PaylocalAmountConvertedCurrency.Should().Be("GBP");
        }

        [Fact]
        public void MapTaxesAndFees_IgnoresRoomsWithoutInfoPrice()
        {
            // Arrange
            var rooms = new[]
            {
                new Rm_Cd(),
                new Rm_Cd { Info_Prices = new Info_Prices() },
                CreateRoom("TT11", "Tax", "1.0", "10", "10", "1", "EUR", "EUR")
            };

            // Act
            var result = _sut.MapTaxesAndFees(rooms);

            // Assert
            result.Should().ContainSingle();
            result[0].PaylocalAmount.Should().Be(10m);
            result[0].PaylocalAmountConverted.Should().Be(10m);
        }

        [Fact]
        public void MapTaxesAndFees_WithInvalidNumericValues_DefaultsToZero()
        {
            // Arrange
            var rooms = new[]
            {
                CreateRoom("TT12", "Tax invalid", "bad-rate", "bad-amt", "bad-converted", "bad-qty", "EUR", "GBP")
            };

            // Act
            var result = _sut.MapTaxesAndFees(rooms);

            // Assert
            result.Should().ContainSingle();
            result[0].ExchangeRate.Should().Be(0m);
            result[0].PaylocalAmount.Should().Be(0m);
            result[0].PaylocalAmountConverted.Should().Be(0m);
        }

        [Fact]
        public void MapTaxesAndFees_WithMultipleCurrencies_SeparatesTotalsPerCurrency()
        {
            // Arrange
            var rooms = new[]
            {
                CreateRoom("TT20", "Tax EUR 1", "1.2", "10.00", "8.33", "2", "EUR", "GBP"),
                CreateRoom("TT21", "Tax EUR 2", "1.2", "5.00", "4.17", "1", "EUR", "GBP"),
                CreateRoom("TT22", "Tax USD", "1.3", "7.00", "5.83", "3", "USD", "GBP"),
                CreateRoom("TT22", "Tax USD", "1.3", "7.00", "5.83", "3", "USD", "GBP"),
                CreateRoom("TT22", "Tax CHF", "1.5", "7.00", "5.83", "3", "CHF", "GBP"),
                CreateRoom("TT22", "Tax CHF", "1.5", "7.00", "5.83", "3", "CHF", "GBP")
            };

            // Act
            var result = _sut.MapTaxesAndFees(rooms);

            // Assert
            result.Should().HaveCount(3);

            var eurGroup = result.Single(x => x.PaylocalAmountCurrency == "EUR");
            eurGroup.ExchangeRate.Should().Be(1.2m);
            eurGroup.PaylocalAmount.Should().Be(25m); // 10*2 + 5*1
            eurGroup.PaylocalAmountConverted.Should().Be(20.83m); // 8.33*2 + 4.17*1
            eurGroup.PaylocalAmountConvertedCurrency.Should().Be("GBP");

            var usdGroup = result.Single(x => x.PaylocalAmountCurrency == "USD");
            usdGroup.ExchangeRate.Should().Be(1.3m);
            usdGroup.PaylocalAmount.Should().Be(42m); // 7*3
            usdGroup.PaylocalAmountConverted.Should().Be(34.98m); // 5.83*3
            usdGroup.PaylocalAmountConvertedCurrency.Should().Be("GBP");
            
            var chfGroup = result.Single(x => x.PaylocalAmountCurrency == "CHF");
            chfGroup.ExchangeRate.Should().Be(1.5m);
            chfGroup.PaylocalAmount.Should().Be(42m); // 7*3
            chfGroup.PaylocalAmountConverted.Should().Be(34.98m); // 5.83*3
            chfGroup.PaylocalAmountConvertedCurrency.Should().Be("GBP");
        }

        private static Rm_Cd CreateRoom(
            string code,
            string name,
            string exchangeRate,
            string localAmount,
            string convertedAmount,
            string quantity,
            string localCurrency,
            string convertedCurrency)
        {
            return new Rm_Cd
            {
                Info_Prices = new Info_Prices
                {
                    Info_Price = new Info_Price
                    {
                        Prc_Cd = code,
                        Prc_Cd_Name = name,
                        Exch_Rate = exchangeRate,
                        Qty = quantity,
                        Prc = new Prc
                        {
                            Amt = localAmount,
                            CurISO = localCurrency
                        },
                        Est_Prc = new Est_Prc
                        {
                            Value = convertedAmount,
                            CurISO = convertedCurrency
                        }
                    }
                }
            };
        }

        #region Extra Price Breakdown

        [Theory]
        [MemberData(nameof(PriceMapperTestsData.ExtraPriceBreakdownEmptyInput), MemberType = typeof(PriceMapperTestsData))]
        public void MapExtraPriceBreakdown_WithNullOrEmptyArguments_ReturnsNullOrEmpty(
            PriceCategory[] priceBreakdown,
            ExtraPriceBreakdownSettings extraPriceBreakdownSettings,
            LuggageSettings luggageSettings,
            List<SeatMap> seatSelection,
            ExtraLuggageInfo extraLuggageInfo,
            List<PersonWithDetails> guests)
        {
            var result = _sut.MapExtraPriceBreakdown(
                priceBreakdown,
                extraPriceBreakdownSettings,
                luggageSettings,
                seatSelection,
                extraLuggageInfo,
                guests);

            result.Should().BeNullOrEmpty();
        }

        [Fact]
        public void MapExtraPriceBreakdown_WithCorrectInput_ReturnsCorrectResult()
        {
            var (holidayPrice,
                lateCheckoutPrice,
                priceBreakdown,
                extraPriceBreakdownSettings,
                luggageSettings,
                seatSelection,
                extraLuggageInfo,
                guests, airportParkingPrice) = CreateExtraPriceBreakdownTestData();

            var result = _sut.MapExtraPriceBreakdown(
                priceBreakdown,
                extraPriceBreakdownSettings,
                luggageSettings,
                seatSelection,
                extraLuggageInfo,
                guests);

            using (new AssertionScope())
            {
                var luggagePrice = LuggageUtils.GetLuggagePrice(extraLuggageInfo);
                var lcbPrice = LuggageUtils.GetLuggagePrice(new ExtraLuggageInfo { Items = extraLuggageInfo.Items.Where(i => i.ItemCode == "SCB1").ToList() });
                var seatsPrice = SeatsUtils.GetSeatsPrice(seatSelection);

                result.Should().NotBeNullOrEmpty();

                var defaultCategory = result.Single(c => c.Code == PriceMapper.DefaultCategoryCode);
                defaultCategory.Amount.Should().Be(holidayPrice - seatsPrice - luggagePrice);

                var extrasCategory = result.Single(c => c.Code == "Extras");
                extrasCategory.Subcategories.Count.Should().Be(5);
                extrasCategory.Amount.Should().Be(seatsPrice + luggagePrice + lateCheckoutPrice + airportParkingPrice);
                extrasCategory.Subcategories.Single(c => c.Code == extraPriceBreakdownSettings.SeatsPriceCode).Amount.Should().Be(seatsPrice);
                extrasCategory.Subcategories.Single(c => c.Code == extraPriceBreakdownSettings.HoldLuggagePriceCode).Amount.Should().Be(luggagePrice - lcbPrice);
                extrasCategory.Subcategories.Single(c => c.Code == extraPriceBreakdownSettings.LargeCabinBagsPriceCode).Amount.Should().Be(lcbPrice);
                extrasCategory.Subcategories.Single(c => c.Code == extraPriceBreakdownSettings.LateCheckoutCode).Amount.Should().Be(lateCheckoutPrice);
                extrasCategory.Subcategories.Single(c => c.Code == extraPriceBreakdownSettings.AirportParkingPriceCode).Amount.Should().Be(airportParkingPrice);
            }
        }

        [Fact]
        public void MapExtraPriceBreakdown_WithCorrectInputAndDisabledCategory_ReturnsCorrectResultWithoutDisabledCategory()
        {
            var (holidayPrice,
                lateCheckoutPrice,
                priceBreakdown,
                extraPriceBreakdownSettings,
                luggageSettings,
                seatSelection,
                extraLuggageInfo,
                guests, airportParkingPrice) = CreateExtraPriceBreakdownTestData();

            extraPriceBreakdownSettings.SeatsPriceEnabled = false;

            var result = _sut.MapExtraPriceBreakdown(
                priceBreakdown,
                extraPriceBreakdownSettings,
                luggageSettings,
                seatSelection,
                extraLuggageInfo,
                guests);

            using (new AssertionScope())
            {
                var luggagePrice = LuggageUtils.GetLuggagePrice(extraLuggageInfo);
                var lcbPrice = LuggageUtils.GetLuggagePrice(new ExtraLuggageInfo { Items = extraLuggageInfo.Items.Where(i => i.ItemCode == "SCB1").ToList() });

                result.Should().NotBeNullOrEmpty();

                var defaultCategory = result.Single(c => c.Code == PriceMapper.DefaultCategoryCode);
                defaultCategory.Amount.Should().Be(holidayPrice - luggagePrice);

                var extrasCategory = result.Single(c => c.Code == "Extras");
                extrasCategory.Subcategories.Count.Should().Be(4);
                extrasCategory.Amount.Should().Be(luggagePrice + lateCheckoutPrice + airportParkingPrice);
                extrasCategory.Subcategories.Single(c => c.Code == extraPriceBreakdownSettings.HoldLuggagePriceCode).Amount.Should().Be(luggagePrice - lcbPrice);
                extrasCategory.Subcategories.Single(c => c.Code == extraPriceBreakdownSettings.LargeCabinBagsPriceCode).Amount.Should().Be(lcbPrice);
                extrasCategory.Subcategories.Single(c => c.Code == extraPriceBreakdownSettings.LateCheckoutCode).Amount.Should().Be(lateCheckoutPrice);
                extrasCategory.Subcategories.Single(c => c.Code == extraPriceBreakdownSettings.AirportParkingPriceCode).Amount.Should().Be(airportParkingPrice);
            }
        }
        
        [Fact]
        public void MapExtraPriceBreakdown_WithCorrectInputAndDisabledAirportParkingCategory_ReturnsCorrectResultWithoutDisabledAirportParkingCategory()
        {
            var (holidayPrice,
                lateCheckoutPrice,
                priceBreakdown,
                extraPriceBreakdownSettings,
                luggageSettings,
                seatSelection,
                extraLuggageInfo,
                guests, airportParkingPrice) = CreateExtraPriceBreakdownTestData();

            extraPriceBreakdownSettings.AirportParkingPriceEnabled = false;

            var result = _sut.MapExtraPriceBreakdown(
                priceBreakdown,
                extraPriceBreakdownSettings,
                luggageSettings,
                seatSelection,
                extraLuggageInfo,
                guests);

            using (new AssertionScope())
            {
                var luggagePrice = LuggageUtils.GetLuggagePrice(extraLuggageInfo);
                var lcbPrice = LuggageUtils.GetLuggagePrice(new ExtraLuggageInfo { Items = extraLuggageInfo.Items.Where(i => i.ItemCode == "SCB1").ToList() });
                var seatsPrice = SeatsUtils.GetSeatsPrice(seatSelection);

                result.Should().NotBeNullOrEmpty();

                var defaultCategory = result.Single(c => c.Code == PriceMapper.DefaultCategoryCode);
                defaultCategory.Amount.Should().Be(holidayPrice - luggagePrice - seatsPrice);

                var extrasCategory = result.Single(c => c.Code == "Extras");
                extrasCategory.Subcategories.Count.Should().Be(4);
                extrasCategory.Amount.Should().Be(luggagePrice + lateCheckoutPrice + seatsPrice);
                extrasCategory.Subcategories.Single(c => c.Code == extraPriceBreakdownSettings.SeatsPriceCode).Amount.Should().Be(seatsPrice);
                extrasCategory.Subcategories.Single(c => c.Code == extraPriceBreakdownSettings.HoldLuggagePriceCode).Amount.Should().Be(luggagePrice - lcbPrice);
                extrasCategory.Subcategories.Single(c => c.Code == extraPriceBreakdownSettings.LargeCabinBagsPriceCode).Amount.Should().Be(lcbPrice);
                extrasCategory.Subcategories.Single(c => c.Code == extraPriceBreakdownSettings.LateCheckoutCode).Amount.Should().Be(lateCheckoutPrice);
            }
        }

        private static (
            decimal holidayPrice,
            decimal lateCheckoutPrice,
            PriceCategory[] priceBreakdown,
            ExtraPriceBreakdownSettings extraPriceBreakdownSettings,
            LuggageSettings luggageSettings,
            List<SeatMap> seatSelection,
            ExtraLuggageInfo extraLuggageInfo,
            List<PersonWithDetails> guests,
            decimal airportParkingPrice
            ) CreateExtraPriceBreakdownTestData()
        {
            var lateCheckoutCode = "Late Checkout";
            decimal holidayPrice = 1000;
            decimal lateCheckoutPrice = 100;
            
            var airportParkingCode = "Airport Parking";
            decimal airportParkingPrice = 70;

            PriceCategory[] priceBreakdown =
            {
                new() { Code = PriceMapper.DefaultCategoryCode, Quantity = 1, Amount = holidayPrice },
                new() { Code = lateCheckoutCode, Quantity = 1, Amount = lateCheckoutPrice },
                new() { Code = airportParkingCode, Quantity = 1, Amount = airportParkingPrice },
            };

            var extraPriceBreakdownSettings = new ExtraPriceBreakdownSettings
            {
                ExtrasCode = "Extras",
                ExtrasText = "Extras",
                HoldLuggagePriceCode = "HoldLuggage",
                HoldLuggagePriceText = "Hold Luggage",
                HoldLuggagePriceEnabled = true,
                LargeCabinBagsPriceCode = "LCB",
                LargeCabinBagsPriceText = "Large Cabin Bags",
                LargeCabinBagsPriceEnabled = true,
                SeatsPriceCode = "Seats",
                SeatsPriceText = "Seat Selection",
                SeatsPriceEnabled = true,
                LateCheckoutCode = lateCheckoutCode,
                LateCheckoutPriceEnabled = true,
                AirportParkingPriceCode = airportParkingCode,
                AirportParkingPriceEnabled = true,
                AirportParkingPriceText = "Airport Parking",
            };

            var luggageSettings = new LuggageSettings
            {
                DefaultFreeBagsPerNonInfantPassenger = new Dictionary<string, int> { { "LUG", 1 } },
                LargeCabinBagCode = "SCB1"
            };

            var seatSelection = new List<SeatMap>
            {
                new()
                {
                    FlightNumber = "1111",
                    Seats = new List<Seat>
                    {
                        new()
                        {
                            PaxIndex = 1,
                            Price = 10,
                            SeatNumber = "1A"
                        },
                        new()
                        {
                            PaxIndex = 2,
                            Price = 10,
                            SeatNumber = "1B"
                        }
                    }
                },
                new()
                {
                    FlightNumber = "2222",
                    Seats = new List<Seat>
                    {
                        new()
                        {
                            PaxIndex = 1,
                            Price = 10,
                            SeatNumber = "2A"
                        },
                        new()
                        {
                            PaxIndex = 2,
                            Price = 10,
                            SeatNumber = "2B"
                        }
                    }
                }
            };

            var extraLuggageInfo = new ExtraLuggageInfo
            {
                Items = new List<ExtraLuggageItem>
                {
                    new()
                    {
                        RouteId = "1",
                        PassengerId = "1",
                        ItemCode = "LUSE",
                        Quantity = 1,
                        Price = 10,
                        IsComplimentary = false
                    },
                    new()
                    {
                        RouteId = "1",
                        PassengerId = "2",
                        ItemCode = "LUG",
                        Quantity = 2,
                        Price = 10,
                        IsComplimentary = true
                    },
                    new()
                    {
                        RouteId = "1",
                        PassengerId = "1",
                        ItemCode = "BIKE",
                        Quantity = 1,
                        Price = 100,
                        IsComplimentary = false
                    },
                    new()
                    {
                        RouteId = "1",
                        PassengerId = "1",
                        ItemCode = "SCB1",
                        Quantity = 1,
                        Price = 20,
                        IsComplimentary = false
                    },

                    new()
                    {
                        RouteId = "2",
                        PassengerId = "1",
                        ItemCode = "LUSE",
                        Quantity = 1,
                        Price = 10,
                        IsComplimentary = false
                    },
                    new()
                    {
                        RouteId = "2",
                        PassengerId = "2",
                        ItemCode = "LUG",
                        Quantity = 2,
                        Price = 10,
                        IsComplimentary = true
                    },
                    new()
                    {
                        RouteId = "2",
                        PassengerId = "1",
                        ItemCode = "BIKE",
                        Quantity = 1,
                        Price = 100,
                        IsComplimentary = false
                    },
                    new()
                    {
                        RouteId = "2",
                        PassengerId = "1",
                        ItemCode = "SCB1",
                        Quantity = 1,
                        Price = 20,
                        IsComplimentary = false
                    }
                }
            };

            var guests = new List<PersonWithDetails>
            {
                new() { Type = PersonType.Adult },
                new() { Type = PersonType.Child }
            };
            return (holidayPrice, lateCheckoutPrice, priceBreakdown, extraPriceBreakdownSettings, luggageSettings, seatSelection, extraLuggageInfo, guests, airportParkingPrice);
        }

        #endregion
    }

    public class PriceMapperTestsData
    {
        public static IEnumerable<object[]> Map_NullResponse =>
            new List<object[]>
            {
                new object[] {
                    null,
                    null
                }
            };

        public static IEnumerable<object[]> Map_DefaultCategory =>
            new List<object[]>
            {
                new object[] {
                    new Bkg_Ent {
                        Summary_Prices = new Summary_Price[0]
                    },
                    null
                },
                new object[] {
                    new Bkg_Ent {
                        Summary_Prices = new Summary_Price[0]
                    },
                    new Dictionary<string, PriceBreakdownCategory>()
                },
                new object[] {
                    new Bkg_Ent {
                        Summary_Prices = new Summary_Price[0]
                    },
                    new Dictionary<string, PriceBreakdownCategory>()
                }
            };

        public static IEnumerable<object[]> Map_UnexpectedPricesDefaultCategory =>
            new List<object[]>
            {
                new object[] {
                    new Bkg_Ent {
                        Summary_Prices = new[] {
                            new Summary_Price
                            {
                                Prc = new Prc_Type
                                {
                                    Value = "10"
                                },
                                Prc_Tp_Cd = "RND1",
                                Prc_Tp_Name = "Random one"
                            },
                            new Summary_Price
                            {
                                Prc = new Prc_Type
                                {
                                    Value = "20"
                                },
                                Prc_Tp_Cd = "RND1",
                                Prc_Tp_Name = "Random two"
                            }
                        }
                    },
                    new Dictionary<string, PriceBreakdownCategory>
                    {
                        {
                            "Children Discount",
                            new PriceBreakdownCategory
                            {
                                Code = "DSCT",
                                Text = "Kids go free",
                                Scope = PriceBreakdownCategoryScope.BookingPage
                            }
                        }
                    }
                },
                new object[] {
                    new Bkg_Ent {
                        Summary_Prices = new[] {
                            new Summary_Price
                            {
                                Prc = new Prc_Type
                                {
                                    Value = "10"
                                },
                                Prc_Tp_Cd = "RND1",
                                Prc_Tp_Name = "Random one"
                            },
                            new Summary_Price
                            {
                                Prc = new Prc_Type
                                {
                                    Value = "20"
                                },
                                Prc_Tp_Cd = "RND1",
                                Prc_Tp_Name = "Random two"
                            }
                        }
                    },
                    new Dictionary<string, PriceBreakdownCategory>
                    {
                        {
                            "Children Discount",
                            new PriceBreakdownCategory
                            {
                                Code = "DSCT",
                                Text = "Kids go free",
                                Scope = PriceBreakdownCategoryScope.BookingPage
                            }
                        },
                        {
                            "Adult Accommodation",
                            new PriceBreakdownCategory
                            {
                                Code = "Holiday",
                                Text = "Super-duper Holiday",
                                Scope = PriceBreakdownCategoryScope.BookingPage
                            }
                        },
                        {
                            "Children Accommodation",
                            new PriceBreakdownCategory
                            {
                                Code = "Holiday",
                                Text = "Super-duper Holiday",
                                Scope = PriceBreakdownCategoryScope.BookingPage
                            }
                        }
                    }
                }
            };

        public static IEnumerable<object[]> Map_Discounts_CaseNotSensitive_SummCorrect =>
            new List<object[]>
            {
                new object[] {
                    new Bkg_Ent {
                        Summary_Prices = new[] {
                            new Summary_Price
                            {
                                Prc = new Prc_Type
                                {
                                    Value = "10"
                                },
                                Prc_Tp_Cd = "RND1",
                                Prc_Tp_Name = "Random one"
                            },
                            new Summary_Price
                            {
                                Prc = new Prc_Type
                                {
                                    Value = "20"
                                },
                                Prc_Tp_Cd = "RND1",
                                Prc_Tp_Name = "Random two"
                            },
                            new Summary_Price
                            {
                                Prc = new Prc_Type
                                {
                                    Value = "-10"
                                },
                                Prc_Tp_Cd = "ACC",
                                Prc_Tp_Name = "£10 Off"
                            },
                            new Summary_Price
                            {
                                Prc = new Prc_Type
                                {
                                    Value = "-20"
                                },
                                Prc_Tp_Cd = "ALC",
                                Prc_Tp_Name = "Online Discount"
                            },
                            new Summary_Price
                            {
                                Prc = new Prc_Type
                                {
                                    Value = "-5"
                                },
                                Prc_Tp_Cd = "ALC",
                                Prc_Tp_Name = "Random Discount"
                            },
                            new Summary_Price
                            {
                                Prc = new Prc_Type
                                {
                                    Value = "5"
                                },
                                Prc_Tp_Cd = "TAX",
                                Prc_Tp_Name = "Flight Tax",
                                Qty = "2"
                            }
                        }
                    },
                    new Dictionary<string, PriceBreakdownCategory>
                    {
                        {
                            "Children Discount",
                            new PriceBreakdownCategory
                            {
                                Code = "DSCT",
                                Text = "Kids go free",
                                Scope = PriceBreakdownCategoryScope.BookingPage
                            }
                        },
                        {
                            "Adult Accommodation",
                            new PriceBreakdownCategory
                            {
                                Code = "Holiday",
                                Text = "Super-duper Holiday",
                                Scope = PriceBreakdownCategoryScope.BookingPage
                            }
                        },
                        {
                            "Children Accommodation",
                            new PriceBreakdownCategory
                            {
                                Code = "Holiday",
                                Text = "Super-duper Holiday",
                                Scope = PriceBreakdownCategoryScope.BookingPage
                            }
                        },
                        {
                            "offline discount",
                            new PriceBreakdownCategory
                            {
                                Code = "ODSCT",
                                Text = "Offline Discount",
                                Scope = PriceBreakdownCategoryScope.BookingPage
                            }
                        },
                        {
                            "online discount",
                            new PriceBreakdownCategory
                            {
                                Code = "DSCT",
                                Text = "Online Discount",
                                Scope = PriceBreakdownCategoryScope.BookingPage
                            }
                        },
                        {
                            "£10 Off",
                            new PriceBreakdownCategory
                            {
                                Code = "DSCT",
                                Text = "Online Discount",
                                Scope = PriceBreakdownCategoryScope.BookingPage
                            }
                        }
                    }
                }
            };

        public static IEnumerable<object[]> Map_ForTradeAgentNoDefaultCategory =>
            new List<object[]>
            {
                new object[] {
                    new Bkg_Ent {
                        Summary_Prices = new[] {
                            new Summary_Price
                            {
                                Prc = new Prc_Type
                                {
                                    Value = "1000"
                                },
                                Prc_Tp_Cd = "ACC",
                                Prc_Tp_Name = "Package Price",
                                Qty = "2"
                            },
                            new Summary_Price
                            {
                                Prc = new Prc_Type
                                {
                                    Value = "5"
                                },
                                Prc_Tp_Cd = "TAX",
                                Prc_Tp_Name = "Flight Tax",
                                Qty = "2"
                            },
                            new Summary_Price
                            {
                                Prc = new Prc_Type
                                {
                                    Value = "10"
                                },
                                Prc_Tp_Cd = "TAX",
                                Prc_Tp_Name = "Flight Tax",
                                Qty = "2"
                            }
                        }
                    },
                    new Dictionary<string, PriceBreakdownCategory>
                    {
                        {
                            "Package Price",
                            new PriceBreakdownCategory
                            {
                                Code = "ACC",
                                Text = "Package Price",
                                Scope = PriceBreakdownCategoryScope.TradeAgentInfo
                            }
                        },
                        {
                            "Flight Tax",
                            new PriceBreakdownCategory
                            {
                                Code = "TAX",
                                Text = "Flight Tax",
                                Scope = PriceBreakdownCategoryScope.TradeAgentInfo
                            }
                        }
                    }
                }
            };

        public static IEnumerable<object[]> Map_Currency =>
            new List<object[]>
            {
                new object[] {
                    new Bkg_Ent {
                        CurISO = "CHF"
                    }
                },
            };

        public static IEnumerable<object[]> ExtraPriceBreakdownEmptyInput =>
            new List<object[]>
            {
                new object[] { null, null, null, null, null, null },
                new object[] { Array.Empty<PriceCategory>(), new ExtraPriceBreakdownSettings(), new LuggageSettings(), new List<SeatMap>(), new ExtraLuggageInfo(), new List<PersonWithDetails>() }
            };
    }
}

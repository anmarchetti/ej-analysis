using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Models.Internal;
using FluentAssertions.Execution;
using System.Globalization;
using Xunit;
using Type = easyJet.Holidays.External.Atcom.Models.Internal.Type;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Booking
{
    public class AirportParkingMapperTests
    {
        [Fact]
        public void MapToAirportParking_WhenItemSearchResponseIsBookingEntryWithPrice_ShouldMapToAirportParkingItem()
        {
            // Arrange

            const string keyData =
                "<KeyData><BookingURL>/sandbox/v1/carpark/HPLGV4</BookingURL><Ticket><AvailabilityList><Availability Code=\\\"LGV4\\\" Name=\\\"Purple Parking-allterminals\\\"><AirportTransfer TravelDuration=\\\"10\\\" Frequency=\\\"20\\\" Price=\\\"\\\"/><Prices TotalPrice=\\\"121.00\\\"/><Raw><Filter><meet_and_greet>0</meet_and_greet><park_and_ride>1</park_and_ride><car_parked_for_you>1</car_parked_for_you><lead_time>120</lead_time></Filter><tfhrpricing>24hour</tfhrpricing></Raw></Availability></AvailabilityList></Ticket></KeyData>>";
            const string cdata = $"<![CDATA[{keyData}]]>";

            var bookingEntry = new Bkg_Ent
            {
                Item =
                [
                    new Item
                    {
                        Name = "Airport parking for testing",
                        St_Dt = "2025-02-19T00:00:00",
                        End_Dt = "2025-02-25T00:00:00",
                        Bkg_Qty = "1",
                        Code = "LGV4",
                        Item1 = new Prom { Code = "AUCI" },
                        SubServPaxs = [new SubServPax { Pax_Id = "1" }],
                        Item_InvState = Item_InvState.EXTERNAL,
                        Set_Type = Set_Type.AIRPORT_PARKING,
                        Tot_Prc = new Prc_Type { Value = "121" },
                        Ext_Ref_Id = new Ext_Ref_Id { Code = "THGYFF" },
                        Items =
                        [
                            new CarPark
                            {
                                Start_TimeStr = "04:15:00",
                                End_TimeStr = "00:55:00",
                                Type = Type.OFF_SITE,
                                TypeSpecified = true
                            },
                            new SrcData
                            {
                                System = "holidayextras",
                                KeyValuePair =
                                [
                                    new Models.Internal.KeyValuePair { Key = "TotalPrice", Value = "121" },
                                    new Models.Internal.KeyValuePair { Key = "KeyData", Value = keyData }
                                ]
                            },
                        ]
                    }
                ]
            };

            // Act

            AirportParkingItem result = AirportParkingMapper.MapResponseToAirportParking(bookingEntry);

            // Assert
            using (new AssertionScope())
            {
                Assert.Equal(bookingEntry.Item[0].Name, result.Title);
                Assert.Equal(DateTime.Parse(bookingEntry.Item[0].St_Dt, CultureInfo.InvariantCulture),
                    result.BookingDetails.StartDate);
                Assert.Equal(DateTime.Parse(bookingEntry.Item[0].End_Dt, CultureInfo.InvariantCulture),
                    result.BookingDetails.EndDate);
                Assert.Equal(bookingEntry.Item[0].Code, result.BookingDetails.ProductCode);
                Assert.Equal(((Prom)bookingEntry.Item[0].Item1).Code, result.BookingDetails.PromotionCode);
                Assert.Equal(((CarPark)bookingEntry.Item[0].Items[0]).Start_TimeStr, result.BookingDetails.StartTime);
                Assert.Equal(((CarPark)bookingEntry.Item[0].Items[0]).End_TimeStr, result.BookingDetails.EndTime);
                Assert.Equal(((CarPark)bookingEntry.Item[0].Items[0]).Type.ToString(),
                    result.BookingDetails.Type.ToString());
                Assert.Equal(((SrcData)bookingEntry.Item[0].Items[1]).KeyValuePair[0].Value,
                    result.BookingDetails.TotalPrice.ToString(CultureInfo.InvariantCulture));
                Assert.Equal(((SrcData)bookingEntry.Item[0].Items[1]).KeyValuePair[1].Value,
                    result.BookingDetails.KeyData);
                Assert.Equal((bookingEntry.Item[0].Ext_Ref_Id).Code, result.BookingDetails.BookingReferenceCode);
            }
        }

        [Fact]
        public void MapToAirportParking_WhenTitleIncludesEncodedText_ShouldDecodeTitle()
        {
            // Arrange

            const string keyData =
                "<KeyData><BookingURL>/sandbox/v1/carpark/HPLGV4</BookingURL><Ticket><AvailabilityList><Availability Code=\\\"LGV4\\\" Name=\\\"Purple Parking-allterminals\\\"><AirportTransfer TravelDuration=\\\"10\\\" Frequency=\\\"20\\\" Price=\\\"\\\"/><Prices TotalPrice=\\\"121.00\\\"/><Raw><Filter><meet_and_greet>0</meet_and_greet><park_and_ride>1</park_and_ride><car_parked_for_you>1</car_parked_for_you><lead_time>120</lead_time></Filter><tfhrpricing>24hour</tfhrpricing></Raw></Availability></AvailabilityList></Ticket></KeyData>>";
            const string cdata = $"<![CDATA[{keyData}]]>";

            var bookingEntry = new Bkg_Ent
            {
                Item =
                [
                    new Item
                    {
                        Name = "Holidays extra park &amp; ride",
                        St_Dt = "2025-02-19T00:00:00",
                        End_Dt = "2025-02-25T00:00:00",
                        Bkg_Qty = "1",
                        Code = "LGV4",
                        Item1 = new Prom { Code = "AUCI" },
                        SubServPaxs = [new SubServPax { Pax_Id = "1" }],
                        Item_InvState = Item_InvState.EXTERNAL,
                        Set_Type = Set_Type.AIRPORT_PARKING,
                        Tot_Prc = new Prc_Type { Value = "121" },
                        Ext_Ref_Id = new Ext_Ref_Id { Code = "THGYFF" },
                        Items =
                        [
                            new CarPark
                            {
                                Start_TimeStr = "04:15:00",
                                End_TimeStr = "00:55:00",
                                Type = Type.OFF_SITE,
                                TypeSpecified = true
                            },
                            new SrcData
                            {
                                System = "holidayextras",
                                KeyValuePair =
                                [
                                    new Models.Internal.KeyValuePair { Key = "TotalPrice", Value = "121" },
                                    new Models.Internal.KeyValuePair { Key = "KeyData", Value = keyData }
                                ]
                            },
                        ]
                    }
                ]
            };

            // Act

            var result = AirportParkingMapper.MapResponseToAirportParking(bookingEntry);

            // Assert
            using (new AssertionScope())
            {
                Assert.Equal("Holidays extra park & ride", result.Title);
            }
        }

        [Fact]
        public void
            MapToAirportParking_WhenItemSearchResponseIsBookingEntryWithPriceAndThereIsNotACarParkType_ShouldMapToAirportParkingItemWithOnSiteType()
        {
            // Arrange

            const string keyData =
                "<KeyData><BookingURL>/sandbox/v1/carpark/HPLGV4</BookingURL><Ticket><AvailabilityList><Availability Code=\\\"LGV4\\\" Name=\\\"Purple Parking-allterminals\\\"><AirportTransfer TravelDuration=\\\"10\\\" Frequency=\\\"20\\\" Price=\\\"\\\"/><Prices TotalPrice=\\\"121.00\\\"/><Raw><Filter><meet_and_greet>0</meet_and_greet><park_and_ride>1</park_and_ride><car_parked_for_you>1</car_parked_for_you><lead_time>120</lead_time></Filter><tfhrpricing>24hour</tfhrpricing></Raw></Availability></AvailabilityList></Ticket></KeyData>>";
            const string cdata = $"<![CDATA[{keyData}]]>";

            var bookingEntry = new Bkg_Ent
            {
                Item =
                [
                    new Item
                    {
                        Name = "Airport parking for testing",
                        St_Dt = "2025-02-19T00:00:00",
                        End_Dt = "2025-02-25T00:00:00",
                        Bkg_Qty = "1",
                        Code = "LGV4",
                        Item1 = new Prom { Code = "AUCI" },
                        SubServPaxs = [new SubServPax { Pax_Id = "1" }],
                        Item_InvState = Item_InvState.EXTERNAL,
                        Set_Type = Set_Type.AIRPORT_PARKING,
                        Tot_Prc = new Prc_Type { Value = "121" },
                        Ext_Ref_Id = new Ext_Ref_Id { Code = "THGYFF" },
                        Items =
                        [
                            new CarPark { Start_TimeStr = "04:15:00", End_TimeStr = "00:55:00", TypeSpecified = true },
                            new SrcData
                            {
                                System = "holidayextras",
                                KeyValuePair =
                                [
                                    new Models.Internal.KeyValuePair { Key = "TotalPrice", Value = "121" },
                                    new Models.Internal.KeyValuePair { Key = "KeyData", Value = keyData }
                                ]
                            },
                        ]
                    }
                ]
            };

            // Act

            AirportParkingItem result = AirportParkingMapper.MapResponseToAirportParking(bookingEntry);

            // Assert
            using (new AssertionScope())
            {
                Assert.Equal(bookingEntry.Item[0].Name, result.Title);
                Assert.Equal(DateTime.Parse(bookingEntry.Item[0].St_Dt, CultureInfo.InvariantCulture),
                    result.BookingDetails.StartDate);
                Assert.Equal(DateTime.Parse(bookingEntry.Item[0].End_Dt, CultureInfo.InvariantCulture),
                    result.BookingDetails.EndDate);
                Assert.Equal(bookingEntry.Item[0].Code, result.BookingDetails.ProductCode);
                Assert.Equal(((Prom)bookingEntry.Item[0].Item1).Code, result.BookingDetails.PromotionCode);
                Assert.Equal(((CarPark)bookingEntry.Item[0].Items[0]).Start_TimeStr, result.BookingDetails.StartTime);
                Assert.Equal(((CarPark)bookingEntry.Item[0].Items[0]).End_TimeStr, result.BookingDetails.EndTime);
                Assert.Equal(ParkingType.ON_SITE, result.BookingDetails.Type);
                Assert.Equal(((SrcData)bookingEntry.Item[0].Items[1]).KeyValuePair[0].Value,
                    result.BookingDetails.TotalPrice.ToString(CultureInfo.InvariantCulture));
                Assert.Equal(((SrcData)bookingEntry.Item[0].Items[1]).KeyValuePair[1].Value,
                    result.BookingDetails.KeyData);
                Assert.Equal((bookingEntry.Item[0].Ext_Ref_Id).Code, result.BookingDetails.BookingReferenceCode);
            }
        }

        [Fact]
        public void MapToAirportParking_WhenItemSearchResponseEntryIsNull_ShouldReturnNull()
        {
            // Arrange
            var bookingEntry = new Bkg_Ent();

            // Act
            AirportParkingItem result = AirportParkingMapper.MapResponseToAirportParking(bookingEntry);

            // Assert
            using (new AssertionScope())
            {
                Assert.Null(result);
            }
        }

        [Fact]
        public void MapToAirportParking_WhenItemSearchResponseEntryItemIsNull_ShouldReturnNull()
        {
            // Arrange
            Bkg_Ent bookingEntry = null;

            // Act
            AirportParkingItem result = AirportParkingMapper.MapResponseToAirportParking(bookingEntry);

            // Assert
            using (new AssertionScope())
            {
                Assert.Null(result);
            }
        }

        [Fact]
        public void MapToAirportParking_WhenItemSearchResponseEntryItemIsNotAirportParking_ShouldReturnNull()
        {
            // Arrange
            const string keyData =
                "<KeyData><BookingURL>/sandbox/v1/carpark/HPLGV4</BookingURL><Ticket><AvailabilityList><Availability Code=\\\"LGV4\\\" Name=\\\"Purple Parking-allterminals\\\"><AirportTransfer TravelDuration=\\\"10\\\" Frequency=\\\"20\\\" Price=\\\"\\\"/><Prices TotalPrice=\\\"121.00\\\"/><Raw><Filter><meet_and_greet>0</meet_and_greet><park_and_ride>1</park_and_ride><car_parked_for_you>1</car_parked_for_you><lead_time>120</lead_time></Filter><tfhrpricing>24hour</tfhrpricing></Raw></Availability></AvailabilityList></Ticket></KeyData>>";
            const string cdata = $"<![CDATA[{keyData}]]>";

            var bookingEntry = new Bkg_Ent
            {
                Item =
                [
                    new Item
                    {
                        Name = "Airport parking for testing",
                        St_Dt = "2025-02-19T00:00:00",
                        End_Dt = "2025-02-25T00:00:00",
                        Bkg_Qty = "1",
                        Code = "LGV4",
                        Item1 = new Prom { Code = "AUCI" },
                        SubServPaxs = [new SubServPax { Pax_Id = "1" }],
                        Item_InvState = Item_InvState.EXTERNAL,
                        Set_Type = Set_Type.INSURANCE,
                        Tot_Prc = new Prc_Type { Value = "121" },
                        Ext_Ref_Id = new Ext_Ref_Id { Code = "THGYFF" },
                        Items =
                        [
                            new CarPark
                            {
                                Start_TimeStr = "04:15:00",
                                End_TimeStr = "00:55:00",
                                Type = Type.ON_SITE,
                                TypeSpecified = true
                            },
                            new SrcData
                            {
                                System = "holidayextras",
                                KeyValuePair =
                                [
                                    new Models.Internal.KeyValuePair { Key = "TotalPrice", Value = "121" },
                                    new Models.Internal.KeyValuePair { Key = "KeyData", Value = keyData }
                                ]
                            },
                        ]
                    }
                ]
            };

            // Act
            AirportParkingItem result = AirportParkingMapper.MapResponseToAirportParking(bookingEntry);

            // Assert
            using (new AssertionScope())
            {
                Assert.Null(result);
            }
        }

        [Fact]
        public void
            MapToAirportParking_WhenInfoBookingResponseIsBookingEntryWithTotalPrice_ShouldMapToAirportParkingItem()
        {
            // Arrange
            const string keyData =
                "<KeyData><BookingURL>/sandbox/v1/carpark/HPLGV4</BookingURL><Ticket><AvailabilityList><Availability Code=\\\"LGV4\\\" Name=\\\"Purple Parking-allterminals\\\"><AirportTransfer TravelDuration=\\\"10\\\" Frequency=\\\"20\\\" Price=\\\"\\\"/><Prices TotalPrice=\\\"121.00\\\"/><Raw><Filter><meet_and_greet>0</meet_and_greet><park_and_ride>1</park_and_ride><car_parked_for_you>1</car_parked_for_you><lead_time>120</lead_time></Filter><tfhrpricing>24hour</tfhrpricing></Raw></Availability></AvailabilityList></Ticket></KeyData>>";
            const string cdata = $"<![CDATA[{keyData}]]>";

            var bookingEntry = new Bkg_Ent
            {
                Item =
                [
                    new Item
                    {
                        Name = "Airport parking for testing",
                        St_Dt = "2025-02-19T00:00:00",
                        End_Dt = "2025-02-25T00:00:00",
                        Bkg_Qty = "1",
                        Code = "LGV4",
                        Item1 = new Prom { Code = "AUCI" },
                        SubServPaxs = [new SubServPax { Pax_Id = "1" }],
                        Item_InvState = Item_InvState.EXTERNAL,
                        Set_Type = Set_Type.AIRPORT_PARKING,
                        Tot_Prc = new Prc_Type { Value = "121" },
                        Ext_Ref_Id = new Ext_Ref_Id { Code = "THGYFF" },
                        Items =
                        [
                            new CarPark
                            {
                                Start_TimeStr = "04:15:00",
                                End_TimeStr = "00:55:00",
                                Type = Type.ON_SITE,
                                TypeSpecified = true
                            },
                            new SrcData
                            {
                                System = "holidayextras",
                                KeyValuePair =
                                [
                                    new Models.Internal.KeyValuePair { Key = "TotalPrice", Value = "121" },
                                    new Models.Internal.KeyValuePair { Key = "KeyData", Value = keyData }
                                ]
                            },
                        ]
                    }
                ]
            };

            // Act

            AirportParkingItem result = AirportParkingMapper.MapResponseToAirportParking(bookingEntry.Item[0]);

            // Assert
            using (new AssertionScope())
            {
                Assert.Equal(bookingEntry.Item[0].Name, result.Title);
                Assert.Equal(DateTime.Parse(bookingEntry.Item[0].St_Dt, CultureInfo.InvariantCulture),
                    result.BookingDetails.StartDate);
                Assert.Equal(DateTime.Parse(bookingEntry.Item[0].End_Dt, CultureInfo.InvariantCulture),
                    result.BookingDetails.EndDate);
                Assert.Equal(bookingEntry.Item[0].Code, result.BookingDetails.ProductCode);
                Assert.Equal(((Prom)bookingEntry.Item[0].Item1).Code, result.BookingDetails.PromotionCode);
                Assert.Equal(((CarPark)bookingEntry.Item[0].Items[0]).Start_TimeStr, result.BookingDetails.StartTime);
                Assert.Equal(((CarPark)bookingEntry.Item[0].Items[0]).End_TimeStr, result.BookingDetails.EndTime);
                Assert.Equal(((CarPark)bookingEntry.Item[0].Items[0]).Type.ToString(),
                    result.BookingDetails.Type.ToString());
                Assert.Equal(((SrcData)bookingEntry.Item[0].Items[1]).KeyValuePair[0].Value,
                    result.BookingDetails.TotalPrice.ToString(CultureInfo.InvariantCulture));
                Assert.Equal(((SrcData)bookingEntry.Item[0].Items[1]).KeyValuePair[1].Value,
                    result.BookingDetails.KeyData);
                Assert.Equal((bookingEntry.Item[0].Ext_Ref_Id).Code, result.BookingDetails.BookingReferenceCode);
            }
        }

        [Fact]
        public void MapToAirportParking_WhenInfoBookingResponseIsBookingEntryWithPrice_ShouldMapToAirportParkingItem()
        {
            // Arrange
            const string keyData =
                "<KeyData><BookingURL>/sandbox/v1/carpark/HPLGV4</BookingURL><Ticket><AvailabilityList><Availability Code=\\\"LGV4\\\" Name=\\\"Purple Parking-allterminals\\\"><AirportTransfer TravelDuration=\\\"10\\\" Frequency=\\\"20\\\" Price=\\\"\\\"/><Prices TotalPrice=\\\"134.00\\\"/><Raw><Filter><meet_and_greet>0</meet_and_greet><park_and_ride>1</park_and_ride><car_parked_for_you>1</car_parked_for_you><lead_time>120</lead_time></Filter><tfhrpricing>24hour</tfhrpricing></Raw></Availability></AvailabilityList></Ticket></KeyData>>";
            const string cdata = $"<![CDATA[{keyData}]]>";

            var bookingEntry = new Bkg_Ent
            {
                Item =
                [
                    new Item
                    {
                        Name = "Airport parking for testing",
                        St_Dt = "2025-02-19T00:00:00",
                        End_Dt = "2025-02-25T00:00:00",
                        Bkg_Qty = "1",
                        Code = "LGV4",
                        Item1 = new Prom { Code = "AUCI" },
                        SubServPaxs = [new SubServPax { Pax_Id = "1" }],
                        Item_InvState = Item_InvState.EXTERNAL,
                        Set_Type = Set_Type.AIRPORT_PARKING,
                        Prices =
                        [
                            new Price { Prc = new Prc_Type { Value = "134" } }
                        ],
                        Ext_Ref_Id = new Ext_Ref_Id { Code = "THGYFF" },
                        Items =
                        [
                            new CarPark
                            {
                                Start_TimeStr = "04:15:00",
                                End_TimeStr = "00:55:00",
                                Type = Type.ON_SITE,
                                TypeSpecified = true
                            },
                            new SrcData
                            {
                                System = "holidayextras",
                                KeyValuePair =
                                [
                                    new Models.Internal.KeyValuePair { Key = "TotalPrice", Value = "134" },
                                    new Models.Internal.KeyValuePair { Key = "KeyData", Value = keyData }
                                ]
                            },
                        ]
                    }
                ]
            };

            // Act

            AirportParkingItem result = AirportParkingMapper.MapResponseToAirportParking(bookingEntry.Item[0]);

            // Assert
            using (new AssertionScope())
            {
                Assert.Equal(bookingEntry.Item[0].Name, result.Title);
                Assert.Equal(DateTime.Parse(bookingEntry.Item[0].St_Dt, CultureInfo.InvariantCulture),
                    result.BookingDetails.StartDate);
                Assert.Equal(DateTime.Parse(bookingEntry.Item[0].End_Dt, CultureInfo.InvariantCulture),
                    result.BookingDetails.EndDate);
                Assert.Equal(bookingEntry.Item[0].Code, result.BookingDetails.ProductCode);
                Assert.Equal(((Prom)bookingEntry.Item[0].Item1).Code, result.BookingDetails.PromotionCode);
                Assert.Equal(((CarPark)bookingEntry.Item[0].Items[0]).Start_TimeStr, result.BookingDetails.StartTime);
                Assert.Equal(((CarPark)bookingEntry.Item[0].Items[0]).End_TimeStr, result.BookingDetails.EndTime);
                Assert.Equal(((CarPark)bookingEntry.Item[0].Items[0]).Type.ToString(),
                    result.BookingDetails.Type.ToString());
                Assert.Equal(bookingEntry.Item[0].Prices[0].Prc.Value,
                    result.BookingDetails.TotalPrice.ToString(CultureInfo.InvariantCulture));
                Assert.Equal(((SrcData)bookingEntry.Item[0].Items[1]).KeyValuePair[1].Value,
                    result.BookingDetails.KeyData);
                Assert.Equal((bookingEntry.Item[0].Ext_Ref_Id).Code, result.BookingDetails.BookingReferenceCode);
            }
        }

        [Fact]
        public void
            MapToAirportParking_WhenInfoBookingResponseIsBookingEntryWithNullPrice_ShouldMapToAirportParkingItemWithPrice0()
        {
            // Arrange
            const string keyData =
                "<KeyData><BookingURL>/sandbox/v1/carpark/HPLGV4</BookingURL><Ticket><AvailabilityList><Availability Code=\\\"LGV4\\\" Name=\\\"Purple Parking-allterminals\\\"><AirportTransfer TravelDuration=\\\"10\\\" Frequency=\\\"20\\\" Price=\\\"\\\"/><Prices TotalPrice=\\\"134.00\\\"/><Raw><Filter><meet_and_greet>0</meet_and_greet><park_and_ride>1</park_and_ride><car_parked_for_you>1</car_parked_for_you><lead_time>120</lead_time></Filter><tfhrpricing>24hour</tfhrpricing></Raw></Availability></AvailabilityList></Ticket></KeyData>>";
            const string cdata = $"<![CDATA[{keyData}]]>";

            var bookingEntry = new Bkg_Ent
            {
                Item =
                [
                    new Item
                    {
                        Name = "Airport parking for testing",
                        St_Dt = "2025-02-19T00:00:00",
                        End_Dt = "2025-02-25T00:00:00",
                        Bkg_Qty = "1",
                        Code = "LGV4",
                        Item1 = new Prom { Code = "AUCI" },
                        SubServPaxs = [new SubServPax { Pax_Id = "1" }],
                        Item_InvState = Item_InvState.EXTERNAL,
                        Set_Type = Set_Type.AIRPORT_PARKING,
                        Ext_Ref_Id = new Ext_Ref_Id { Code = "THGYFF" },
                        Items =
                        [
                            new CarPark
                            {
                                Start_TimeStr = "04:15:00",
                                End_TimeStr = "00:55:00",
                                Type = Type.ON_SITE,
                                TypeSpecified = true
                            },
                            new SrcData
                            {
                                System = "holidayextras",
                                KeyValuePair =
                                [
                                    new Models.Internal.KeyValuePair { Key = "TotalPrice", Value = "134" },
                                    new Models.Internal.KeyValuePair { Key = "KeyData", Value = keyData }
                                ]
                            },
                        ]
                    }
                ]
            };

            // Act

            AirportParkingItem result = AirportParkingMapper.MapResponseToAirportParking(bookingEntry.Item[0]);

            // Assert
            using (new AssertionScope())
            {
                Assert.Equal(bookingEntry.Item[0].Name, result.Title);
                Assert.Equal(DateTime.Parse(bookingEntry.Item[0].St_Dt, CultureInfo.InvariantCulture),
                    result.BookingDetails.StartDate);
                Assert.Equal(DateTime.Parse(bookingEntry.Item[0].End_Dt, CultureInfo.InvariantCulture),
                    result.BookingDetails.EndDate);
                Assert.Equal(bookingEntry.Item[0].Code, result.BookingDetails.ProductCode);
                Assert.Equal(((Prom)bookingEntry.Item[0].Item1).Code, result.BookingDetails.PromotionCode);
                Assert.Equal(((CarPark)bookingEntry.Item[0].Items[0]).Start_TimeStr, result.BookingDetails.StartTime);
                Assert.Equal(((CarPark)bookingEntry.Item[0].Items[0]).End_TimeStr, result.BookingDetails.EndTime);
                Assert.Equal(((CarPark)bookingEntry.Item[0].Items[0]).Type.ToString(),
                    result.BookingDetails.Type.ToString());
                Assert.Equal("0", result.BookingDetails.TotalPrice.ToString(CultureInfo.InvariantCulture));
                Assert.Equal(((SrcData)bookingEntry.Item[0].Items[1]).KeyValuePair[1].Value,
                    result.BookingDetails.KeyData);
                Assert.Equal((bookingEntry.Item[0].Ext_Ref_Id).Code, result.BookingDetails.BookingReferenceCode);
            }
        }
    }
}
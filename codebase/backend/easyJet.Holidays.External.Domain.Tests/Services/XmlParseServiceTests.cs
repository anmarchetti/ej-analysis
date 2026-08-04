using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Domain.Services;
using Xunit;
using KeyValuePair = easyJet.Holidays.External.Atcom.Models.Internal.KeyValuePair;

namespace easyJet.Holidays.External.Domain.Tests.Services
{
    public class XmlParseServiceTests
    {
        [Fact]
        public void XmlWriter_WhenCDATAisPresent_ShouldEncodeSpecialCharacters()
        {
            const string keyData =
                "<KeyData><BookingURL>/sandbox/v1/carpark/HPLGV4</BookingURL><Ticket><AvailabilityList><Availability Code=\\\"LGV4\\\" Name=\\\"Purple Parking-allterminals\\\"><AirportTransfer TravelDuration=\\\"10\\\" Frequency=\\\"20\\\" Price=\\\"\\\"/><Prices TotalPrice=\\\"50.99\\\"/><Raw><Filter><meet_and_greet>0</meet_and_greet><park_and_ride>1</park_and_ride><car_parked_for_you>1</car_parked_for_you><lead_time>120</lead_time></Filter><tfhrpricing>24hour</tfhrpricing></Raw></Availability></AvailabilityList></Ticket></KeyData>";
            const string keyDataWithEscapeCharacters =
                "&lt;KeyData&gt;&lt;BookingURL&gt;/sandbox/v1/carpark/HPLGV4&lt;/BookingURL&gt;&lt;Ticket&gt;&lt;AvailabilityList&gt;&lt;Availability Code=\\\"LGV4\\\" Name=\\\"Purple Parking-allterminals\\\"&gt;&lt;AirportTransfer TravelDuration=\\\"10\\\" Frequency=\\\"20\\\" Price=\\\"\\\"/&gt;&lt;Prices TotalPrice=\\\"50.99\\\"/&gt;&lt;Raw&gt;&lt;Filter&gt;&lt;meet_and_greet&gt;0&lt;/meet_and_greet&gt;&lt;park_and_ride&gt;1&lt;/park_and_ride&gt;&lt;car_parked_for_you&gt;1&lt;/car_parked_for_you&gt;&lt;lead_time&gt;120&lt;/lead_time&gt;&lt;/Filter&gt;&lt;tfhrpricing&gt;24hour&lt;/tfhrpricing&gt;&lt;/Raw&gt;&lt;/Availability&gt;&lt;/AvailabilityList&gt;&lt;/Ticket&gt;&lt;/KeyData&gt;";
            
            var request = new InfoBookingRequest
            {
                Bkg_Ent = new Bkg_Ent
                {
                    Item =
                    [
                        new Item
                        {
                            Items =
                            [
                                new SrcData
                                {
                                    KeyValuePair =
                                    [
                                        new KeyValuePair { Key = "KeyData", Value = keyData }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            };
        
            string outputXml = XmlParseService.SerializeXml(request, null, null);
        
            int startIndex = outputXml.IndexOf("KeyData\">", StringComparison.OrdinalIgnoreCase) + 9;
            string outputCDATA = outputXml.Substring(startIndex, outputXml.IndexOf("</KeyValuePair>", StringComparison.OrdinalIgnoreCase) - startIndex);
        
            Assert.Equal(keyDataWithEscapeCharacters, outputCDATA);
        }

        [Fact]
        public void XmlWriter_WhenCDATAisPresentAndHasEscapeCharacters_ShouldBeParsedCorrectly()
        {
            const string keyData =
                "<KeyData><BookingURL>/sandbox/v1/carpark/HPLGV4</BookingURL><Ticket><AvailabilityList><Availability Code=\\\"LGV4\\\" Name=\\\"Purple Parking-allterminals\\\"><AirportTransfer TravelDuration=\\\"10\\\" Frequency=\\\"20\\\" Price=\\\"\\\"/><Prices TotalPrice=\\\"50.99\\\"/><Raw><Filter><meet_and_greet>0</meet_and_greet><park_and_ride>1</park_and_ride><car_parked_for_you>1</car_parked_for_you><lead_time>120</lead_time></Filter><tfhrpricing>24hour</tfhrpricing></Raw></Availability></AvailabilityList></Ticket></KeyData>";
            
            var request = new InfoBookingRequest
            {
                Bkg_Ent = new Bkg_Ent
                {
                    Item =
                    [
                        new Item
                        {
                            Items =
                            [
                                new SrcData
                                {
                                    KeyValuePair =
                                    [
                                        new KeyValuePair { Key = "KeyData", Value = keyData }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            };

            string outputXml = XmlParseService.SerializeXml(request, null, null);
            InfoBookingRequest outputRequest = XmlParseService.DeserializeXml<InfoBookingRequest>(outputXml);

            string deserializedCDATA = ((SrcData)outputRequest.Bkg_Ent.Item[0].Items[0]).KeyValuePair[0].Value;

            Assert.Equal(keyData, deserializedCDATA);
        }

        [Fact]
        public void XmlWriter_WhenCDATAisNotPresent_ShouldLeaveItAsItIs()
        {
            var request = new InfoBookingRequest
            {
                Bkg_Ent = new Bkg_Ent
                {
                    Item =
                    [
                        new Item
                        {
                            Items =
                            [
                                new SrcData
                                {
                                    KeyValuePair =
                                    [
                                        new KeyValuePair { Key = "TotalPrice", Value = "10" }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            };

            string outputXml = XmlParseService.SerializeXml(request, null, null);
            
            int startIndex = outputXml.IndexOf("TotalPrice\">", StringComparison.OrdinalIgnoreCase) + 12;
            string outputTotalPrice = outputXml.Substring(startIndex, outputXml.IndexOf("</KeyValuePair>", StringComparison.OrdinalIgnoreCase) - startIndex);

            Assert.Equal("10", outputTotalPrice);
        }
    }
}
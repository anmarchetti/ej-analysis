using System.Globalization;
using System.Text.Json.Nodes;

namespace easyJet.Holidays.Api.ComponentTests.TradePortal.TradePortalGroupBooking;

public class TradeAgentGroupBookingTestUtils
{
    internal static JsonObject GetGroupBookingRequest()
    {
        var jsonObject = new JsonObject
        {
            ["AgentName"] = "Test",
            ["ABTANumber"] = "123456",
            ["Email"] = "qwe@asd.com",
            ["NumberOfRooms"] = 1,
            ["DurationOfHoliday"] = 23,
            ["DepartureDate"] = DateTime.MaxValue.Date.ToString(CultureInfo.InvariantCulture),
            ["BoardBasis"] = "whatever",
            ["DestinationHotelOrRegion"] = "whatever",
            ["AdditionalDetails"] = "please, give us at least 1 room with 3 beds",
            ["TotalPassengers"] = new JsonObject
            {
                ["Adults"] = 3,
                ["Children"] = 3,
                ["Infants"] = 3
            },
            ["DepartureAirport"] = new JsonObject
            {
                ["Airport"] = "Luton",
                ["IAmFlexible"] = false
            },
            ["Rooms"] = new JsonArray
            {
                new JsonObject
                {
                    ["RoomNumber"] = 1,
                    ["Adults"] = 3,
                    ["Children"] = 3,
                    ["ChildAges"] = new JsonArray { 2, 9, 15 },
                    ["Infants"] = 3,
                }
            }
        };

        return jsonObject;
    }
}
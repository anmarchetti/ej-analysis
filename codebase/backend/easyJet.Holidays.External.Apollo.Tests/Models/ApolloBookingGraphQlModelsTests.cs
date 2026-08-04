using easyJet.Holidays.External.Apollo.Models;
using easyJet.Holidays.External.Apollo.Models.Base;
using Newtonsoft.Json;
using Xunit;

#nullable enable

namespace easyJet.Holidays.External.Apollo.Tests.Models;

public class ApolloBookingGraphQlModelsTests
{
    [Fact]
    public void Deserialize_BookingsConnection_MapsItemsAndNextToken()
    {
        const string json = """
                            {
                              "bookings": {
                                "items": [
                                  { "reference": "EJH1" },
                                  { "reference": "EJH2" }
                                ],
                                "nextToken": "token-2"
                              }
                            }
                            """;

        var data = JsonConvert.DeserializeObject<ApolloBookingsData<ApolloUpcomingBooking>>(json);

        Assert.NotNull(data);
        Assert.NotNull(data!.Bookings);
        Assert.Equal("token-2", data.Bookings!.NextToken);
        Assert.Equal(2, data.Bookings.Items?.Count());
        Assert.Equal("EJH1", data.Bookings.Items?.First().Reference);
        Assert.Equal("EJH2", data.Bookings.Items?.Last().Reference);
    }

    [Fact]
    public void BookingConnectionResult_HoldsAssignedValues()
    {
        var result = new ApolloUpcomingBookingConnectionResult
        {
            Items =
            [
                new ApolloUpcomingBooking { Reference = "EJH123" }
            ],
            NextToken = "next"
        };

        Assert.Single(result.Items);
        Assert.Equal("EJH123", result.Items.First().Reference);
        Assert.Equal("next", result.NextToken);
    }

    [Fact]
    public void FilterModels_HoldConfiguredValues()
    {
        var filter = new ApolloBookingFilterInput
        {
            Reference = new ApolloStringComparisonExp { Eq = "EJH123" },
            EncryptedMemberId = new ApolloStringComparisonExp { Eq = "member-1" },
            Status = new ApolloStringComparisonExp { In = ["CONFIRMED", "PENDING"] },
            And =
            [
                new ApolloBookingFilterInput
                {
                    Reference = new ApolloStringComparisonExp { Eq = "EJH123" }
                }
            ],
            Or =
            [
                new ApolloBookingFilterInput
                {
                    Status = new ApolloStringComparisonExp { Eq = "CONFIRMED" }
                }
            ]
        };

        Assert.Equal("EJH123", filter.Reference!.Eq);
        Assert.Equal("member-1", filter.EncryptedMemberId!.Eq);
        Assert.Equal(["CONFIRMED", "PENDING"], filter.Status!.In);
        Assert.Single(filter.And!);
        Assert.Single(filter.Or!);
    }
}

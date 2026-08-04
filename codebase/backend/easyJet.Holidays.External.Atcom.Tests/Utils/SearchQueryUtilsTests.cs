using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Utils
{
    public class SearchQueryUtilsTests
    {
        public static IEnumerable<object[]> BuildRoomAllocationQueryTestData()
        {
            yield return new object[] {
                "Null value",
                null,
                ""
            };
            yield return new object[] {
                "Empty collection",
                new List<RoomAllocation>() {
                },
                ""
            };
            yield return new object[] {
                "Multiple rooms with room codes",
                new List<RoomAllocation>() {
                    new RoomAllocation {
                        Adults=1,
                        Children=1,
                        Infants=1,
                        RoomCode="1BA01"
                    },
                    new RoomAllocation {
                        Adults=1,
                        Children=0,
                        Infants=0,
                    },
                    new RoomAllocation {
                    },
                },
                "rmtp_1=1BA01&rm_1=1,3,4&rm_2=2&rm_3="
            };
            yield return new object[] {
                "Multiple rooms with room codes & hash symbol should be encoded",
                new List<RoomAllocation>() {
                    new RoomAllocation {
                        Adults=1,
                        RoomCode="DBL.DX-KG!NOR.ID_B2B_15#OD15BB"
                    },
                    new RoomAllocation {
                        Adults=1,
                        RoomCode="DBL.-_%$@*+= RM"
                    }
                },
                "rmtp_1=DBL.DX-KG!NOR.ID_B2B_15%23OD15BB&rm_1=1&rmtp_2=DBL.-_%25%24%40*%2b%3d+RM&rm_2=2"
            };

            yield return new object[] {
                "Guetss should be in correct order:  adults, chldren, infants",
                new List<RoomAllocation>() {
                    new RoomAllocation {
                        Adults=1,
                        Children=0,
                        Infants=1,
                    },
                    new RoomAllocation {
                        Adults=2,
                        Children=1,
                        Infants=0,
                    }
                },
                "rm_1=1,5&rm_2=2,3,4"
            };
            yield return new object[] {
                "Guetss should be in correct order:  adults, chldren, infants (#2)",
                new List<RoomAllocation>() {
                    new RoomAllocation {
                        Adults=1,
                        Children=1,
                        Infants=1,
                    },
                    new RoomAllocation {
                        Adults=2,
                        Children=1,
                        Infants=1,
                    },
                    new RoomAllocation {
                        Adults=1,
                        Children=0,
                        Infants=1
                    },
                },
                "rm_1=1,5,7&rm_2=2,3,6,8&rm_3=4,9"
            };
        }

        [Theory]
        [MemberData(nameof(BuildRoomAllocationQueryTestData))]
        public void BuildRoomAllocationQuery_BuildQuery(string because, List<RoomAllocation> allocations, string expected)
        {
            // Act
            var actual = SearchQueryUtils.BuildRoomAllocationQuery(allocations);

            // Assert
            actual.Should().Be(expected, because);
        }
    }
}

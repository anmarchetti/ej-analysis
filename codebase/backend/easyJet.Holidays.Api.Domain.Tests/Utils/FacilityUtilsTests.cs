using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Utils
{
    public class FacilityUtilsTests
    {
        [Theory]
        [MemberData(nameof(BuildFacilitiesTestData))]
        public void GroupFacility_TestData_ReturnsCorrectResult(List<Facility> facilities, IEnumerable<Facility> groupedFacilities)
        {
            // Act
            var act = FacilityUtils.GroupFacility(facilities);

            // Assert
            act.Should().BeEquivalentTo(groupedFacilities);
        }

        [Fact]
        public void GroupFacility_NullInputFacilties_ReturnsEmptyCollecton()
        {
            // Act
            var act = FacilityUtils.GroupFacility(null);

            // Assert
            act.Should().BeEmpty();
        }

        [Fact]
        public void GroupFacility_EmptyInputFacilties_ReturnsEmptyCollecton()
        {
            // Act
            var act = FacilityUtils.GroupFacility(new List<Facility>());

            // Assert
            act.Should().BeEmpty();
        }

        public static readonly List<object[]> BuildFacilitiesTestData = new List<object[]>
        {
            new object[]
            {
                //input data
                new List<Facility>()
                {
                    new Facility()
                    {
                        Name = "Golf desk",
                        Code = "70-545",
                        TrackingId = "Golf Desk"
                    },
                    new Facility()
                    {
                        Name = "Spa center",
                        Code = "71-200",
                        FacilityFilterGroup = new FacilityFilterGroup()
                        {
                            Code = "74-998",
                            Name = "Spa",
                            TrackingId = "Spa",
                            ParentName = "Health",
                            ParentCode = "74"
                        }
                    },
                    new Facility()
                    {
                        Name = "Spa treatments",
                        Code = "74-460",
                        FacilityFilterGroup = new FacilityFilterGroup()
                        {
                            Code = "74-998",
                            Name = "Spa",
                            TrackingId = "Spa",
                            ParentName = "Health",
                            ParentCode = "74"
                        }
                    },
                },
                //result data
                new List<Facility>()
                {
                    new Facility()
                    {
                        Name = "Golf desk",
                        Code = "70-545",
                        TrackingId = "Golf Desk"
                    },
                    new Facility()
                    {
                        Name = "Spa",
                        Code = "74-998",
                        TrackingId = "Spa",
                        FacilityFilterGroup = new FacilityFilterGroup()
                        {
                            Code = "74-998",
                            Name = "Spa",
                            TrackingId = "Spa",
                            ParentName = "Health",
                            ParentCode = "74"
                        }
                    }
                }
            },
            new object[]
            {
                //input data
                new List<Facility>()
                {
                    new Facility()
                    {
                        Name = "Children playground",
                        Code = "73-350",
                    },
                    new Facility()
                    {
                        Name = "Entertainment Area",
                        Code = "40-125",
                    },
                    new Facility()
                    {
                        Name = "Spa include",
                        Code = "71-200",
                        FacilityFilterGroup = new FacilityFilterGroup()
                        {
                            Code = "74-998",
                            Name = "Spa",
                            ParentName = "Health",
                            ParentCode = "74"
                        }
                    },
                    new Facility()
                    {
                        Name = "Spa treatments",
                        Code = "74-460",
                        FacilityFilterGroup = new FacilityFilterGroup()
                        {
                            Code = "74-998",
                            Name = "Spa",
                            ParentName = "Health",
                            ParentCode = "74"
                        }
                    },
                    new Facility()
                    {
                        Name = "Spa centre",
                        Code = "74-620",
                        FacilityFilterGroup = new FacilityFilterGroup()
                        {
                            Code = "74-998",
                            Name = "Spa",
                            ParentName = "Health",
                            ParentCode = "74"
                        }
                    },
                },
                //result data
                new List<Facility>()
                {
                    new Facility()
                    {
                        Name = "Children playground",
                        Code = "73-350",
                    },
                    new Facility()
                    {
                        Name = "Entertainment Area",
                        Code = "40-125",
                    },
                    new Facility()
                    {
                        Name = "Spa",
                        Code = "74-998",
                        FacilityFilterGroup = new FacilityFilterGroup()
                        {
                            Code = "74-998",
                            Name = "Spa",
                            ParentName = "Health",
                            ParentCode = "74"
                        }
                    }
                },
            },
            new object[]
            {
                //input data
                new List<Facility>()
                {
                    new Facility()
                    {
                        Name = "Outdoor pool",
                        Code = "73-363",
                    },
                    new Facility()
                    {
                        Name = "Outdoor heated pool",
                        Code = "73-365",
                        FacilityFilterGroup = new FacilityFilterGroup()
                        {
                            Code = "73-363",
                            Name = "Outdoor pool",
                            ParentName = "Pool & Beach",
                            ParentCode = "73"
                        }
                    },
                },
                //result data
                new List<Facility>()
                {
                   new Facility()
                   {
                       Name = "Outdoor pool",
                       Code = "73-363",
                   },
                },
            }
        };
    }
}
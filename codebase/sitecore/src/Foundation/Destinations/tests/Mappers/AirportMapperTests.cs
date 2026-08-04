using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Mappers
{
    public class AirportMapperTests
    {
        [Theory]
        [AutoData]
        public void BuildAirportGroup_ShouldBuildAirportTree_IfAirportItemExistInDatabase(ID airportGroupId)
        {
            // Arrange
            using (Db db = new Db
            {
                new DbItem("Airport group folder", airportGroupId)
                {
                    new DbItem("UK", ID.NewID, Constants.TemplateIds.AirportsGroup)
                    {
                        new DbItem("London", ID.NewID, Constants.TemplateIds.AirportsGroup)
                        {
                            new DbItem("LGW", ID.NewID, Constants.TemplateIds.Airport)
                            {
                                new DbField(Constants.Fields.DatasourceItem.Name) { Value = "LGW" },
                                new DbField(Constants.Fields.DatasourceItem.Code) { Value = "LGW" }
                            },
                            new DbItem("LTN", ID.NewID, Constants.TemplateIds.Airport)
                            {
                                new DbField(Constants.Fields.DatasourceItem.Name) { Value = "LTN" },
                                new DbField(Constants.Fields.DatasourceItem.Code) { Value = "LTN" }
                            }
                        }
                    }
                }
            })
            {
                HashSet<string> depCodes = new HashSet<string>()
                {
                    "LGW"
                };

                Item airportGroupFolder = db.GetItem(airportGroupId);
                // Act
                var actual = AirportMapper.BuildAirportGroup(airportGroupFolder, depCodes).ToList();

                // Assert
                actual.Count.Should().Be(1);
                actual[0].Should().BeOfType<AirportsGroup>();
                var ukAirportGroup = actual[0] as AirportsGroup;
                (ukAirportGroup.Airports.ToList()[0] as AirportsGroup).HasDepartureAirports.Should().BeTrue();
            }
        }
    }
}

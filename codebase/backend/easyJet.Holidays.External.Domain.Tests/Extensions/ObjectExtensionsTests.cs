using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Extensions;
using FluentAssertions;
using System.Runtime.Serialization;
using Xunit;

namespace easyJet.Holidays.External.Domain.Tests.Extensions
{
    public class ObjectExtensionsTests
    {
        [Theory]
        [MemberData(nameof(QueryStringData))]
        public void GetQueryString_StateUnderTest_ExpectedBehavior(object sut, QueryStringOptions options, string expected)
        {
            // Act
            var result = sut.GetQueryString(options);

            // Assert
            result.Should().Be(expected);
        }

        public static List<object[]> QueryStringData = new List<object[]>() {
            new object[] { new QueryString_WithDataMemberName { Data = "1"}, null, "propertyName=1" },
            new object[] { new QueryString_FieldAndProp { Data = 1, City = 2}, null, "data=1" },
            new object[] { new QueryString_WithoutDataMemberName { Data = "1"}, null, "Data=1" },
            new object[] { new QueryString_WithoutDataMemberAnnotation { Data = 1, PlainData = 2}, null, "Data=1" },
            new object[] { new QueryString_BoolField { Data = true }, null, "Data=Y" },
            new object[] { new QueryString_BoolField { Data = false }, null, "Data=N" },
            new object[] { new QueryString_WithDataMemberName { Data = null}, null, "" }, // null value
            new object[] { new QueryString_WithoutDataMemberName { Data = "1&2?3"}, null, "Data=1%262%3f3" }, // Encode
            new object[] { new QueryString_Array { Data = new[] { "test", "test1"} }, null, "propertyName1=test,test1" }, // Encode
            new object[] { new QueryString_Array { Data = new[] { "test", "test1"} }, new QueryStringOptions() {
                UseDeepArrayParse= true
            }, "propertyName1[0]=test&propertyName1[1]=test1" },
            new object[] { new QueryString_ObjectsArray { Data = new QueryString_WithDataMemberName[1] { new QueryString_WithDataMemberName() {
                Data = "test"
            } } }, null,"propertyName1[0][propertyName]=test" },
            new object[] { new QueryString_Objects  { Data = new QueryString_WithDataMemberName() {
                Data = "test"
            }},null, "propertyName1[propertyName]=test" },
            new object[] { new QueryString_EnumFlags { Filter = DestinationFilter.Region}, null, "filter=2" },
            new object[] { new QueryString_EnumFlags { Filter = DestinationFilter.Country | DestinationFilter.Resort}, null, "filter=5" },
            new object[] { new QueryString_EnumFlags {
                Filter = DestinationFilter.Country | DestinationFilter.Region | DestinationFilter .Resort | DestinationFilter .VirtualCountry | DestinationFilter .VirtualRegion},
                null,
                "filter=55"
            },
        };

        class QueryString_WithDataMemberName
        {
            [DataMember(Name = "propertyName")]
            public string Data { get; set; }

            public void Method() { }
        }

        class QueryString_FieldAndProp
        {
            [DataMember(Name = "data")]
            public int Data { get; set; }


            [DataMember(Name = "city")]
            public int City;
        }

        class QueryString_WithoutDataMemberName
        {
            [DataMember]
            public string Data { get; set; }
        }

        class QueryString_WithoutDataMemberAnnotation
        {
            [DataMember]
            public int Data { get; set; }

            public int PlainData { get; set; }
        }

        class QueryString_BoolField
        {
            [DataMember]
            public bool Data { get; set; }
        }

        class QueryString_Array
        {
            [DataMember(Name = "propertyName1")]
            public string[] Data { get; set; }
        }

        class QueryString_ObjectsArray
        {
            [DataMember(Name = "propertyName1")]
            public QueryString_WithDataMemberName[] Data { get; set; }
        }

        class QueryString_Objects
        {
            [DataMember(Name = "propertyName1")]
            public QueryString_WithDataMemberName Data { get; set; }
        }

        class QueryString_EnumFlags
        {
            [DataMember(Name = "filter")]
            public DestinationFilter Filter { get; set; }
        }
    }
}
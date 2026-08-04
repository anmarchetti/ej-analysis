using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.External.Domain.Models.Api;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Moq;
using System.Runtime.Serialization;
using Xunit;

namespace easyJet.Holidays.External.Domain.Tests.Models.Api
{
    public class ApiRequestMock : ApiRequest
    {
        public override string PayloadString => string.Empty;
    }

    public class ApiRequestWithBoolMock : ApiRequest
    {
        public override string PayloadString => string.Empty;

        [DataMember]
        public bool Arg { get; set; }
    }

    public class ApiRequestTests
    {
        [Theory]
        [InlineData("q=1", "works:{0}", "works:q=1")] // happy path
        [InlineData(null, "works:{0}", "works:")] // null initial value
        [InlineData("q=1", null, "q=1")] // null template
        [InlineData("q=1", "works:", "works:")] // template without placeholder
        [InlineData("q=$%^&*", "k=a&{0}", "k=a&q=$%^&*")] // template without placeholder                
        public void UpdateQueryString_StateUnderTest_ExpectedBehavior(string initial, string template, string expected)
        {
            // Arrange
            var sut = new Mock<ApiRequestMock>() { CallBase = true };
            sut.Setup(x => x.BuildQueryString(It.IsAny<QueryStringOptions>())).Returns(initial);

            // Act
            sut.Object.SetQueryString(template);

            // Assert
            sut.Object.QueryParams.Should().Be(expected);
        }

        [Theory]
        [InlineData("", "q=1", "q=1")]
        [InlineData("q=1", "k=2", "q=1&k=2")]
        [InlineData("q=$%^&*", "k=2&c=3>4", "q=$%^&*&k=2&c=3>4")]
        public void AddQueryString_StateUnderTest_ExpectedBehavior(
            string initial,
            string queryToAdd,
            string expected
        )
        {
            // Arrange
            var sut = new ApiRequestMock();
            sut.SetProperty(x => x.QueryParams, initial);

            // Act
            sut.AddQueryString(queryToAdd);

            // Assert
            sut.QueryParams.Should().Be(expected);
        }

        [Theory]
        [InlineData(true, false, "Arg=Y")]
        [InlineData(false, false, "Arg=N")]
        [InlineData(true, true, "Arg=true")]
        [InlineData(false, true, "Arg=false")]
        public void BuildQueryString_Booleans_BUildString(bool arg, bool useBooleanString, string expected)
        {
            // Arrange
            var sut = new ApiRequestWithBoolMock
            {
                Arg = arg
            };

            // Act
            var actual = sut.BuildQueryString(new QueryStringOptions
            {
                UseBooleanString = useBooleanString
            });

            // Assert
            actual.Should().Be(expected);
        }
    }
}

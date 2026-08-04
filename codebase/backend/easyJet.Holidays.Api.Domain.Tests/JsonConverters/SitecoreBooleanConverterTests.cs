using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using FluentAssertions;
using Newtonsoft.Json;
using System.Runtime.Serialization;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.JsonConverters
{
    public class SitecoreBooleanConverterTests
    {
        [DataContract]
        private class TestValueHolder
        {
            [DataMember]
            [JsonConverter(typeof(SiteCoreBooleanConverter))]
            public bool Value { get; set; }
        }

        [Theory]
        [InlineData(true, "{\"Value\":\"1\"}")]
        [InlineData(false, "{\"Value\":\"\"}")]
        public void Value_shouldSerialize(bool value, string expectedJson)
        {
            var serialized = JsonConvert.SerializeObject(new TestValueHolder { Value = value });
            serialized.Should().Be(expectedJson);
        }

        [Theory]
        [InlineData("1", true)]
        [InlineData("something", false)]
        [InlineData("0", false)]
        public void Value_ShouldDeserialize(string stringValue, bool expecteBoolean)
        {
            var deserialized = JsonConvert.DeserializeObject<TestValueHolder>($"{{\"Value\":\"{stringValue}\"}}");
            deserialized.Value.Should().Be(expecteBoolean);
        }
    }
}
using FluentAssertions;
using FluentAssertions.Primitives;
using Newtonsoft.Json;
using System.Diagnostics;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Utils
{
    public static class FluentAssertionsExtensions
    {
        public static AndConstraint<StringAssertions> BeEqualAfterNormalization<T>(this StringAssertions parent, string value)
        {
            Debug.Assert(parent != null, nameof(parent) + " != null");
            T valueAsObject = JsonConvert.DeserializeObject<T>(parent.Subject);
            T expectedAsObject = JsonConvert.DeserializeObject<T>(value);

            string normalizedValue = JsonConvert.SerializeObject(valueAsObject);
            string normalizedExpected = JsonConvert.SerializeObject(expectedAsObject);

            Assert.Equal(normalizedExpected, normalizedValue);
            
            return new AndConstraint<StringAssertions>(parent);
        }
    }

}
using System.Collections.Generic;
using Sitecore.Analytics.Tracking;
using Sitecore.NSubstituteUtils;

namespace easyJet.Foundation.Analytics.Tests.Services
{
    public static class ProfileServiceTestsData
    {
        public static IEnumerable<object[]> BoostUserPattern_InvalidPatternCardOrProfilePropertiesData()
        {
            yield return new object[]
            {
                null, null,
            };

            var patternName = "testPattern";
            yield return new object[]
            {
                FakeUtil.FakeItem(patternName),
                new Profile(string.Empty) { PatternLabel = patternName },
            };
        }

        public static string ValidXmlForWithValidPatternCardAndProfile(string name, string value)
        {
            return $"<key name='{name}' value='{value}'/>";
        }
    }
}
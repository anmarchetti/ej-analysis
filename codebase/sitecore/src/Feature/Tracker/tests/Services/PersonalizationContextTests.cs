using System.Linq;
using easyJet.Feature.Tracker.Models.Personalize;
using easyJet.Feature.Tracker.Services.Personalize;
using FluentAssertions;
using Xunit;

namespace easyJet.Feature.Tracker.Tests.Services
{
    public class PersonalizationContextTests
    {
        [Fact]
        public void AddPersonalization_Success()
        {
            var personalizationContext = new PersonalizationContext();

            var testRenderingId = "testRenderingId";
            var testKey = "key";
            var testValue = new PersonalizeResult { SelectionAttribute = "testValue" };

            personalizationContext.AddOrUpdateRenderingMapping(testRenderingId, testKey);
            personalizationContext.AddOrUpdatePersonalization(testKey, testValue);

            var result = personalizationContext.GetAllPersonalizations();

            result.Count().Should().BeGreaterOrEqualTo(1);
            result.First().UniqueId.Should().BeEquivalentTo(testRenderingId);
            result.First().FriendlyId.Should().BeEquivalentTo(testKey);
            result.First().SelectionAttr.Should().BeEquivalentTo(testValue.SelectionAttribute);
            result.First().Ctas.Should().Equal(testValue.Ctas);
        }

        [Fact]
        public void UpdatePersonalization_Success()
        {
            var personalizationContext = new PersonalizationContext();

            var testRenderingId = "testRenderingId";
            var testKey = "key";
            var testValue = new PersonalizeResult { SelectionAttribute = "testValue" };
            var testValue2 = new PersonalizeResult { SelectionAttribute = "testValue2" };

            personalizationContext.AddOrUpdateRenderingMapping(testRenderingId, testKey);
            personalizationContext.AddOrUpdatePersonalization(testKey, testValue);
            personalizationContext.AddOrUpdatePersonalization(testKey, testValue2);

            var result = personalizationContext.GetAllPersonalizations();

            result.Count().Should().BeGreaterOrEqualTo(1);
            result.First().UniqueId.Should().BeEquivalentTo(testRenderingId);
            result.First().FriendlyId.Should().BeEquivalentTo(testKey);
            result.First().SelectionAttr.Should().BeEquivalentTo(testValue2.SelectionAttribute);
        }

        [Fact]
        public void GetAllPersonalization_Success()
        {
            var personalizationContext = new PersonalizationContext();

            var testRenderingId = "testRenderingId";
            var testKey = "key";
            var testValue = new PersonalizeResult { SelectionAttribute = "testValue" };
            var testRenderingId1 = "testRenderingId1";
            var testKey1 = "key1";
            var testValue1 = new PersonalizeResult { SelectionAttribute = "testValue1" };

            personalizationContext.AddOrUpdateRenderingMapping(testRenderingId, testKey);
            personalizationContext.AddOrUpdateRenderingMapping(testRenderingId1, testKey1);
            personalizationContext.AddOrUpdatePersonalization(testKey, testValue);
            personalizationContext.AddOrUpdatePersonalization(testKey1, testValue1);

            var result = personalizationContext.GetAllPersonalizations();

            result.Count().Should().BeGreaterOrEqualTo(2);
            result.First().FriendlyId.Should().BeEquivalentTo(testKey);
            result.First().SelectionAttr.Should().BeEquivalentTo(testValue.SelectionAttribute);
            result.Last().FriendlyId.Should().BeEquivalentTo(testKey1);
            result.Last().SelectionAttr.Should().BeEquivalentTo(testValue1.SelectionAttribute);
        }

        [Fact]
        public void TryGetValue_Success()
        {
            var personalizationContext = new PersonalizationContext();

            var testKey = "key";
            var testValue = new PersonalizeResult { SelectionAttribute = "testValue" };

            personalizationContext.AddOrUpdatePersonalization(testKey, testValue);

            var result = personalizationContext.TryGetPersonalization(testKey, out var valueResult);

            result.Should().BeTrue();
            valueResult.SelectionAttribute.Should().Be(testValue.SelectionAttribute);
            valueResult.IsPreview.Should().Be(testValue.IsPreview);
            valueResult.Ctas.Should().Equal(testValue.Ctas);
        }

        [Fact]
        public void TryGetValue_NoResult()
        {
            var personalizationContext = new PersonalizationContext();
            var testKey = "key";

            var result = personalizationContext.TryGetPersonalization(testKey, out var valueResult);

            result.Should().BeFalse();
            valueResult.Should().BeNull();
        }

        [Fact]
        public void OverrideMappingValue_Success()
        {
            var personalizationContext = new PersonalizationContext();

            var testRenderingId = "testRenderingId";
            var testKey = "key";
            var testKey1 = "key1";
            var testKey2 = "key2";
            var testValue = new PersonalizeResult { SelectionAttribute = "testValue" };

            personalizationContext.AddOrUpdateRenderingMapping(testRenderingId, testKey);
            personalizationContext.AddOrUpdateRenderingMapping(testRenderingId, testKey1);
            personalizationContext.AddOrUpdateRenderingMapping(testRenderingId, testKey2);
            personalizationContext.AddOrUpdatePersonalization(testKey2, testValue);

            var result = personalizationContext.GetAllPersonalizations();

            result.Count().Should().BeGreaterOrEqualTo(1);
            result.First().FriendlyId.Should().BeEquivalentTo(testKey2);
            result.First().SelectionAttr.Should().BeEquivalentTo(testValue.SelectionAttribute);
            result.First().Ctas.Should().Equal(testValue.Ctas);
        }
    }
}

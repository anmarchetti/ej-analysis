using AutoFixture.Xunit2;
using easyJet.Feature.ChangeTracking.Extensions;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.ChangeTracking.Tests.Services
{
    public class ItemExtensionsTests
    {
        [Theory]
        [AutoData]
        public void InheritsFromShouldReturnTrue_IfCorrectBaseClass(ID templateId)
        {
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId);
            item.ToSitecoreItem().InheritsFrom(templateId).Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void InheritsFromShouldReturnFalse_IfWrongBaseClass(ID templateId)
        {
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId);
            item.ToSitecoreItem().InheritsFrom(ID.NewID).Should().BeFalse();
        }
    }
}
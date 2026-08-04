using easyJet.Foundation.SitecoreExtensions.ContentSearch.Fields;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Sitecore.ContentSearch;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.ContentSearch.Fields
{
    public class BaseImageComputedFieldTests
    {
        [Theory]
        [AutoDbData]
        public void ComputeField_ShouldBeNull_IfMediaItemIsNull(
            BaseImageComputedField field,
            SitecoreIndexableItem item)
        {
            // Act
            var actual = field.ComputeField(item);

            // Assert
            actual.Should().BeNull();
        }
    }
}

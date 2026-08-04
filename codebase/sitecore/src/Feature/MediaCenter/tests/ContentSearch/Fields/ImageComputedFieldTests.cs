using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Feature.MediaCenter.ContentSearch.Fields;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using FluentAssertions;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Feature.MediaCenter.Tests.ContentSearch.Fields
{
    public class ImageComputedFieldTests
    {
        protected Fixture Fixture { get; private set; }

        protected Db Db { get; private set; }

        private readonly ImageComputedField imageComputedField;

        public ImageComputedFieldTests()
        {
            Fixture = new Fixture();
            Db = Fixture.Freeze<Db>();

            imageComputedField = new ImageComputedField();
        }

        [Fact]
        public void IsValid_ShouldBeTrue_IfArticlePageTemplate()
        {
            // Arrange
            var articlePageItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            articlePageItem.TemplateID = Constants.TemplateIds.ArticlePage;

            Db.Add(articlePageItem);

            // Act
            var actual = imageComputedField.IsValid(Db.GetItem(articlePageItem.ID));

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void GetMediaUrl_ShouldBeNull_IfMediaItemNull(string fieldName)
        {
            // Arrange
            var item = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.Fields.Add(fieldName, string.Empty);
            Db.Add(item);

            // Act
            var actual = Db.GetItem(item.ID).GetMediaUrl(fieldName);

            // Assert
            actual.Should().BeNull();
        }
    }
}

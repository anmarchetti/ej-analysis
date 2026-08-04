using AutoFixture;
using easyJet.Feature.MediaCenter.ContentSearch.Fields;
using FluentAssertions;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Feature.MediaCenter.Tests.ContentSearch.Fields
{
    public class ArticleUrlComputedFieldTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly ArticleUrlComputedField computedField;

        public ArticleUrlComputedFieldTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();

            computedField = new ArticleUrlComputedField();
        }

        [Fact]
        public void IsValid_ShouldBeTrue_IfItemIsArticlePage()
        {
            // Arrange
            var articlePageItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            articlePageItem.TemplateID = Constants.TemplateIds.ArticlePage;
            db.Add(articlePageItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(articlePageItem.ID));

            // Act
            var actual = computedField.IsValid(indexableItem);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void ComputeField_ShouldReturnNull_IfLayoutFieldEmpty()
        {
            // Arrange
            var articlePageItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            articlePageItem.TemplateID = Constants.TemplateIds.ArticlePage;

            db.Add(articlePageItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(articlePageItem.ID));

            // Act
            using (new SettingsSwitcher("MediaCenter.SiteContextName", "fake"))
            {
                var actual = computedField.ComputeField(indexableItem);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Fact]
        public void ComputeField_ShouldReturnNull_IfLayoutFieldNull()
        {
            // Arrange
            var articlePageItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            articlePageItem.TemplateID = Constants.TemplateIds.ArticlePage;

            db.Add(articlePageItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(articlePageItem.ID));

            // Act
            using (new SettingsSwitcher("MediaCenter.SiteContextName", "fake"))
            {
                var actual = computedField.ComputeField(indexableItem);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Fact]
        public void ComputeField_ShouldReturnItemUrl_IfLayoutFieldNotNullOrEmpty()
        {
            // Arrange
            var articlePageItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            articlePageItem.TemplateID = Constants.TemplateIds.ArticlePage;

            var layoutField = new DbField(FieldIDs.LayoutField)
            {
                Value = "fake"
            };

            articlePageItem.Fields.Add(layoutField);

            db.Add(articlePageItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(articlePageItem.ID));

            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" }
                });

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (new SettingsSwitcher("MediaCenter.SiteContextName", "fake"))
            {
                var actual = computedField.ComputeField(indexableItem);

                // Assert
                actual.Should().NotBeNull();
            }
        }
    }
}

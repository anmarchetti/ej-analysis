using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Feature.MediaCenter.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Feature.MediaCenter.Tests.ContentSearch.Fields
{
    public class TopicsComputedFieldTests
    {
        protected Fixture Fixture { get; private set; }

        protected Db Db { get; private set; }

        private readonly TopicsComputedField topicsComputedField;

        public TopicsComputedFieldTests()
        {
            Fixture = new Fixture();
            Db = Fixture.Freeze<Db>();

            topicsComputedField = new TopicsComputedField();
        }

        [Fact]
        public void IsValid_ShouldBeTrue_IfArticlePageTemplate()
        {
            // Arrange
            var articlePageItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            articlePageItem.TemplateID = Constants.TemplateIds.ArticlePage;

            Db.Add(articlePageItem);

            // Act
            var actual = topicsComputedField.IsValid(Db.GetItem(articlePageItem.ID));

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void ComputeField_ShouldReturnNull_IfTopicItemsNotExist()
        {
            // Arrange
            var articlePageItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            Db.Add(articlePageItem);

            var indexableItem = new SitecoreIndexableItem(Db.GetItem(articlePageItem.ID));

            // Act
            var actual = topicsComputedField.ComputeField(indexableItem);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeField_ShouldNotBeNull_IfTemplateIndexedItemIsValid()
        {
            // Arrange
            var articlePageItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var topicItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var topicsField = new DbField(Constants.Fields.ArticlePageItem.Topics)
            {
                Type = "Multilistfield",
                Value = $"{topicItem.ID}"
            };

            articlePageItem.Fields.Add(topicsField);

            Db.Add(articlePageItem);
            Db.Add(topicItem);

            // Act
            var actual = topicsComputedField.ComputeField(new SitecoreIndexableItem(Db.GetItem(articlePageItem.ID)));

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [AutoData]
        public void ComputeField_ShouldNotBeNull_IfTopicNameNotNull(string topicName)
        {
            // Arrange
            var articlePageItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var topicItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var topicNameField = new DbField(Constants.Fields.TopicItem.Name)
            {
                Value = topicName
            };

            topicItem.Fields.Add(topicNameField);

            var topicsField = new DbField(Constants.Fields.ArticlePageItem.Topics)
            {
                Type = "Multilistfield",
                Value = $"{topicItem.ID}"
            };

            articlePageItem.Fields.Add(topicsField);

            Db.Add(articlePageItem);
            Db.Add(topicItem);

            // Act
            var actual = topicsComputedField.ComputeField(new SitecoreIndexableItem(Db.GetItem(articlePageItem.ID)));

            // Assert
            actual.Should().NotBeNull();
        }
    }
}

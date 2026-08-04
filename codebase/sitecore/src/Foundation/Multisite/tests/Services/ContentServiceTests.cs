using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Services
{
    public class ContentServiceTests
    {
        private readonly ContentService contentService;
        private readonly IHtmlCacheRepository cacheRepository;

        public ContentServiceTests()
        {
            cacheRepository = Substitute.For<IHtmlCacheRepository>();
            contentService = new ContentService(cacheRepository);
        }

        [Fact]
        public void GetContentByPath_ShouldReturnEmptyDictionary_IfItemDoesNotHaveData()
        {
            // Arrange
            using (Db db = new Db
                   {
                       new DbItem("fakeitem")
                   })
            {
                // Act
                var actual = contentService.GetContentByPath("/sitecore/content/fakeitem");

                // Assert
                actual.Should().BeEmpty();
            }
        }

        [Theory]
        [InlineData(true, true)]
        public void GetContentByPath_ShouldReturnDictWithData_IfItemHasData(bool withChildren, bool readAll)
        {
            // Arrange
            const string MyImageUrl = "~/media/myimage.ashx";

            using (Db db = new Db
                   {
                       new DbItem("fakeitem")
                       {
                           { "Icon", MyImageUrl },
                           new DbItem("children")
                           {
                               new DbField("TestField", ID.NewID)
                           }
                       }
                   })
            {
                // Act
                var actual = contentService.GetContentByPath("/sitecore/content/fakeitem", withChildren, readAll);

                // Assert
                actual.Should().ContainKey("Icon");
            }
        }

        [Fact]
        public void GetContentByPath_ShouldStopExpandingMultilistField_AfterTwoLevels()
        {
            // Arrange
            var templateId = ID.NewID;
            var level3Id = ID.NewID;
            var level2Id = ID.NewID;
            var level1Id = ID.NewID;

            using (Db db = new Db
                   {
                       new DbTemplate("Content Item", templateId)
                       {
                           new DbField("Title"),
                           new DbField("RelatedItems") { Type = "Multilist" }
                       },
                       new DbItem("level3", level3Id, templateId)
                       {
                           { "Title", "Level 3" }
                       },
                       new DbItem("level2", level2Id, templateId)
                       {
                           { "Title", "Level 2" },
                           { "RelatedItems", level3Id.ToString() }
                       },
                       new DbItem("level1", level1Id, templateId)
                       {
                           { "Title", "Level 1" },
                           { "RelatedItems", level2Id.ToString() }
                       },
                       new DbItem("fakeitem", ID.NewID, templateId)
                       {
                           { "Title", "Root" },
                           { "RelatedItems", level1Id.ToString() }
                       }
                   })
            {
                // Act
                var actual = contentService.GetContentByPath("/sitecore/content/fakeitem");

                // Assert
                var level1Items = actual["RelatedItems"].Should().BeAssignableTo<List<Dictionary<string, object>>>().Subject;
                var level1 = level1Items.Single();

                var level2Items = level1["RelatedItems"].Should().BeAssignableTo<List<Dictionary<string, object>>>().Subject;
                var level2 = level2Items.Single();

                level2["Title"].Should().Be("Level 2");
                level2["RelatedItems"].Should().Be(level3Id.ToString());
            }
        }
    }
}
using System.Collections.Generic;
using System.Linq;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Sitecore.FakeDb.AutoFixture;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class ImagesComputedFieldTests
    {
        private readonly ImagesComputedField imageComputedField;
        private readonly IFixture fixture;
        private readonly Db db;

        public ImagesComputedFieldTests()
        {
            // Arrange
            imageComputedField = new ImagesComputedField();
            fixture = new Fixture().Customize(new AutoDbCustomization()).Customize(new AutoContentItemCustomization());
            db = fixture.Freeze<Db>();
        }

        [Theory]
        [AutoData]
        public void ComputeField_ShouldBeNull_If_ChildrenHasNoValidTemplate(DbItem item, DbItem imageFolder)
        {
            // Arrange
            item.ParentID = null;
            item.Children.Add(imageFolder);

            db.Add(item);

            // Act
            var actual = imageComputedField.ComputeField(new SitecoreIndexableItem(db.GetItem(item.ID)));

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void ComputeField_ShouldBeNotNull_If_ChildrenHasValidTemplate(DbItem item, DbItem imageFolder)
        {
            // Arrange
            InitItemFolder(item, imageFolder);

            db.Add(item);

            var fakeSite = new Sitecore.FakeDb.Sites.FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "website" }, { "database", "web" }
                    });

            using (new Sitecore.FakeDb.Sites.FakeSiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = imageComputedField.ComputeField(new SitecoreIndexableItem(db.GetItem(item.ID)));

                // Assert
                actual.Should().NotBeNull();
            }
        }

        // RewriteName
        [Theory]
        [AutoData]
        public void ComputeField_SmallFieldShouldBeEqualToExpectedUrl_IfImageIsExternalImage(
            DbItem item, DbItem imageFolder, DbItem externalImage, string expectedImageUrl)
        {
            // Arrange
            InitItemFolder(item, imageFolder);

            externalImage.TemplateID = Constants.TemplateIds.ExternalImage;
            externalImage.Fields.Add(Constants.Fields.BaseAppearance.ShowOnSite, Constants.Common.CheckboxTrueValue);
            externalImage.Fields.Add(Constants.Fields.ExternalImageItem.Small, expectedImageUrl);

            imageFolder.Children.Add(externalImage);

            db.Add(item);

            var fakeSite = new Sitecore.FakeDb.Sites.FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "website" }, { "database", "web" }
                    });

            using (new Sitecore.FakeDb.Sites.FakeSiteContextSwitcher(fakeSite))
            {
                // Act
                var result = imageComputedField.ComputeField(new SitecoreIndexableItem(db.GetItem(item.ID))).ToString();
                var actual = JsonConvert.DeserializeObject<List<ImageData>>(result);

                // Assert
                actual.FirstOrDefault().Small.Should().BeEquivalentTo(expectedImageUrl);
            }
        }

        private void InitItemFolder(DbItem item, DbItem imageFolder)
        {
            item.ParentID = null;
            imageFolder.TemplateID = Constants.TemplateIds.ImagesFolder;
            item.Children.Add(imageFolder);
        }
    }
}
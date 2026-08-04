using AutoFixture.Xunit2;
using easyJet.Feature.SitecoreEnhancment.FieldRenderer;
using FluentAssertions;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.FieldRenderer
{
    public class ImageFocalPointRendererTests
    {
        private readonly ImageFocalPointRenderer imageFocalPointRenderer;

        public ImageFocalPointRendererTests()
        {
            imageFocalPointRenderer = new ImageFocalPointRenderer();
        }

        [Theory]
        [AutoData]
        public void Render_FocalPointAttributesShouldBeEmpty_IfFieldValueHasNoAttributes(ID itemId)
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Item", itemId)
                {
                    new DbField("Image")
                },
            })
            {
                imageFocalPointRenderer.Item = db.GetItem(itemId);
                imageFocalPointRenderer.Parameters = new SafeDictionary<string>() { { "src", "http://localhost/fakescr" } };
                imageFocalPointRenderer.FieldValue = $@"<image/>";
                imageFocalPointRenderer.FieldName = "Image";

                // Act
                var actual = imageFocalPointRenderer.Render();

                // Assert
                actual.FirstPart.Should().Be(@"<img src=""http://localhost/fakescr?iar=0"" alt="""" mfx="""" mfy="""" dfx="""" dfy="""">");
            }
        }

        [Theory]
        [AutoData]
        public void Render_FocalPointAttributesShouldNotBeEmpty_IfFieldValueHasFocalPointAttributes(ID itemId, ID mediaId)
        {
            // Arrange
            string imageFieldValue = $@"<image mediaid=""{mediaId}"" dfx=""25"" dfy=""35"" mfx=""12"" mfy=""13"" />";
            using (var db = new Db
            {
                new DbItem("Item", itemId)
                {
                    new DbField("Image")
                    {
                        Value = imageFieldValue
                    }
                },
            })
            {
                imageFocalPointRenderer.Item = db.GetItem(itemId);
                imageFocalPointRenderer.Parameters = new SafeDictionary<string>() { { "src", "http://localhost/fakescr" } };
                imageFocalPointRenderer.FieldValue = imageFieldValue;
                imageFocalPointRenderer.FieldName = "Image";

                // Act
                var actual = imageFocalPointRenderer.Render();

                // Assert
                actual.FirstPart.Should().Be(@"<img src=""http://localhost/fakescr?iar=0"" alt="""" mfx=""12"" mfy=""13"" dfx=""25"" dfy=""35"">");
            }
        }

        [Theory]
        [AutoData]
        public void Render_ShouldBeEmpty_IfItemIsNull(ID itemId)
        {
            using (var db = new Db
            {
                new DbItem("Item", itemId)
            })
            {
                imageFocalPointRenderer.Item = db.GetItem(itemId);

                // Act
                var actual = imageFocalPointRenderer.Render();

                // Assert
                actual.IsEmpty.Should().BeTrue();
            }
        }
    }
}

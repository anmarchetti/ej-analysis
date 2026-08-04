using AutoFixture.Xunit2;
using easyJet.Feature.SitecoreEnhancment.Fields;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Fields
{
    public class ImageFocalPointFieldTests
    {
        [Theory]
        [AutoData]
        public void ImageFocalPointFields_ShouldBeParsedProperly_IfImageFieldHasFocalPointAttributes(ID itemId, ID mediaId)
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Item", itemId)
                {
                    new DbField("Image")
                    {
                        Value = $@"<image mediaid=""{mediaId}"" dfx=""25"" dfy=""35"" mfx=""12"" mfy=""13"" />"
                    }
                },
                new DbItem("Image", mediaId, Sitecore.TemplateIDs.Image)
            })
            {
                var item = db.GetItem(itemId);
                Field field = item.Fields["Image"];

                // Act
                var actual = new ImageFocalPointField(field);

                // Assert
                actual.DesktopFocalX.Should().Be("25");
                actual.DesktopFocalY.Should().Be("35");
                actual.MobileFocalX.Should().Be("12");
                actual.MobileFocalY.Should().Be("13");
            }
        }

        [Theory]
        [AutoData]
        public void ImageFocalPointFields_ShouldBeEmpty_IfImageFieldNoHasFocalPointAttributes(ID itemId, ID mediaId)
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Item", itemId)
                {
                    new DbField("Image")
                    {
                        Value = $@"<image mediaid=""{mediaId}"" />"
                    }
                },
                new DbItem("Image", mediaId, Sitecore.TemplateIDs.Image)
            })
            {
                var item = db.GetItem(itemId);
                Field field = item.Fields["Image"];

                // Act
                var actual = new ImageFocalPointField(field);

                // Assert
                actual.DesktopFocalX.Should().BeEmpty();
                actual.DesktopFocalY.Should().BeEmpty();
                actual.MobileFocalX.Should().BeEmpty();
                actual.MobileFocalY.Should().BeEmpty();
            }
        }

        [Theory]
        [AutoData]
        public void ImageFocalPointFieldsSetFocalPointValue_ShouldHaveValue_IfAttributesWereSet(ID itemId)
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Item", itemId)
                {
                    new DbField("Image")
                    {
                        Value = $@"<image />"
                    }
                }
            })
            {
                var item = db.GetItem(itemId);

                using (new EditContext(item))
                {
                    Field field = item.Fields["Image"];

                    // Act
                    var actual = new ImageFocalPointField(field)
                    {
                        DesktopFocalX = "25",
                        DesktopFocalY = "24",
                        MobileFocalX = "23",
                        MobileFocalY = "26"
                    };

                    // Assert
                    actual.GetAttribute("dfx").Should().Be("25");
                    actual.GetAttribute("dfy").Should().Be("24");
                    actual.GetAttribute("mfx").Should().Be("23");
                    actual.GetAttribute("mfy").Should().Be("26");
                }
            }
        }
    }
}

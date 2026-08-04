using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Models.Domain
{
    public class DatasourceObjectWithImageTests
    {
        [Fact]
        public void DatasourceObjectWithImage_DefaultConstructor_Success()
        {
            var result = new DatasourceObjectWithImage();

            result.Should().NotBeNull();
        }

        [Fact]
        public void DatasourceObjectWithImage_BaseDatasourceSearchResultItem_Success()
        {
            var data = new BaseDatasourceSearchResultItem()
            {
                Code = "test",
                Name = "name",
                ItemName = "ItemName",
                TemplateName = "templateName",
                Url = "test",
                SourceCodes = new[] { "test1", "test2" },
                Image = "image",
            };

            var result = new DatasourceObjectWithImage(data);

            result.Should().NotBeNull();
            result.Code.Should().Be(data.Code);
            result.Name.Should().Be(data.ItemName);
            result.ItemName.Should().Be(data.Name);
            result.Type.Should().Be(data.TemplateName);
            result.Url.Should().Be(data.Url);
            result.SourceCodes.Should().Equal(data.SourceCodes);
            result.Image.Should().Be(data.Image);
        }

        [Fact]
        public void DatasourceObjectWithImage_SitecoreItem_Success()
        {
            var child = new FakeItem()
                .WithTemplate(Constants.TemplateIds.AccommodationRoomsFolder)
                .WithField(Constants.Fields.DatasourceItem.Code, "childCode");

            var item = new FakeItem()
                .WithField(Constants.Fields.DatasourceItem.Code, "code")
                .WithField(Constants.Fields.DatasourceItem.Name, "name")
                .WithChild(child);

            var result = new DatasourceObjectWithImage(item.ToSitecoreItem());

            result.Should().NotBeNull();
            result.Code.Should().Be("code");
            result.Image.Should().Be(null);
        }
    }
}

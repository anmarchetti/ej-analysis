using easyJet.Foundation.Destinations.Mappers;
using FluentAssertions;
using Sitecore.Data.Items;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Mappers
{
    public class RequestedSearchesMapperTests
    {
        [Theory]
        [MemberData(nameof(RequestedSearchesTestsData.NonExistPageItem), MemberType = typeof(RequestedSearchesTestsData))]
        public void MapFromRequestedSearchItem_WhenPageItemNotExists_ReturnsNull(Item item, Item requestedSearchItem, bool freeForKidsOnly)
        {
            // Act
            var result = RequestedSearchesMapper.MapFromRequestedSearchItem(item, requestedSearchItem, freeForKidsOnly);

            // Assert
            result.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(RequestedSearchesTestsData.PromoPage), MemberType = typeof(RequestedSearchesTestsData))]
        public void MapFromRequestedSearchItem_WhenPromoButNotRequestedSearch_ReturnsMapped(Item item, Item requestedSearchItem, bool freeForKidsOnly)
        {
            // Act
            var result = RequestedSearchesMapper.MapFromRequestedSearchItem(item, requestedSearchItem, freeForKidsOnly);

            // Assert
            result.Should().NotBeNull();
            result.FreeForKidsOnly.Should().Be(freeForKidsOnly);
            result.Name.Should().BeEmpty();
            result.Url.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(RequestedSearchesTestsData.PromoPageWithRequestedSearch), MemberType = typeof(RequestedSearchesTestsData))]
        public void MapFromRequestedSearchItem_WhenPromoPageAndRequestedSearch_ReturnsMapped(Item item, Item requestedSearchItem, bool freeForKidsOnly)
        {
            // Act
            var result = RequestedSearchesMapper.MapFromRequestedSearchItem(item, requestedSearchItem, freeForKidsOnly);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be(requestedSearchItem.Fields[Constants.Fields.DatasourceItem.Name].Value);
        }

        [Theory]
        [MemberData(nameof(RequestedSearchesTestsData.PromoPageWithoutHotelThemesAndHotelTypes), MemberType = typeof(RequestedSearchesTestsData))]
        public void MapFromRequestedSearchItem_WhenNoThemesAndTypes_ReturnsEmpty(Item item)
        {
            // Act
            var result = RequestedSearchesMapper.MapFromRequestedSearchItem(item, null);

            // Assert
            result.Should().NotBeNull();
            result.ThemeTypes.Should().BeEmpty();
        }
    }
}
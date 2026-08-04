using System;
using System.Collections.Generic;
using System.Globalization;
using Sitecore.Data;
using Sitecore.NSubstituteUtils;

namespace easyJet.Foundation.Destinations.Tests.Mappers
{
    internal static class RequestedSearchesTestsData
    {
        private static readonly Database FakeDb = FakeUtil.FakeDatabase("fakeDB");
        private static readonly FakeItem PromoPageItem = new FakeItem(ID.NewID, FakeDb)
            .WithField("StartDate", DateTime.Now.ToString(DateTimeFormatInfo.InvariantInfo))
            .WithField("EndDate", DateTime.Now.ToString(DateTimeFormatInfo.InvariantInfo));

        private static readonly FakeItem NormalPromoPageItemWithoutThemes = new FakeItem(ID.NewID, FakeDb)
            .WithField("StartDate", DateTime.Now.ToString(DateTimeFormatInfo.InvariantInfo))
            .WithField("EndDate", DateTime.Now.ToString(DateTimeFormatInfo.InvariantInfo));

        public static IEnumerable<object[]> NonExistPageItem()
        {
            yield return new object[] { null, new FakeItem(), false };
        }

        public static IEnumerable<object[]> PromoPage()
        {
            yield return new object[]
            {
                PromoPageItem
                    .WithField(Constants.Fields.Filters.HolidayThemes, "theme1|theme2")
                    .WithField(Constants.Fields.Filters.HolidayTypes, "type1|type2")
                    .WithField(Constants.Fields.Filters.PromoCollections, "lux|lux2"),
                null,
                true
            };
            yield return new object[]
            {
                PromoPageItem, null, false
            };
        }

        public static IEnumerable<object[]> PromoPageWithRequestedSearch()
        {
            yield return new object[]
            {
                PromoPageItem,
                new FakeItem().WithField(Constants.Fields.DatasourceItem.Name, "PromoPageWithRequestedSearch")
                              .WithField(Constants.Fields.RequestedSearch.Url, "Url"),
                true
            };
        }

        public static IEnumerable<object[]> PromoPageWithoutHotelThemesAndHotelTypes()
        {
            yield return new object[]
            {
                NormalPromoPageItemWithoutThemes
            };
        }
    }
}
using System;
using System.Collections.Generic;
using easyJet.Feature.PageContent.Pipelines.ItemResolving;
using Sitecore.Data;
using Sitecore.Globalization;

namespace easyJet.Feature.PageContent.Tests.Pipelines.RequestBegin
{
    public class StandardItemResolverTestData
    {
        public static IEnumerable<object[]> ResolveDifferentPaths()
        {
            var winterHolidayItemId = ID.Parse(Guid.NewGuid()).ToString();
            var awesomeHolidaysItemId = ID.Parse(Guid.NewGuid()).ToString();
            var rootItemId = ID.Parse(Guid.NewGuid()).ToString();

            yield return new object[]
            {
                "Nested first item",
                "/root",
                GetItemTree(rootItemId, awesomeHolidaysItemId, winterHolidayItemId),
                rootItemId
            };

            yield return new object[]
            {
                "Nested with dash second item",
                "/root/awesome-holidays",
                GetItemTree(rootItemId, awesomeHolidaysItemId, winterHolidayItemId),
                awesomeHolidaysItemId
            };

            yield return new object[]
            {
                "Nested with dash third item",
                "/root/awesome-holidays/winter-holidays",
                GetItemTree(rootItemId, awesomeHolidaysItemId, winterHolidayItemId),
                winterHolidayItemId
            };

            yield return new object[]
            {
                "Nested with dash and uppercase third item",
                "/ROOT/AWESOME-HOLIDAYS/WINTER-HOLIDAYS",
                GetItemTree(rootItemId, awesomeHolidaysItemId, winterHolidayItemId),
                winterHolidayItemId
            };
        }

        public static IEnumerable<object[]> ResolveFullPathsInvalidPathsOrNullDb()
        {
            yield return new object[] { new ResolveItemArgs(string.Empty) { Language = Language.Parse("en") } };
            yield return new object[] { new ResolveItemArgs("this path does not start with '/'") { Language = Language.Parse("en") } };
            yield return new object[] { new ResolveItemArgs("/this/path/does/but/db/is/still/null") { Language = Language.Parse("en") } };
        }

        private static List<DtoItem> GetItemTree(string rootItemId, string awesomeHolidaysItemId, string winterHolidayItemId)
        {
            return new List<DtoItem>()
            {
                new DtoItem("Home", ID.Parse(Guid.NewGuid()).ToString()),
                new DtoItem("Root", rootItemId),
                new DtoItem("awesome holidays", awesomeHolidaysItemId),
                new DtoItem("winter holidays", winterHolidayItemId)
            };
        }
    }
}
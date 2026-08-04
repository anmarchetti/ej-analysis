using System;
using System.Collections.Generic;
using Sitecore.Data;

namespace easyJet.Feature.PageContent.Tests.Pipelines.RequestBegin
{
    public class TransparentFolderResolverTestData
    {
        public static IEnumerable<object[]> ResolveDifferentPaths()
        {
            var rootItemId = ID.Parse(Guid.NewGuid()).ToString();
            var awesomeHolidaysItemId = ID.Parse(Guid.NewGuid()).ToString();
            var winterHolidayItemId = ID.Parse(Guid.NewGuid()).ToString();
            var winterSpecialHolidayItemId = ID.Parse(Guid.NewGuid()).ToString();

            yield return new object[]
            {
                "Nested with dash transparent item",
                "/awesome-holidays/winter-holidays",
                new List<DtoItem>()
                {
                    new DtoItem("Home", ID.Parse(Guid.NewGuid()).ToString()),
                    new DtoItem("Root", rootItemId, true),
                    new DtoItem("awesome holidays", awesomeHolidaysItemId),
                    new DtoItem("winter holidays", winterHolidayItemId)
                },
                winterHolidayItemId
            };

            yield return new object[]
            {
                "2 Nested transparent folder with dash",
                "/winter-holidays",
                new List<DtoItem>()
                {
                    new DtoItem("Home", ID.Parse(Guid.NewGuid()).ToString()),
                    new DtoItem("Root", rootItemId, true),
                    new DtoItem("awesome holidays", awesomeHolidaysItemId, true),
                    new DtoItem("winter holidays", winterHolidayItemId)
                },
                winterHolidayItemId
            };

            yield return new object[]
            {
                "2 Nested transparent folder with dash wrong url",
                "/winter-special-holidays",
                new List<DtoItem>()
                {
                    new DtoItem("Home", ID.Parse(Guid.NewGuid()).ToString()),
                    new DtoItem("Root", rootItemId, true),
                    new DtoItem("awesome holidays", awesomeHolidaysItemId, true),
                    new DtoItem("winter holidays", winterHolidayItemId),
                    new DtoItem("winter special-holidays", winterSpecialHolidayItemId)
                },
                null
            };

            yield return new object[]
            {
                "3 Nested transparent folder with dash",
                "/winter-special-holidays",
                new List<DtoItem>()
                {
                    new DtoItem("Home", ID.Parse(Guid.NewGuid()).ToString()),
                    new DtoItem("Root", rootItemId, true),
                    new DtoItem("awesome holidays", awesomeHolidaysItemId, true),
                    new DtoItem("winter holidays", winterHolidayItemId, true),
                    new DtoItem("winter special-holidays", winterSpecialHolidayItemId)
                },
                winterSpecialHolidayItemId
            };

            yield return new object[]
            {
                "Nested all items transparent with dash",
                "/winter-holidays",
                new List<DtoItem>()
                {
                    new DtoItem("Home", ID.Parse(Guid.NewGuid()).ToString()),
                    new DtoItem("Root", rootItemId, true),
                    new DtoItem("awesome holidays", awesomeHolidaysItemId, true),
                    new DtoItem("winter holidays", winterHolidayItemId, true)
                },
                winterHolidayItemId
            };
        }
    }
}
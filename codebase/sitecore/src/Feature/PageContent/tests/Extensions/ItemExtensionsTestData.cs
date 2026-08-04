using System.Collections.Generic;
using Sitecore.Data;
using Sitecore.FakeDb;

namespace easyJet.Feature.PageContent.Tests.Extensions
{
    public class ItemExtensionsTestData
    {
        public static IEnumerable<object[]> ItemsWithoutTransparency()
        {
            var withFieldID = ID.NewID;
            var withoutFieldID = ID.NewID;
            var db = new Db()
            {
                new DbItem("testItem", withFieldID)
                {
                    Fields = { { Constants.Fields.TransparentFolder.TransparentItem, "0" } },
                },
                new DbItem("testItem", withoutFieldID)
                {
                    // complete lack of relevant field as test case
                }
            };

            yield return new object[] { db.GetItem(withFieldID) };
            yield return new object[] { db.GetItem(withoutFieldID) };
        }
    }
}
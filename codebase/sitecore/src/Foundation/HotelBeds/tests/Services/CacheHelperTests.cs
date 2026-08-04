using System;
using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Services.Sync;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.HotelBeds.Tests.Services
{
    public class CacheHelperTests
    {
        [Fact]
        public void ClearCaches_Item_ShouldNotThrow_WhenItemIsNull()
        {
            Action act = () => CacheHelper.ClearCaches((Item)null);

            act.Should().NotThrow();
        }

        [Fact]
        public void ClearCaches_Item_ShouldNotThrow_WhenFakeDbItemHasCaches()
        {
            var root = new DbItem("root");
            using (var db = new Db { root })
            {
                var item = db.GetItem(root.ID);
                item.Should().NotBeNull();

                Action act = () => CacheHelper.ClearCaches(item);

                act.Should().NotThrow();
            }
        }

        [Fact]
        public void ClearCaches_ItemIds_ShouldNotThrow_WhenDatabaseIsNull()
        {
            Action act = () => CacheHelper.ClearCaches(null, new HashSet<ID> { ID.NewID });

            act.Should().NotThrow();
        }

        [Fact]
        public void ClearCaches_ItemIds_ShouldNotThrow_WhenIdsNullOrEmpty()
        {
            using (var db = new Db { new DbItem("x") })
            {
                Action actNull = () => CacheHelper.ClearCaches(db.Database, null);
                Action actEmpty = () => CacheHelper.ClearCaches(db.Database, new HashSet<ID>());

                actNull.Should().NotThrow();
                actEmpty.Should().NotThrow();
            }
        }

        [Fact]
        public void ClearCaches_ItemIds_ShouldNotThrow_WhenFakeDbProvidesCaches()
        {
            var a = new DbItem("a");
            var b = new DbItem("b");
            using (var db = new Db { a, b })
            {
                Action act = () => CacheHelper.ClearCaches(
                    db.Database,
                    new HashSet<ID> { a.ID, b.ID });

                act.Should().NotThrow();
            }
        }
    }
}

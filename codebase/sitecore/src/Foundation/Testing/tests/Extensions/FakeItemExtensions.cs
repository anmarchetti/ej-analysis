using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;

namespace easyJet.Foundation.Testing.Extensions
{
    public static class FakeItemExtensions
    {
        public static FakeItem WithPathsPath(this FakeItem instance, string itemPath)
        {
            var item = instance.ToSitecoreItem();
            item.Paths.Path.Returns<string>(itemPath);
            item.Database.GetItem(itemPath).Returns<Item>(item);
            return instance;
        }

        public static FakeItem WithPathsParentPath(this FakeItem instance, string itemPath)
        {
            var item = instance.ToSitecoreItem();
            item.Paths.ParentPath.Returns<string>(itemPath);
            item.Database.GetItem(itemPath).Returns<Item>(item);
            return instance;
        }
    }
}

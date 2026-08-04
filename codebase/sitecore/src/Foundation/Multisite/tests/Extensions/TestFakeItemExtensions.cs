using NSubstitute;
using Sitecore.NSubstituteUtils;

namespace easyJet.Foundation.Multisite.Tests.Extensions
{
    public static class TestFakeItemExtensions
    {
        public static FakeItem WithIsItemIsClone(this FakeItem item, bool isClone)
        {
            item.ToSitecoreItem().IsItemClone.Returns(isClone);

            return item;
        }
    }
}
using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IItemsContextProvider), Lifetime = Lifetime.Singleton)]
    public class ItemsContextProvider : IItemsContextProvider
    {
        public T GetItem<T>(string key)
            where T : class => Sitecore.Context.Items[key] as T;

        public object GetItem(string key) => Sitecore.Context.Items[key];

        public void SetItem(string key, object value) => Sitecore.Context.Items[key] = value;
    }
}
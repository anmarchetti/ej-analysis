namespace easyJet.Foundation.SitecoreExtensions.Services
{
    public interface IItemsContextProvider
    {
        T GetItem<T>(string key)
            where T : class;

        object GetItem(string key);

        void SetItem(string key, object value);
    }
}

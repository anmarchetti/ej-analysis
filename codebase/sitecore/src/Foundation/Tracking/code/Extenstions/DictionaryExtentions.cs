using System.Collections.Generic;

namespace easyJet.Foundation.Tracking.Extenstions
{
    public static class DictionaryExtentions
    {
        public static bool TryGetValueAs<TKey, TValue, TActual>(this IDictionary<TKey, TValue> data, TKey key, out TActual value)
            where TActual : class, new()
        {
            TValue tmp;
            if (data.TryGetValue(key, out tmp))
            {
                value = tmp as TActual;
                return value != null;
            }

            value = new TActual();
            return false;
        }
    }
}
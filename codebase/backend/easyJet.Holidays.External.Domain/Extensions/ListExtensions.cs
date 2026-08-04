namespace easyJet.Holidays.External.Domain.Extensions
{

    public static class ListExtensions
    {
        /// <summary>
        /// Return svalue by index or default value.
        /// Shouldn't be used with promitive types
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="list"></param>
        /// <param name="index"></param>
        /// <returns></returns>
        public static T TryGet<T>(this IList<T> list, int index)
        {
            if (index < 0 || list == null || list.Count <= index) return default(T);
            return list[index];
        }
    }
}
using System.Collections;

namespace easyJet.Holidays.Api.Domain.Extensions
{
    /// <summary>
    /// <see cref="IEnumerable"/> extensions.
    /// </summary>
    public static class CollectionExtensions
    {
        /// <summary>
        /// Splits an array into several smaller arrays.
        /// </summary>
        /// <typeparam name="T">The type of the array.</typeparam>
        /// <param name="array">The array to split.</param>
        /// <param name="size">The size of the smaller arrays.</param>
        /// <returns>An array containing smaller arrays.</returns>
        public static IEnumerable<IEnumerable<T>> Split<T>(this IEnumerable<T> array, int size)
        {
            if (size == 0)
            {
                throw new DivideByZeroException(
                    $"{nameof(size)} is 0 which would result in an infinite number of chunks."
                );
            }

            var chunks = Math.Ceiling((double)array.Count() / size);

            for (var i = 0; i < chunks; i++)
            {
                yield return array.Skip(i * size).Take(size);
            }
        }

        /// <summary>
        /// Check whether collection null or empty
        /// </summary>
        /// <param name="collection"></param>
        /// <typeparam name="T"></typeparam>
        /// <returns></returns>
        public static bool IsNullOrEmpty<T>(this IEnumerable<T> collection)
        {
            return collection == null || !collection.Any();
        }

        public static bool IsNullOrEmpty<T1, T2>(this IDictionary<T1, T2> dictionary)
        {
            return dictionary == null || dictionary.Count == 0;
        }

        /// <summary>
        /// Check whether collection is null or has no elements for the given predicate
        /// </summary>
        /// <param name="collection"></param>
        /// <param name="predicate"></param>
        /// <typeparam name="T"></typeparam>
        /// <returns></returns>
        public static bool IsNullOrNone<T>(this IEnumerable<T> collection, Func<T, bool> predicate)
        {
            return collection == null || !collection.Any(predicate);
        }

        /// <summary>
        /// Returns empty enumerable if collection is null
        /// </summary>
        /// <returns></returns>
        public static IEnumerable<T> EmptyIfNull<T>(this IEnumerable<T> original)
        {
            return original ?? Enumerable.Empty<T>();
        }

        public static string AllToString<T>(this IEnumerable<T> collection)
        {
            return "[" + string.Join(",", collection) + "]";
        }
    }
}

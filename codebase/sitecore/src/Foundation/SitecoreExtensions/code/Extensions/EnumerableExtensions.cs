using System;
using System.Collections.Generic;
using System.Linq;

namespace easyJet.Foundation.SitecoreExtensions.Extensions
{
    public static class EnumerableExtensions
    {
        public static IEnumerable<TSource[]> Chunk<TSource>(this IEnumerable<TSource> source, int size)
        {
            if (size <= 0)
            {
                throw new ArgumentException($"{nameof(size)} must be greater than 0.");
            }

            while (source.Any())
            {
                yield return source.Take(size).ToArray();
                source = source.Skip(size);
            }
        }

        public static IEnumerable<List<T>> SplitList<T>(this List<T> items, int nSize = 30)
        {
            for (int i = 0; i < items.Count; i += nSize)
            {
                yield return items.GetRange(i, Math.Min(nSize, items.Count - i));
            }
        }

        public static IEnumerable<TSource> DistinctBy<TSource>(this IEnumerable<TSource> source, Func<TSource, string> keySelector)
        {
            var seenKeys = new HashSet<string>();
            foreach (var element in source)
            {
                if (seenKeys.Add(keySelector(element)))
                {
                    yield return element;
                }
            }
        }
    }
}
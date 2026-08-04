using System.Linq;
using Sitecore.ContentSearch.Linq.Common;

namespace easyJet.Foundation.Testing.ContentSearch
{
    internal static class QueryableExtensionsStub
    {
        public static IQueryable<TSource> InContext<TSource>(
            this IQueryable<TSource> source,
            IExecutionContext context) => source;
    }
}

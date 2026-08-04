using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Sitecore;
using Sitecore.ContentSearch.Linq;
using Sitecore.Globalization;

namespace easyJet.Foundation.Destinations.Services
{
    public abstract class BatchSearchService
    {
        protected virtual IEnumerable<TResult> BatchProcess<TInput, TResult>(IEnumerable<TInput> chunks, Func<TInput, IEnumerable<TResult>> expression)
        {
            var options = new ParallelOptions() { MaxDegreeOfParallelism = Environment.ProcessorCount - 1 };

            var results = new ConcurrentBag<IEnumerable<TResult>>();
            var lang = Context.Language.Name;
            Parallel.ForEach(chunks, options, data =>
            {
                using (new LanguageSwitcher(lang))
                {
                    var result = expression(data);
                    results.Add(result);
                }
            });

            return results.SelectMany(x => x);
        }

        protected virtual IEnumerable<SearchHit<TSource>> GetPage<TSource>(IEnumerable<SearchHit<TSource>> hits, int take = 0, int page = 0)
        {
            if (take <= 0)
            {
                return hits;
            }

            page = page <= 0 ? 1 : page;
            return hits.Skip((page - 1) * take).Take(take);
        }
    }
}
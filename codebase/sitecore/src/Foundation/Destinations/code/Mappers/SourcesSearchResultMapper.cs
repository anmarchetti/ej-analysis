using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;

namespace easyJet.Foundation.Destinations.Mappers
{
    /// <summary>
    /// TODO: Temporary mapper should be removed after Post content simplification works (Refactoring Web Api).
    /// </summary>
    public static class SourcesSearchResultMapper
    {
        public static IEnumerable<TResult> MapSourcesSearchResultByAtcomCodes<TSearch, TResult>(string[] atcomCodes, IEnumerable<TSearch> searchResults, Func<string, TSearch, TResult> mapFunc)
            where TSearch : SourcesSearchResultItem
        {
            var searchResultBySource = new Dictionary<string, TSearch>();
            foreach (var searchResult in searchResults)
            {
                if (searchResult.SourceCodes == null || !searchResult.SourceCodes.Any())
                {
                    var baseSearchResultItem = searchResult as BaseDatasourceSearchResultItem;
                    if (baseSearchResultItem != null)
                    {
                        yield return mapFunc(baseSearchResultItem.Code, searchResult);
                    }

                    continue;
                }

                foreach (var source in searchResult.SourceCodes)
                {
                    searchResultBySource[source] = searchResult;
                }
            }

            foreach (var code in atcomCodes)
            {
                if (searchResultBySource.TryGetValue(code, out var searchResult))
                {
                    yield return mapFunc(code, searchResult);
                }
            }
        }

        public static IEnumerable<TResult> MapDataSourceSearchResultByAtcomCode<TSearch, TResult>(IEnumerable<TSearch> searchResults, Func<string, TSearch, TResult> mapFunc)
            where TSearch : BaseDatasourceSearchResultItem
        {
            if (searchResults == null)
            {
                yield break;
            }

            foreach (var document in searchResults)
            {
                if (document.SourceCodes == null || !document.SourceCodes.Any())
                {
                    yield return mapFunc(document.Code, document);
                    continue;
                }

                foreach (var sourceCode in document.SourceCodes)
                {
                    yield return mapFunc(sourceCode, document);
                }
            }
        }
    }
}
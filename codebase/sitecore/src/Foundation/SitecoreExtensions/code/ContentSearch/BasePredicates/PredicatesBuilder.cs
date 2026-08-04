using System;
using System.Linq;
using System.Linq.Expressions;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using Sitecore;
using Sitecore.ContentSearch.Linq.Utilities;
using Sitecore.Globalization;

namespace easyJet.Foundation.SitecoreExtensions.ContentSearch.BasePredicates
{
    public static class PredicatesBuilder
    {
        public static Expression<Func<T, bool>> IsLatestVersion<T>(this Expression<Func<T, bool>> exp)
            where T : BaseSearchResultItem
        {
            return exp.And(item => item.IsLatestVersion);
        }

        public static Expression<Func<T, bool>> IsFirstVersion<T>(this Expression<Func<T, bool>> exp)
            where T : BaseSearchResultItem
        {
            return exp.And(item => item.Version == "1");
        }

        public static Expression<Func<T, bool>> MatchContextLanguage<T>(this Expression<Func<T, bool>> exp)
            where T : BaseSearchResultItem
        {
            return exp.And(item => item.Language.Equals(Context.Language.Name));
        }

        public static Expression<Func<T, bool>> WithLanguage<T>(this Expression<Func<T, bool>> exp, Language language)
            where T : BaseSearchResultItem
        {
            return exp.And(item => item.Language.Equals(language.Name));
        }

        public static Expression<Func<T, bool>> MatchContextSite<T>(this Expression<Func<T, bool>> exp)
            where T : BaseSearchResultItem
        {
            return MatchRootPath(exp, Context.Site?.RootPath);
        }

        public static Expression<Func<T, bool>> MatchRootPath<T>(this Expression<Func<T, bool>> exp, string rootPath)
        where T : BaseSearchResultItem
        {
            return !string.IsNullOrEmpty(rootPath) ? exp.And(item => item.Path.StartsWith(rootPath)) : exp;
        }
    }
}
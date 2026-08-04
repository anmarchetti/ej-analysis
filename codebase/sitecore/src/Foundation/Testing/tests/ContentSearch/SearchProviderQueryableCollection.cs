using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Sitecore.ContentSearch.Linq.Common;
using Sitecore.ContentSearch.Linq.Linq.Parsing;
using Sitecore.ContentSearch.Linq.Parsing;

namespace easyJet.Foundation.Testing.ContentSearch
{
    [ExcludeFromCodeCoverage]
    public class SearchProviderQueryableCollection<TElement> : IndexQueryable<TElement, IQueryable<TElement>>, IOrderedQueryable<TElement>, IQueryProvider
    {
        private readonly EnumerableQuery<TElement> innerQueryable;

        public SearchProviderQueryableCollection(IEnumerable<TElement> enumerable)
            : base(Substitute.For<BaseQueryExecutor>(), Substitute.For<BaseQueryTranslator<IQueryable<TElement>>>())
        {
            innerQueryable = new EnumerableQuery<TElement>(enumerable);
        }

        public SearchProviderQueryableCollection(Expression expression)
            : base(Substitute.For<BaseQueryExecutor>(), null)
        {
            innerQueryable = new EnumerableQuery<TElement>(expression);
        }

        public List<object> DefaultValues { get; set; } = new List<object>();

        public new Type ElementType => ((IQueryable)innerQueryable).ElementType;

        public new Expression Expression => ((IQueryable)innerQueryable).Expression;

        public new IQueryProvider Provider => this;

        public new IEnumerator<TElement> GetEnumerator()
        {
            return ((IEnumerable<TElement>)innerQueryable).GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public IQueryable CreateQuery(Expression expression)
        {
            return new SearchProviderQueryableCollection<TElement>((IEnumerable<TElement>)((IQueryProvider)innerQueryable).CreateQuery(expression));
        }

        public new IQueryable<TElement1> CreateQuery<TElement1>(Expression expression)
        {
            CallsReplacers.ForEach(x => expression = x.Visit(expression));
            var query = (EnumerableQuery<TElement1>)((IQueryProvider)innerQueryable.AsQueryable()).CreateQuery<TElement1>(expression);
            var items = query.ToArray();
            for (int i = 0; i < items.Length; i++)
            {
                if (DefaultValues.Any())
                {
                    var item = items[i];
                    var defaultValue = DefaultValues.FirstOrDefault(x => x.GetType().Equals(item.GetType()));
                    if (defaultValue != null)
                    {
                        foreach (var property in defaultValue.GetType().GetProperties())
                        {
                            try
                            {
                                var defaultPropertyValue = property.GetValue(defaultValue);
                                if (defaultPropertyValue != null)
                                {
                                    var itemProperty = item.GetType().GetProperty(property.Name);
                                    itemProperty.SetValue(item, defaultPropertyValue);
                                }
                            }
                            catch
                            {
                            }
                        }
                    }
                }
            }

            return new SearchProviderQueryableCollection<TElement1>(items.AsQueryable())
            {
                DefaultValues = DefaultValues,
                CallsReplacers = CallsReplacers
            };
        }

        public new object Execute(Expression expression)
        {
            return base.Execute(expression);
        }

        public new TResult Execute<TResult>(Expression expression)
        {
            var items = this.ToList();
            object results = new SearchResults<TElement>(items.Select(s => new SearchHit<TElement>(0, s)), items.Count);
            return (TResult)results;
        }

        private List<MethodCallsReplacer> CallsReplacers { get; set; } = new List<MethodCallsReplacer>()
        {
            new MethodCallsReplacer(
                new Method(typeof(QueryableExtensions), nameof(QueryableExtensions.Filter)),
                new Method(typeof(Queryable), nameof(Queryable.Where))),
            new MethodCallsReplacer(
                new Method(typeof(QueryableExtensions), nameof(QueryableExtensions.InContext)),
                new Method(typeof(QueryableExtensionsStub), nameof(QueryableExtensionsStub.InContext)))
        };
    }
}

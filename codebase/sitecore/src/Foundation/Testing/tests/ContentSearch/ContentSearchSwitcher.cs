using System;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Testing.ContentSearch
{
    public class ContentSearchSwitcher : IDisposable
    {
        private readonly ISearchIndex index;

        public ContentSearchSwitcher(ISearchIndex index)
        {
            this.index = index;
            ContentSearchManager.SearchConfiguration.AddIndex(index);
        }

        public void Dispose()
        {
            ContentSearchManager.SearchConfiguration.Indexes.Remove(index.Name);
        }
    }
}

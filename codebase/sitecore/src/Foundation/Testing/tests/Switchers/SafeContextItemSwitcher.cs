using System;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Testing.Switchers
{
    public sealed class SafeContextItemSwitcher : IDisposable
    {
        private readonly Item previous;

        public SafeContextItemSwitcher(Item newItem)
        {
            // stash the old
            previous = Sitecore.Context.Item;
            // directly overwrite—even if newItem is null
            Sitecore.Context.Item = newItem;
        }

        public void Dispose()
        {
            // restore whatever was there before
            Sitecore.Context.Item = previous;
        }
    }
}
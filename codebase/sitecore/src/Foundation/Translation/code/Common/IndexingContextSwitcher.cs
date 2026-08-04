using Sitecore.Common;

namespace easyJet.Foundation.Translation.Common
{
    public class IndexingContextSwitcher : Switcher<bool, IndexingContextSwitcher>
    {
        public IndexingContextSwitcher()
            : base(true)
        {
        }
    }
}

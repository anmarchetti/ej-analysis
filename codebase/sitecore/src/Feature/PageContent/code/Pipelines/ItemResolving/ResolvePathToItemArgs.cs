using System.Linq;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.Pipelines;

namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public class ResolvePathToItemArgs : PipelineArgs
    {
        public ResolvePathToItemArgs(Item root, string[] pathParts, ResolveItemArgs resolveItemArgs, ResolveItemSettings settings, int index = 0)
        {
            ResolveItemArgs = resolveItemArgs;
            RootItem = root;
            PathParts = pathParts;
            PathIndex = index;
            Result = ResolveItemResult.NoItemFound;
            Settings = settings;
        }

        public ResolveItemArgs ResolveItemArgs { get; set; }

        public ResolveItemResult Result { get; set; }

        public Item RootItem { get; private set; }

        public string[] PathParts { get; private set; }

        public int PathIndex { get; private set; }

        public string CurrentPathPart => PathParts[PathIndex];

        public string RemainingPath => string.Join("/", PathParts.Skip(PathIndex));

        public ResolveItemSettings Settings { get; set; }

        private Language language;

        public Language Language
        {
            get => language ?? Context.Language;
            set => language = value;
        }

        public override string ToString()
        {
            return RootItem?.Uri + " " + RootItem?.Name + " " + RemainingPath;
        }
    }
}
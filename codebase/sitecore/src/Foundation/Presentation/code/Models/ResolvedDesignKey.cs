using Sitecore.Data;

namespace easyJet.Foundation.Presentation.Models
{
    /// <summary>The result of grouping: which design id won for which provider (<see cref="ID.Null"/> = standard).</summary>
    internal sealed class ResolvedDesignKey
    {
        public ResolvedDesignKey(ID designId, ID providerId)
        {
            DesignId = designId;
            ProviderId = providerId ?? ID.Null;
        }

        public ID DesignId { get; }

        public ID ProviderId { get; }
    }
}

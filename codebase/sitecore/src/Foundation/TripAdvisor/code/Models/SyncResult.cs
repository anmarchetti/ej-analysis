using easyJet.Foundation.TripAdvisor.Models.Domain;
using Sitecore.Data.Items;

namespace easyJet.Foundation.TripAdvisor.Models
{
    public class SyncResult
    {
        public TripAdvisorError Error { get; }

        public Item Item { get; }

        public SyncResult(TripAdvisorError error, Item item)
        {
            Error = error;
            Item = item;
        }
    }
}

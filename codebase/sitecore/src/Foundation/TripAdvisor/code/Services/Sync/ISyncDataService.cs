using System.Collections.Generic;
using easyJet.Foundation.TripAdvisor.Models;
using Sitecore.Data.Items;

namespace easyJet.Foundation.TripAdvisor.Services.Sync
{
    public interface ISyncDataService
    {
        IEnumerable<SyncResult> SyncRatings(IEnumerable<Item> hotelItems);
    }
}

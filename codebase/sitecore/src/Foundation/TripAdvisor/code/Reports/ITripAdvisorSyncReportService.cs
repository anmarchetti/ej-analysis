using System.Collections.Generic;
using easyJet.Foundation.TripAdvisor.Models;

namespace easyJet.Foundation.TripAdvisor.Reports
{
    public interface ITripAdvisorSyncReportService
    {
        void CreateReport(IEnumerable<SyncResult> failedResults);
    }
}

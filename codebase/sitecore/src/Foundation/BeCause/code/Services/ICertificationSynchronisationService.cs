using System.Collections.Generic;
using easyJet.Foundation.BeCause.Models;

namespace easyJet.Foundation.BeCause.Services
{
    public interface ICertificationSynchronisationService
    {
        IEnumerable<CertificationSynchronisationResult> Synchronize(string startPath);

        string GetFinalStatusMessage(List<CertificationSynchronisationResult> processedItems);
    }
}
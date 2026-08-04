using System.Collections.Generic;
using System.Threading.Tasks;
using easyJet.Feature.Tracker.Models.Dflo;

namespace easyJet.Feature.Tracker.Services
{
    public interface IDfloService
    {
        Task<Dictionary<string, IEnumerable<Document>>> GetEmailsByEmailAsync(IEnumerable<string> emails);

        Task<(string emailId, string emailBody)> GetEmailBodyByIdAsync(string emailId);
    }
}

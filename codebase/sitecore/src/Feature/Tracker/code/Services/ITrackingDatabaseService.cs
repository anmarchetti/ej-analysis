using System.Threading.Tasks;
using easyJet.Feature.Tracker.Models.Personalize;

namespace easyJet.Feature.Tracker.Services
{
    public interface ITrackingDatabaseService
    {
        Task Save(PersonalizationOrderCheckout data);
    }
}

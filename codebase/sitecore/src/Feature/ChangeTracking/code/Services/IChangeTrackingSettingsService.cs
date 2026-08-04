using easyJet.Feature.ChangeTracking.Models;

namespace easyJet.Feature.ChangeTracking.Services
{
    public interface IChangeTrackingSettingsService
    {
        ChangeTrackingSettings GetSettings();
    }
}
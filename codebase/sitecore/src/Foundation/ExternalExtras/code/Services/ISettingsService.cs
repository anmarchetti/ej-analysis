using easyJet.Foundation.ExternalExtras.Models;

namespace easyJet.Foundation.ExternalExtras.Services
{
    public interface ISettingsService
    {
        ExternalExtrasSettings GetSettings();
    }
}
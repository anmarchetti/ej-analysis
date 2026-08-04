using System.Threading.Tasks;
using easyJet.Feature.Tracker.Models.Personalize;

namespace easyJet.Feature.Tracker.Services.Personalize
{
    public interface IPersonalizeService
    {
        /// <summary>
        /// Gets personalized experience based on the configured rules on item and user SP profile.
        /// </summary>
        /// <param name="experienceName">Experience name.</param>
        /// <param name="cacheTime">Cache time.</param>
        /// <returns>Personalized experience result for user.</returns>
        Task<PersonalizeResult> GetPersonalizedExperience(string experienceName, int cacheTime);
    }
}

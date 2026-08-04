using easyJet.Feature.Tracker.Models.Requests;

namespace easyJet.Feature.Tracker.Services
{
    public interface ICustomerProfileService
    {
        /// <summary>
        /// Track customer log in.
        /// </summary>
        /// <param name="request">Track Customer Log In Request.</param>
        void TrackLogIn(TrackCustomerLogInRequest request);
    }
}

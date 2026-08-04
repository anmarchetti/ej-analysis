using System;
using System.Threading.Tasks;
using easyJet.Foundation.Tracking.Models.Requests;

namespace easyJet.Foundation.Tracking.Services
{
    public interface IUserSearchInteractionService
    {
        /// <summary>
        /// Add user search interaction to conact.
        /// </summary>
        /// <param name="request">User search data.</param>
        void Add(UserSearchRequest request);

        /// <summary>
        /// Clear all user search interactions by end date time.
        /// </summary>
        /// <param name="dateTime">Date time.</param>
        /// <returns>Task.</returns>
        Task ClearInteractionsAsync(DateTime dateTime);
    }
}
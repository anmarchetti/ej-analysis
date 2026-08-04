#nullable enable
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.Api.Domain.Data.ShortList;

namespace easyJet.Holidays.Api.Domain.Interfaces.ShortList
{
    public interface IShortListService
    {
        /// <summary>
        /// Get user prefered offers
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="listType">Short Luist type</param>
        /// <returns></returns>
        Task<IEnumerable<ShortListOfferRequest>> GetUserShortList(string userId, string? listType = null);

        /// <summary>
        /// Create or update exiction short list record 
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="request">Request to add</param>
        /// <param name="listType">Short list type</param>
        /// <returns></returns>
        Task<ShortListStatus> CreateOrUpdateUserShortList(string userId, ShortListOfferRequest request, string? listType = null);

        /// <summary>
        /// Remove specific offer from list
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="ids">Short list ID</param>
        /// <param name="listType">Short list type</param>
        /// <returns></returns>
        Task<ShortListStatus> RemoveOfferFormList(string userId, List<string> ids, string? listType = null);
    }
}

using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.ShortList;
using easyJet.Holidays.Api.Domain.Data.ShortList;

namespace easyJet.Holidays.Api.Domain.Interfaces.ShortList
{
    public interface IShortListServiceRepository
    {
        /// <summary>
        /// Get User saved offers
        /// </summary>
        /// <param name="page">Page to show</param>
        /// <param name="take">Number of results to show</param>
        /// <returns></returns>
        Task<ShortListOffersResponse> Get(int page = 1, int take = 10);

        /// <summary>
        /// Get summary of all shortlisted offers
        /// </summary>
        /// /// <param name="shortListType">Optional filter by ShortList type</param>
        /// /// <param name="omitUnavailable">Should omit unavailable offers</param>
        /// <returns></returns>
        Task<ShortListOffersResponse> Summary(ShortListType? shortListType, bool omitUnavailable);

        /// <summary>
        /// Create or update user rocode
        /// </summary>
        /// <param name="request">Request to add</param>
        /// <returns></returns>
        Task<ShortListStatus> CreateOrUpdate(ShortListOfferRequest request);

        /// <summary>
        /// Delete multiple user recodes
        /// </summary>
        /// <param name="ids">items to delete</param>
        /// <returns></returns>
        Task<ShortListStatus> Delete(List<string> ids);

        /// <summary>
        /// Update shortListID property for the offer object
        /// </summary>
        /// <param name="offers"></param>
        /// <returns></returns>
        Task UpdateOffersRefToUserShortList(ICollection<Offer> offers);

        /// <summary>
        /// Get user short list status
        /// </summary>
        /// <returns></returns>
        Task<ShortListStatus> Status();

        /// <summary>
        /// Get hotel short list status
        /// </summary>
        /// <returns></returns>
        Task<ShortListStatus> HotelStatus(string giataCode);

    }
}

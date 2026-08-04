using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Transfers;

namespace easyJet.Holidays.Api.Domain.Services.Transfers
{
    /// <summary>
    /// Teansfers service
    /// </summary>
    public interface ITransferService
    {
        /// <summary>
        /// Checks whether request transfers has enough details to validate package and enrich them 
        /// </summary>
        /// <param name="offer">Offer</param>
        /// <param name="silenceTransferError">Show throw Unavailalbe transfers error or not</param>
        /// <returns>Collection of updated transfers</returns>
        Task<IEnumerable<TransferItem>> BuildTransfers(Offer offer, bool silenceTransferError = false);

        /// <summary>
        /// Get alternative transfer options.
        /// If original offer has transfer returns also option to not include transfer: No Shared or No Private
        /// </summary>
        /// <param name="offer"></param>
        /// <param name="transferItems"></param>
        /// <returns></returns>
        Task<IEnumerable<TransferItem>> GetAll(Offer offer, IEnumerable<TransferItem> transferItems = null);

        /// <summary>
        /// Get alternative transfer by specific hotel type.
        /// </summary>
        /// <param name="offer"></param>
        /// <param name="hotelPromoCodeType"></param>
        /// <returns></returns>
        Task<IEnumerable<TransferItem>> GetAll(Offer offer, string hotelPromoCodeType);

        /// <summary>
        /// Get transfer content
        /// </summary>
        /// <param name="transferCode">Transfer code</param>
        /// <param name="depDate">Departure date</param>
        /// <param name="airportCode">Airport code</param>
        /// <param name="accommCode">Accommodation code</param>
        /// <returns></returns>
        Task<string> GetContent(string transferCode, DateTimeOffset depDate, string airportCode, string accommCode);

        /// <summary>
        /// Get transfer instructions by product id
        /// </summary>
        /// <param name="productId">Product id</param>
        /// <param name="languageCode"></param>
        /// <returns>Transfer instructions</returns>
        Task<TransferInfo> GetTransferInfoByProductId(string productId, string languageCode);

        /// <summary>
        /// Get transfer info from sitcore and add it to transfer
        /// </summary>
        /// <param name="transfers">List of transfers</param>
        /// <param name="languageCode"></param>
        /// <returns>Transfer instructions</returns>
        Task EnrichWithTransferInfo(IList<TransferItem> transfers, string languageCode);

        /// <summary>
        /// Enrich transfers with CMS content.
        /// </summary>
        /// <param name="offers">List of offers.</param>
        Task EnrichTransferWithCmsInfo(IList<Offer> offers);

        /// <summary>
        /// Enrich transfer with CMS content.
        /// </summary>
        /// <param name="accomCode">Accom code.</param>
        /// <param name="transport">Transport information</param>
        /// <param name="transfers">List of transfers</param>
        /// <returns></returns>
        Task EnrichTransferWithCmsInfo(string accomCode, Transport transport, IList<TransferItem> transfers);

        /// <summary>
        /// Get all transfers from CMS (test method).
        /// </summary>
        /// <param name="languageCode">Language code</param>
        /// <returns>List of all hotel transfers</returns>
        Task<List<Data.Hotels.HotelTransfer>> GetAllTransfers(string languageCode);
    }
}

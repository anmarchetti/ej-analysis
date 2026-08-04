using easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;
using easyJet.Holidays.External.DataHub.SoapReference;

namespace easyJet.Holidays.External.DataHub.Interfaces
{
    /// <summary>
    /// Datahub Service for maintaining datahub "atcom" requests and responses
    /// </summary>
    public interface IDataHubService
    {
        /// <summary>
        /// Builds seats synchronization request, sends it and builds a response
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        Task<DatahubSyncResponse> SynchronizeSeats(DatahubSyncRequest request);

        /// <summary>
        /// Builds flights synchronization request, sends it and builds a response
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        Task<DatahubSyncResponse> SynchronizeFlights(DatahubSyncRequest request);

        /// <summary>
        /// Builds bags sync request, sends it and builds response
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        Task<DatahubSyncResponse> SynchronizeBags(DatahubSyncRequest? request);

        /// <summary>
        /// Gets the full reservation data from the Data Hub
        /// </summary>
        /// <param name="request">The request containing reservation ID and version</param>
        /// <returns>Raw ReservationDataResponse from the service</returns>
        Task<ReservationDataResponse> GetReservationData(DatahubFetchRequest request);
    }
}

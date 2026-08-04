namespace easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub
{
    /// <summary>
    /// Datahub Synchronize Pnr request wrapper
    /// </summary>
    public class DatahubSyncRequest
    {
        /// <summary>
        /// List of booking ref/flight pnr to synchronize
        /// </summary>
        public IEnumerable<ReservationRequest> Reservations { get; set; }

        /// <summary>
        /// Priority 1-999 for the whole request
        /// </summary>
        public string Priority { get; set; }
    }

    /// <summary>
    /// class for pnr representation
    /// </summary>
    public class ReservationRequest
    {
        /// <summary>
        /// booking reference or flight pnr to synchronize
        /// </summary>
        public string ReservationId { get; set; }

        /// <summary>
        /// Priority 1-999 for the reservation
        /// </summary>
        public string Priority { get; set; } = null!;
    }
}
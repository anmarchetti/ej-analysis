namespace easyJet.Holidays.Api.Domain.Data.BulkToolBooking
{
    /// <summary>
    /// Cancellation And Refund result model.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <typeparam name="R"></typeparam>
    public class Result<T, R>
    {
        /// <summary>
        /// Result object.
        /// </summary>
        public T Object { get; set; }

        /// <summary>
        /// Response Result.
        /// </summary>
        public R Response { get; set; }
    }
}

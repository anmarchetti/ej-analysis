namespace easyJet.Foundation.HotelBeds.Models.Requests
{
    /// <summary>
    /// Represents RoomTypesRequest model.
    /// </summary>
    public class RoomTypesRequest : BaseRequest
    {
        public int Step { get; set; }

        /// <summary>
        /// Builds request string.
        /// </summary>
        /// <returns>Request string.</returns>
        public override string GetRequestString()
        {
            return $"/types/rooms{GetQueryString()}";
        }

        /// <summary>
        /// Builds query string.
        /// </summary>
        /// <returns>query string.</returns>
        protected override string GetQueryString()
        {
            // HotelBeds limit responce up to 1000 items
            // therefore we need to split requests
            // abd build query string for each 1000 items by step
            if (int.TryParse(BatchStep, out int batchStep))
            {
                var from = Step * batchStep;
                var to = (Step * batchStep) + batchStep - 1;
                return $"?fields=all&language={DefaultLanguage}&from={from}&to={to}&useSecondaryLanguage={UseSecondaryLanguage}{LastUpdateDateQueryParam}";
            }

            return base.GetQueryString();
        }
    }
}
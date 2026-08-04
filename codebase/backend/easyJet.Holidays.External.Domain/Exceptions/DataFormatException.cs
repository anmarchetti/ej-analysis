namespace easyJet.Holidays.External.Domain.Exceptions
{
    public class DataFormatException : ExternalApiException
    {
        public DataFormatException(string message)
            : base(message, null)
        {
        }
    }
}

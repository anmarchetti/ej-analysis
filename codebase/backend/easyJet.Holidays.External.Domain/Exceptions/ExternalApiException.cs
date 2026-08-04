namespace easyJet.Holidays.External.Domain.Exceptions
{
    public abstract class ExternalApiException : Exception
    {
        public ExternalApiException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}

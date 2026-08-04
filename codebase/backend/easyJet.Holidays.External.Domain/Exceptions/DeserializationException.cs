namespace easyJet.Holidays.External.Domain.Exceptions
{
    public class DeserializationException : ExternalApiException
    {
        public Type ResponseType { get; private set; }

        public string ResponseData { get; private set; }

        public DeserializationException(Type responseType, string responseData, Exception innerException)
            : base(GetMessage(responseType), innerException)
        {
            ResponseType = responseType;

            ResponseData = responseData;
        }


        private static string GetMessage(Type responseType)
        {
            return String.Format("Error deserializing {0}", responseType.Name);
        }
    }
}

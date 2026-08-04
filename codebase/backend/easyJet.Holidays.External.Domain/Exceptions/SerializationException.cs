using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Domain.Exceptions
{
    public class SerializationException : ExternalApiException
    {
        public Type RequestType { get; private set; }

        public ApiRequest RequestData { get; private set; }

        public SerializationException(Type requestType, ApiRequest requestData, Exception innerException)
            : base(GetMessage(requestType), innerException)
        {
            RequestType = requestType;

            RequestData = requestData;
        }

        private static string GetMessage(Type requestType)
        {
            return String.Format("Error serializing {0}", requestType.Name);
        }
    }
}

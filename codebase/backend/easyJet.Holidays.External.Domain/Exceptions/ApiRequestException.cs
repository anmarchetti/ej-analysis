namespace easyJet.Holidays.External.Domain.Exceptions
{
    public class ApiRequestException : ExternalApiException
    {
        public Type RequestType { get; private set; }

        public Type ResponseType { get; private set; }

        public string RequestData { get; private set; }
        public string ResponseData { get; private set; }

        public ApiRequestException(Type requestType, Type responseType, string requestData, string responseData, Exception innerException)
            : base(GetMessage(requestType, responseType), innerException)
        {
            RequestType = requestType;
            ResponseType = responseType;
            RequestData = requestData;
            ResponseData = responseData;
        }

        public ApiRequestException(Type requestType, Type responseType, string requestData, Exception innerException)
            : this(requestType, responseType, requestData, null, innerException) { }

        private static string GetMessage(Type requestType, Type responseType)
        {
            return string.Format("Error making api call {0} -> {1}", requestType.Name, responseType.Name);
        }
    }
}

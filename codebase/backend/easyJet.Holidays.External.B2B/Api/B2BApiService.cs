using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using Microsoft.Extensions.Options;
using System.Xml;

namespace easyJet.Holidays.External.B2B.Api
{
    public class B2BApiService : ApiService
    {
        private readonly B2BSettings _b2bSettings;

        public B2BApiService(B2BApiClient apiClient, IOptions<B2BSettings> b2bSettings) : base(apiClient)
        {
            _b2bSettings = b2bSettings.Value ?? throw new ArgumentNullException(nameof(b2bSettings));
        }

        /// <inheritdoc />
        public override string Name() => "B2B API service.";

        /// <inheritdoc />
        public override int DefaultTimeoutMilliSeconds()
        {
            return _b2bSettings.Api.TimeoutMilliSeconds;
        }

        /// <summary>
        /// Wraps request in SOAP tags
        /// </summary>
        /// <typeparam name="TRequest"></typeparam>
        /// <param name="request"></param>
        /// <returns></returns>
        public override string GetRequestBodyString<TRequest>(TRequest request)
        {
            var body = base.GetRequestBodyString(request);
            return $@"<soapenv:Envelope xmlns:soapenv=""http://schemas.xmlsoap.org/soap/envelope/"" xmlns:b2b=""http://b2b.easyjet.com/"">
                      <soapenv:Header/>
                      <soapenv:Body>
                        <b2b:RequestXml>
                          <b2b:oInputXml>{body}</b2b:oInputXml>
                        </b2b:RequestXml>
                      </soapenv:Body>
                    </soapenv:Envelope>";
        }

        /// <summary>
        /// Deserializes B2B response.
        /// 
        /// All responses are wrapped in bunch of XMl tags. But usefull part is first child node of DataListRoot tag.
        /// </summary>
        /// <typeparam name="TResponse">Response type</typeparam>
        /// <param name="responseString">String to deserialize</param>
        /// <returns>Deserialized instance</returns>
        public override TResponse DeserializeResponse<TResponse>(string responseString)
        {
            try
            {
                var doc = new XmlDocument();
                doc.LoadXml(responseString);
                var dataRoot = doc.GetElementsByTagName("RequestXmlResult");
                var innerXml = dataRoot[0].InnerXml;

                return base.DeserializeResponse<TResponse>(innerXml);
            }
            catch (Exception ex)
            {
                throw new DeserializationException(typeof(TResponse), responseString, ex);
            }
        }
    }
}
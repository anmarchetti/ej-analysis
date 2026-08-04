using easyJet.Holidays.External.Domain.Models.Api.Payload;
using System.Xml;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.Domain.Models.Api
{
    public class XmlApiRequest<T> : ApiRequest
    {
        public XmlApiPayload<T> Payload { get; set; }

        public override string PayloadString => Payload?.SerializedBody;

        public XmlApiRequest()
        {
            Payload = new XmlApiPayload<T>(GetNamespaces, GetSettings);
        }

        protected virtual XmlSerializerNamespaces GetNamespaces()
        {
            return null; // no namespaces by default
        }

        protected virtual XmlWriterSettings GetSettings()
        {
            return null; // no settings by default
        }
    }
}

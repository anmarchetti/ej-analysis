
using easyJet.Holidays.External.Domain.Services;
using System.Xml;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.Domain.Models.Api.Payload
{
    public class XmlApiPayload<T> : ApiPayload<T>
    {
        private Func<XmlSerializerNamespaces> getNamespaces;
        private Func<XmlWriterSettings> getSettings;

        public XmlApiPayload()
        {
        }

        public XmlApiPayload(Func<XmlSerializerNamespaces> getNamespaces, Func<XmlWriterSettings> getSettings)
        {
            this.getNamespaces = getNamespaces;
            this.getSettings = getSettings;
        }

        protected override T DoDeserialize(string value)
        {
            return XmlParseService.DeserializeXml<T>(value);
        }

        protected override string DoSerialize(T value)
        {
            if (value == null) return null;

            return XmlParseService.SerializeXml(
                value,
                getNamespaces != null ? getNamespaces() : null,
                getSettings != null ? getSettings() : null
            );
        }
    }
}

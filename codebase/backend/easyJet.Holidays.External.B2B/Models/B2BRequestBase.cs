using easyJet.Holidays.External.Domain.Models.Api;
using System.Xml;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models
{
    public class B2BRequestBase<T> : XmlApiRequest<T> where T : B2BApiRequestBase
    {
        public override HttpMethod Method => HttpMethod.Post;

        protected override XmlSerializerNamespaces GetNamespaces()
        {
            var ns = new XmlSerializerNamespaces();
            ns.Add("", "");
            return ns;
        }

        protected override XmlWriterSettings GetSettings()
        {
            return new XmlWriterSettings
            {
                OmitXmlDeclaration = true,
            };
        }
    }
}

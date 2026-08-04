using easyJet.Holidays.External.Domain.Models.Api;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.Atcom.Models.InfoBooking
{
    public abstract class AtcomApiRequest<T> : XmlApiRequest<T>
    {
        protected abstract string RequestNamespace { get; }

        protected override XmlSerializerNamespaces GetNamespaces()
        {
            XmlSerializerNamespaces namespaces = new XmlSerializerNamespaces();
            namespaces.Add("p1", "AtComRes/Common");
            namespaces.Add("p2", RequestNamespace);
            return namespaces;
        }
    }
}

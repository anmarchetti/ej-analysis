using Newtonsoft.Json;
using System.Xml;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.Domain.Services
{
    public class XmlParseService
    {
        /// <summary>
        /// Serialize xml object to string;
        /// </summary>
        /// <typeparam name="T">Object type</typeparam>
        /// <param name="obj">Object to serialize</param>
        /// <param name="namespaces"></param>
        /// <param name="settings"></param>
        /// <returns>string content</returns>
        public static string SerializeXml<T>(T obj, XmlSerializerNamespaces namespaces, XmlWriterSettings settings)
        {
            XmlSerializer xmlResponse = new XmlSerializer(typeof(T));
            string xml = null;
            using (var sww = new StringWriter())
            {
                using (XmlWriter writer = XmlWriter.Create(sww, settings ?? new XmlWriterSettings()))
                {
                    xmlResponse.Serialize(writer, obj, namespaces ?? new XmlSerializerNamespaces());
                    xml = sww.ToString(); // Your XML
                }
            }

            return xml;
        }

        /// <summary>
        /// Deserialize xml to object
        /// </summary>
        /// <typeparam name="T">return object type</typeparam>
        /// <param name="stringToSerialize">string to deserialize</param>
        /// <returns>object type T</returns>
        public static T DeserializeXml<T>(string stringToSerialize)
        {
            XmlSerializer xmlResponse = new XmlSerializer(typeof(T));
            T result = default;
            using (TextReader reader = new StringReader(stringToSerialize))
            {
                result = (T)xmlResponse.Deserialize(reader);
            }
            return result;
        }

        /// <summary>
        /// Convert Xml string to JSOn string
        /// </summary>
        /// <param name="xml">Xml string</param>
        /// <returns>JSON string</returns>
        public static string XmlToJson(string xml)
        {
            XmlDocument doc = new XmlDocument();
            doc.LoadXml(xml);
            if (doc.FirstChild.Name == "xml")
            {
                // <?xml version="1.0" encoding="ISO-8859-1"?>
                doc.RemoveChild(doc.FirstChild);
            }

            return JsonConvert.SerializeXmlNode(doc);
        }
    }
}

using System.Collections.Generic;
using System.Xml.Linq;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Presentation.Services
{
    public interface ILayoutXmlService
    {
        /// <summary>
        /// Get renderings from Context Item and all renderings from Page Design Item.
        /// </summary>
        /// <param name="contextItem">Context Item.</param>
        /// <param name="designItem">Page Design Item.</param>
        /// <returns>Collections of rendering in XML format.</returns>
        IList<XElement> GetRenderings(Item contextItem, Item designItem);

        /// <summary>
        /// Merge partial designs with Context Item and passed renderings.
        /// </summary>
        /// <param name="layoutXml">Item's layoutXml.</param>
        /// <param name="designRenderings">Collection of renderings in XML format.</param>
        void MergePartialDesignsRenderings(XElement layoutXml, IEnumerable<XElement> designRenderings);

        /// <summary>
        /// Arrange renderings in order of a design page renderings.
        /// </summary>
        /// <param name="layoutXml">Item's layoutXml.</param>
        /// <param name="designItem">Page design item.</param>
        void ArrangeRenderings(XElement layoutXml, Item designItem);

        /// <summary>
        /// Merge multivariant partial designs with Context Item.
        /// </summary>
        /// <param name="layoutXml">Item's layoutXml.</param>
        /// <param name="designPartials">Multivariant partial design renderings.</param>
        void MergeMultivaritantRenderings(XElement layoutXml, IEnumerable<XElement> designPartials);
    }
}

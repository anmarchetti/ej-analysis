using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Xml.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Presentation.Models;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Mvc.Extensions;

[assembly: InternalsVisibleTo("easyJet.Foundation.Presentation.Tests")]

namespace easyJet.Foundation.Presentation.Services
{
    [Service(typeof(ILayoutXmlService), Lifetime = Lifetime.Singleton)]
    public class LayoutXmlService : ILayoutXmlService
    {
        private const string DeviceAndLayoutPattern = "{0}#{1}";

        /// <inheritdoc/>
        public IList<XElement> GetRenderings(Item contextItem, Item designItem)
        {
            List<XElement> xelementList = new List<XElement>();
            if (designItem != null)
            {
                xelementList.AddRange(GetRenderings(designItem));
            }

            if (contextItem.HasBaseTemplate(new TemplateID(Templates.PartialDesign.Id)))
            {
                xelementList.AddRange(GetBasePartialDesignRenderings(contextItem));
            }

            foreach (XElement xcontainer in xelementList)
            {
                foreach (XElement xelement in xcontainer.Descendants().Where(x => x.Name == "r"))
                {
                    if (xelement.HasAttributes && xelement.Attribute("ds") != null)
                    {
                        var str = xelement.Attribute("ds")?.Value;
                        if (!string.IsNullOrEmpty(str))
                        {
                            xelement.Add(new XAttribute("ods", str));
                        }
                    }
                }
            }

            return xelementList;
        }

        /// <inheritdoc/>
        public void MergePartialDesignsRenderings(
          XElement layoutXml,
          IEnumerable<XElement> designRenderings)
        {
            var dictionary = GetLayoutDictionary(layoutXml);

            foreach (XElement designRendering in designRenderings)
            {
                string key = designRendering.Attribute("id")?.Value + "#" + designRendering.Attribute("l")?.Value;
                if (dictionary.ContainsKey(key))
                {
                    dictionary[key].InsertRange(0, designRendering.Descendants("r"));
                }
                else
                {
                    dictionary.Add(key, designRendering.Descendants("r").ToList());
                }
            }

            UpdateLayout(layoutXml, dictionary);
        }

        /// <inheritdoc/>
        public void ArrangeRenderings(XElement layoutXml, Item designItem)
        {
            // Create a dictionary of Page Design's renderings which represented in xml format.
            // Where 'key' - is string of device id and layout id and 'value' - renderings in design items.
            // Where 'd' - device node, 'l' - layout node, 'r' - rendering - node, 'uid' - id of the instance rendering.
            Dictionary<string, Dictionary<string, OrderedRendering>> designPageDictionary = GetFromField(designItem)
             .Elements("d")
             .ToDictionary(
                 d => string.Format(DeviceAndLayoutPattern, d.Attribute("id")?.Value, d.Attribute("l")?.Value),
                 deviceElement => deviceElement.Elements("r").Select((rendering, i) => new OrderedRendering()
                 {
                     LayoutXml = rendering,
                     Position = i,
                     Id = rendering.Attribute("uid")?.Value
                 }).ToDictionary(x => x.Id));

            // Arrange layout renderings in order of a design page layout.
            var layoutDevices = layoutXml.Elements("d");

            foreach (var layoutDevice in layoutDevices)
            {
                string deviceKey = string.Format(DeviceAndLayoutPattern, layoutDevice.Attribute("id")?.Value, layoutDevice.Attribute("l")?.Value);

                var layoutRenderings = layoutDevice.Elements("r");
                if (designPageDictionary.TryGetValue(deviceKey, out var designDevice) && layoutRenderings.Any())
                {
                    foreach (var layoutRendering in layoutRenderings)
                    {
                        var layoutRenderingKey = layoutRendering.Attribute("uid")?.Value;
                        if (designDevice.TryGetValue(layoutRenderingKey, out var rendering))
                        {
                            MergeParameters(rendering.LayoutXml, layoutRendering);
                            rendering.LayoutXml = layoutRendering;
                        }
                    }
                }
            }

            var orderedDictionary = designPageDictionary.ToDictionary(
                device => device.Key,
                device => device.Value
                    .Select(rendering => rendering.Value)
                    .OrderBy(rendering => rendering.Position)
                    .Select(x => x.LayoutXml)
                    .ToList());

            UpdateLayout(layoutXml, orderedDictionary);
        }

        /// <inheritdoc/>
        public void MergeMultivaritantRenderings(XElement layoutXml, IEnumerable<XElement> designPartials)
        {
            var layoutDictionary = GetLayoutDictionary(layoutXml);

            // Merge 'mvt' attribute from page design to layout rendering.
            foreach (var designDevice in designPartials)
            {
                string deviceKey = string.Format(DeviceAndLayoutPattern, designDevice.Attribute("id")?.Value, designDevice.Attribute("l")?.Value);

                // If device exists in layout then try to ovewrite layout renderings
                if (layoutDictionary.TryGetValue(deviceKey, out var layoutRenderings))
                {
                    var designRenderings = designDevice.Elements("r");

                    foreach (var designRendering in designRenderings)
                    {
                        XElement layoutRendering = null;

                        layoutRendering = layoutRenderings
                                            .FirstOrDefault(el =>
                                            el.Attribute("id")?.Value == designRendering.Attribute("id")?.Value);

                        // If rendering exists in layout then overwrite 'mvt' attribute
                        if (layoutRendering != null)
                        {
                            layoutRendering.SetAttributeValue("mvt", designRendering.Attribute("mvt")?.Value);
                        }
                    }
                }
            }

            UpdateLayout(layoutXml, layoutDictionary);
        }

        protected internal IEnumerable<XElement> GetRenderings(Item item)
        {
            MultilistField field = item.Fields[Templates.PageDesign.Fields.PartialDesigns];
            if (field == null)
            {
                XElement fromField = GetFromField(item);
                if (fromField != null)
                {
                    return fromField.Descendants("d");
                }

                return Enumerable.Empty<XElement>();
            }

            return field.GetItems().Reverse().Select(s =>
            {
                List<XElement> list = GetBasePartialDesignRenderings(s).ToList();
                XElement fromField = GetFromField(s);
                if (fromField != null)
                {
                    list.AddRange(fromField.Descendants("d").ToList());
                }

                return list;
            }).SelectMany(x => x);
        }

        protected internal IEnumerable<XElement> GetBasePartialDesignRenderings(Item partialDesign)
        {
            List<XElement> xelementList = new List<XElement>();
            MultilistField field = partialDesign.Fields[Templates.PartialDesign.Fields.BasePartialDesign];
            if (field != null)
            {
                foreach (Item partialDesign1 in field.GetItems().Where(s => s.ID != partialDesign.ID))
                {
                    XElement fromField = GetFromField(partialDesign1);
                    if (fromField != null)
                    {
                        xelementList.AddRange(fromField.Descendants("d"));
                    }

                    xelementList.AddRange(GetBasePartialDesignRenderings(partialDesign1));
                }
            }

            return xelementList;
        }

        protected internal XElement GetFromField(Item item)
        {
            LayoutField layoutField = new LayoutField(item);
            if (layoutField.InnerField == null)
            {
                return null;
            }

            string innerXml = layoutField.Data.InnerXml;
            if (innerXml.IsWhiteSpaceOrNull())
            {
                return null;
            }

            return XDocument.Parse(innerXml).Root;
        }

        /// <summary>
        /// Merge context item rendering parameters with design item rendering parameters.
        /// </summary>
        /// <param name="designItemRendering">Desing item rendering.</param>
        /// <param name="contextItemRendering">Context item rendering.</param>
        private void MergeParameters(XElement designItemRendering, XElement contextItemRendering)
        {
            var designParameters = GetRenderingParameters(designItemRendering);
            var contextParameters = GetRenderingParameters(contextItemRendering);

            if (designItemRendering != null && contextParameters != null)
            {
                foreach (var designParameter in designParameters)
                {
                    if (contextParameters.ContainsKey(designParameter.Key) && !string.IsNullOrWhiteSpace(designParameter.Value))
                    {
                        contextParameters[designParameter.Key] = designParameter.Value;
                    }
                }

                // Setting merged parameters into context item rendering.
                contextItemRendering.Attribute("par").Value = string.Join("&", contextParameters.Select(x => $"{x.Key}={x.Value}"));
            }
        }

        /// <summary>
        /// Get rendering parameters.
        /// </summary>
        /// <param name="rendering">Xml rendering.</param>
        /// <returns>Collection of rendering parameters.</returns>
        private Dictionary<string, string> GetRenderingParameters(XElement rendering)
        {
            // Create a dictionary of rendering parameters.
            // Where 'key' - is string of parameter name (always first parameter) and 'value' - rendering parameter value (second parameter if parameter has value).
            // Where 'par' - parameter attribute, '&' - parameter separator , '=' - parameter name and value separator.
            var parameters = rendering
                .Attribute("par")?
                .Value
                .Split('&')
                .Select(x => x.Split('='))
                .GroupBy(x => x.First()) // Groupped by parameter name.
                .ToDictionary(key => key.Key, value =>
                {
                    var parameter = value.First();
                    // If parameter.length > 1 this mean that parameter has value.
                    return parameter.Length > 1 ? parameter.Last() : null;
                });

            return parameters;
        }

        /// <summary>
        /// Update layout with new renderigns.
        /// </summary>
        /// <param name="layoutXml">Context item layout.</param>
        /// <param name="layoutDictionary">Layout dictionary with updated renderigns.</param>
        private void UpdateLayout(XElement layoutXml, Dictionary<string, List<XElement>> layoutDictionary)
        {
            if (!layoutDictionary.Any(x => x.Value.Count > 0))
            {
                return;
            }

            foreach (string key in layoutDictionary.Keys)
            {
                if (layoutDictionary[key].Any())
                {
                    string[] deviceData = key.Split('#');
                    layoutXml.Descendants("d").Where(d =>
                    {
                        if (d.Attribute("id")?.Value == deviceData[0])
                        {
                            return d.Attribute("l")?.Value == deviceData[1];
                        }

                        return false;
                    }).Remove();

                    XElement xelement1 = new XElement("d", new XAttribute("id", deviceData[0]), new XAttribute("l", deviceData[1]));

                    foreach (XElement xelement2 in layoutDictionary[key])
                    {
                        xelement1.Add(xelement2);
                    }

                    layoutXml.Add(xelement1);
                }
            }
        }

        /// <summary>
        /// Get layout in dictionary format.
        /// Where 'key' - is string of device id and layout id and where 'value' - is list of renderings.
        /// </summary>
        /// <param name="layoutXml">Layout in xml format.</param>
        /// <returns>Layout in dictionary format.</returns>
        private Dictionary<string, List<XElement>> GetLayoutDictionary(XElement layoutXml)
        {
            // Create a dictionary of layout renderings which represented in xml format.
            // Where 'key' - is string of device id and layout id
            // Where 'd' - device node, 'l' - layout node, 'r' - rendering - node
            // And where 'value' - is list of renderings
            return layoutXml.Elements("d")
                .ToDictionary(
                   d => string.Format(DeviceAndLayoutPattern, d.Attribute("id")?.Value, d.Attribute("l")?.Value),
                   deviceElement => deviceElement.Elements("r").ToList());
        }
    }
}
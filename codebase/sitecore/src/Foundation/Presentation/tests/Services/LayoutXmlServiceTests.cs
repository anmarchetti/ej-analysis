using System.Collections.Generic;
using System.Linq;
using System.Xml.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Presentation.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.StringExtensions;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Services
{
    public class LayoutXmlServiceTests
    {
        private readonly LayoutXmlService service;

        public LayoutXmlServiceTests()
        {
            service = new LayoutXmlService();
        }

        [Fact]
        public void GetRenderings_ShouldBeEmpty_IfPassedNullParams()
        {
            // Act
            var actual = service.GetRenderings(null, null);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void GetFromField_ShouldBeHasDefaultValue(Item item)
        {
            var expected = XDocument.Parse("<r />").Root;

            // Act
            var actual = service.GetFromField(item);

            // Assert
            actual.Should().BeEquivalentTo(expected);
        }

        [Fact]
        public void MergePartialDesignsRenderings_ShouldHasNineRenderingsAfterMerge()
        {
            // Arrange
            var layoutXml = XDocument.Parse(LayoutXmlServiceTestsData.PartialFooterBodyXml).Root;
            var designRenderings = new List<XElement>()
            {
                XDocument.Parse(LayoutXmlServiceTestsData.PartialFooterBodyXml).Root,
                XDocument.Parse(LayoutXmlServiceTestsData.PartialHeaderBodyXml).Root
            };

            // Act
            service.MergePartialDesignsRenderings(layoutXml, designRenderings);

            // Assert
            layoutXml.Descendants("r").Should().HaveCount(9);
        }

        [Fact]
        public void MergePartialDesignsRenderings_ShouldHasTheSameRenderingsAfterMerge_IfDesignRendeingsHasNoRenderings()
        {
            // Arrange
            var layoutXml = XDocument.Parse(LayoutXmlServiceTestsData.PartialFooterBodyXml).Root;
            var designRenderings = new List<XElement>()
            {
                XDocument.Parse(LayoutXmlServiceTestsData.PartialDesignWithoutRenderings).Root,
            };

            // Act
            service.MergePartialDesignsRenderings(layoutXml, designRenderings);

            // Assert
            layoutXml.Descendants("r").Should().HaveCount(3);
        }

        [Theory]
        [AutoData]
        public void GetRenderings_ShouldReturnRenderings_IfLayoutFieldContainsRenderings(Db db)
        {
            // Arrange
            var deviceId = ID.NewID;
            var layoutId = ID.NewID;

            db.Add(new DbItem("Layout", ItemIDs.LayoutRoot, TemplateIDs.MainSection)
            {
                ParentID = ItemIDs.RootID,
                // TODO FullPath = "/sitecore/layout",
                Children =
                {
                    new DbItem("Devices", ItemIDs.DevicesRoot, TemplateIDs.Node)
                    {
                        new DbItem("Default", deviceId, TemplateIDs.Device)
                        {
                            { DeviceFieldIDs.Default, "1" }
                        }
                    },
                    new DbItem("Layouts", ItemIDs.Layouts, TemplateIDs.Node)
                    {
                        new DbItem("Default", layoutId, TemplateIDs.Layout)
                    }
                }
            });

            var templateLayout =
                    @"<r xmlns:xsd=""http://www.w3.org/2001/XMLSchema"">
                        <d id=""{0}"" l=""{1}"" />
                    </r>".FormatWith(deviceId, layoutId);

            var basePartialDesignLayout =
                    @"<r xmlns:p=""p"" xmlns:s=""s"" p:p=""1"">
                        <d id=""{0}"">
                            <r ds=""{0}"" uid=""{1}"" s:id=""{2}"" s:ph=""Main"" />
                        </d>
                    </r>";

            var contextItemLayout =
                    @"<r xmlns:p=""p"" xmlns:s=""s"" p:p=""1"">
                        <d id=""{0}"">
                            <r ds=""{0}"" uid=""{1}"" s:id=""{2}"" s:ph=""Main"" />
                        </d>
                    </r>";

            var partialDesignXmlLayout = XmlDeltas.ApplyDelta(templateLayout, basePartialDesignLayout.FormatWith(deviceId, ID.NewID, ID.NewID, ID.NewID));
            var contextItemXmlLayout = XmlDeltas.ApplyDelta(templateLayout, contextItemLayout.FormatWith(deviceId, ID.NewID, ID.NewID, ID.NewID));

            var contextDbItem = new DbItem("Context item", Templates.PartialDesign.Id);
            contextDbItem.Fields.Add(FieldIDs.LayoutField, contextItemXmlLayout);
            db.Add(contextDbItem);

            var basePartialDesignDbItem = new DbItem("Base partial design");
            basePartialDesignDbItem.Fields.Add(FieldIDs.LayoutField, partialDesignXmlLayout);
            db.Add(basePartialDesignDbItem);

            var partialDesignDbItem = new DbItem("Paretial design");
            partialDesignDbItem.Fields.Add(Templates.PartialDesign.Fields.BasePartialDesign, basePartialDesignDbItem.ID.ToString());
            db.Add(partialDesignDbItem);

            var designDbItem = new DbItem("Design item");
            designDbItem.Fields.Add(Templates.PageDesign.Fields.PartialDesigns, partialDesignDbItem.ID.ToString());
            db.Add(designDbItem);

            // Act
            var act = service.GetRenderings(db.GetItem(contextDbItem.ID), db.GetItem(designDbItem.ID));

            // Assert
            act.Should().NotBeNull();
            act.Should().HaveCount(1);
        }

        [Theory]
        [AutoDbData]
        public void ArrangeRenderigns_ShouldReturnOrderedRenderings_IfDesignItemHasRenderings(Item item)
        {
            // Arrange
            var layoutXml = XDocument.Parse(LayoutXmlServiceTestsData.BodyRenderingXml).Root;

            using (new EditContext(item))
            {
                item[FieldIDs.LayoutField] = LayoutXmlServiceTestsData.OrderingRenderingBodyXml;
            }

            // Act
            service.ArrangeRenderings(layoutXml, item);
            var actual = layoutXml.Descendants("r").ToArray();

            // Assert
            actual.Should().HaveCount(2);
            actual[0].Attribute("ph").Value.Should().Be("/body/wrapper-row-1");
            actual[0].Attribute("ds").Value.Should().Be("/sitecore/content-home");
            actual[1].Attribute("ph").Value.Should().Be("/body");
        }

        [Theory]
        [AutoDbData]
        public void MergeRenderings_ShouldMergeRenderings_IfContextItemRenderingAndDesignItemRenderingHaveParameters(Item designItem)
        {
            // Arrange
            var contextLayoutXml = XDocument.Parse(LayoutXmlServiceTestsData.ContextItemBodyXml).Root;

            using (new EditContext(designItem))
            {
                designItem[FieldIDs.LayoutField] = LayoutXmlServiceTestsData.DesignItemBodyXml;
            }

            // Act
            service.ArrangeRenderings(contextLayoutXml, designItem);
            var actual = contextLayoutXml.Descendants("r").ToArray();

            // Assert
            actual[0].Attribute("par").Value.Should().Be("param=value2");
        }

        [Fact]
        public void MergeMultivaritantRenderings_ShouldReturnMergedMultivariantRenderings_IfDesignItemHasRenderings()
        {
            // Arrange
            var layoutXml = XDocument.Parse(LayoutXmlServiceTestsData.BodyRenderingXml).Root;

            var designRenderings = new List<XElement>()
            {
                XDocument.Parse(LayoutXmlServiceTestsData.MultivariantBodyRenderingXml).Root,
            };

            // Act
            service.MergeMultivaritantRenderings(layoutXml, designRenderings);
            var actual = layoutXml.Descendants("r").ToArray();

            // Assert
            actual.Should().HaveCount(3);
            actual[2].Attribute("ph").Value.Should().Be("/body/wrapper-row-1");
            actual[2].Attribute("mvt").Value.Should().Be("{C002A035-1BB7-4CDC-AFD7-D1F1844B4A19}");
        }

        [Theory]
        [AutoDbData]
        public void GetRenderings_ShouldReturnRenderings_IfPageDesignContainsRenderings(
            Db db,
            ID deviceId,
            ID layoutId)
        {
            // Arrange
            db.Add(new DbItem("Layout", ItemIDs.LayoutRoot, TemplateIDs.MainSection)
            {
                ParentID = ItemIDs.RootID,
                // TODO FullPath = "/sitecore/layout",
                Children =
                {
                    new DbItem("Devices", ItemIDs.DevicesRoot, TemplateIDs.Node)
                    {
                        new DbItem("Default", deviceId, TemplateIDs.Device)
                        {
                            { DeviceFieldIDs.Default, "1" }
                        }
                    },
                    new DbItem("Layouts", ItemIDs.Layouts, TemplateIDs.Node)
                    {
                        new DbItem("Default", layoutId, TemplateIDs.Layout)
                    }
                }
            });

            var templateLayout =
                    @"<r xmlns:xsd=""http://www.w3.org/2001/XMLSchema"">
                        <d id=""{0}"" l=""{1}"" />
                    </r>".FormatWith(deviceId, layoutId);

            var pageDesignLayout =
                    @"<r xmlns:p=""p"" xmlns:s=""s"" p:p=""1"">
                        <d id=""{0}"">
                            <r ds=""{0}"" uid=""{1}"" s:id=""{2}"" s:ph=""Main"" />
                        </d>
                    </r>";

            var contextItemLayout =
                    @"<r xmlns:p=""p"" xmlns:s=""s"" p:p=""1"">
                        <d id=""{0}"">
                            <r ds=""{0}"" uid=""{1}"" s:id=""{2}"" s:ph=""Main"" />
                        </d>
                    </r>";

            var pageDesignXmlLayout = XmlDeltas.ApplyDelta(templateLayout, pageDesignLayout.FormatWith(deviceId, ID.NewID, ID.NewID, ID.NewID));
            var contextItemXmlLayout = XmlDeltas.ApplyDelta(templateLayout, contextItemLayout.FormatWith(deviceId, ID.NewID, ID.NewID, ID.NewID));

            var contextDbItem = new DbItem("Context item");
            contextDbItem.Fields.Add(FieldIDs.LayoutField, contextItemXmlLayout);
            db.Add(contextDbItem);

            var designDbItem = new DbItem("Design item");
            designDbItem.Fields.Add(FieldIDs.LayoutField, pageDesignXmlLayout);
            db.Add(designDbItem);

            // Act
            var actual = service.GetRenderings(db.GetItem(contextDbItem.ID), db.GetItem(designDbItem.ID));

            // Assert
            actual.Should().NotBeNull();
            actual.Should().HaveCount(1);
        }
    }
}

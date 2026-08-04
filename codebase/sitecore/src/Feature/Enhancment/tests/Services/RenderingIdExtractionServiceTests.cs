using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Feature.SitecoreEnhancment.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;
using PresentationConstants = easyJet.Foundation.Presentation.Constants;
using PresentationTemplates = easyJet.Foundation.Presentation.Templates;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Services
{
    public class RenderingIdExtractionServiceTests
    {
        private readonly ISitecoreEnhancmentLogger logger;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IFieldUtilsService fieldUtilsService;
        private readonly TestableRenderingIdExtractionService sut;

        public RenderingIdExtractionServiceTests()
        {
            logger = Substitute.For<ISitecoreEnhancmentLogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            fieldUtilsService = Substitute.For<IFieldUtilsService>();
            sut = new TestableRenderingIdExtractionService(logger, databaseProvider, fieldUtilsService);
        }

        // ============================================================
        // ExtractFromItemId
        // ============================================================
        [Fact]
        public void ExtractFromItemId_WhenItemNotFound_ShouldReturnEmptySet()
        {
            // ARRANGE
            var itemId = ID.NewID;
            databaseProvider.GetItem(itemId, DatabaseType.Master).Returns((Item)null);

            // ACT
            var result = sut.ExtractFromItemId(itemId);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void ExtractFromItemId_WhenItemFound_ShouldCallExtractFromItem()
        {
            // ARRANGE
            var itemId = ID.NewID;
            var item = new FakeItem(itemId).ToSitecoreItem();
            databaseProvider.GetItem(itemId, DatabaseType.Master).Returns(item);

            // ACT
            sut.ExtractFromItemId(itemId);

            // ASSERT
            sut.LastExtractedFromItem.Should().BeSameAs(item);
        }

        [Fact]
        public void ExtractFromItemId_WhenItemFound_ShouldReturnExtractedIds()
        {
            // ARRANGE
            var itemId = ID.NewID;
            var renderingId = ID.NewID;
            var item = new FakeItem(itemId).ToSitecoreItem();
            databaseProvider.GetItem(itemId, DatabaseType.Master).Returns(item);
            sut.ReturnOnExtract = new HashSet<ID> { renderingId };

            // ACT
            var result = sut.ExtractFromItemId(itemId);

            // ASSERT
            result.Should().ContainSingle().Which.Should().Be(renderingId);
        }

        // ============================================================
        // ExtractFromTemplateId
        // ============================================================
        [Fact]
        public void ExtractFromTemplateId_WhenDatabaseIsNull_ShouldReturnEmptySet()
        {
            // ARRANGE
            var templateId = ID.NewID;
            databaseProvider.GetItem(templateId, DatabaseType.Master).Returns((Item)null);

            // ACT
            var result = sut.ExtractFromTemplateId(templateId);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void ExtractFromTemplateId_WhenTemplateItemNotFound_ShouldReturnEmptySet()
        {
            // ARRANGE
            var templateId = ID.NewID;
            databaseProvider.GetItem(templateId, DatabaseType.Master).Returns((Item)null);

            // ACT
            var result = sut.ExtractFromTemplateId(templateId);

            // ASSERT
            result.Should().BeEmpty();
        }

        // ============================================================
        // ExtractFromPageDesignsMatchingTemplate
        // ============================================================
        [Fact]
        public void ExtractFromPageDesignsMatchingTemplate_WhenTemplateIdIsNull_ShouldReturnEmptySet()
        {
            // ARRANGE / ACT
            var result = sut.ExtractFromPageDesignsMatchingTemplate(ID.Null);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void ExtractFromPageDesignsMatchingTemplate_WhenPageDesignsRootNotFound_ShouldReturnEmptySet()
        {
            // ARRANGE
            var templateId = ID.NewID;
            databaseProvider.GetItem(PresentationConstants.ItemIds.PageDesignsRoot, DatabaseType.Master).Returns((Item)null);

            // ACT
            var result = sut.ExtractFromPageDesignsMatchingTemplate(templateId);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void ExtractFromPageDesignsMatchingTemplate_WhenNoDesignMatchesTemplate_ShouldReturnEmptySet()
        {
            // ARRANGE
            var templateId = ID.NewID;
            var differentTemplateId = ID.NewID;
            var rootFake = new FakeItem();
            _ = new FakeItem()
                .WithField(PresentationConstants.Fields.PageDesign.PageTemplatesFieldId, differentTemplateId.ToString())
                .WithParent(rootFake)
                .ToSitecoreItem();
            databaseProvider.GetItem(PresentationConstants.ItemIds.PageDesignsRoot, DatabaseType.Master).Returns(rootFake.ToSitecoreItem());

            // ACT
            var result = sut.ExtractFromPageDesignsMatchingTemplate(templateId);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void ExtractFromPageDesignsMatchingTemplate_WhenDesignMatchesTemplate_ShouldDelegateToExtractFromItem()
        {
            // ARRANGE
            var templateId = ID.NewID;
            var rootFake = new FakeItem();
            var designFake = new FakeItem()
                .WithField(PresentationConstants.Fields.PageDesign.PageTemplatesFieldId, templateId.ToString())
                .WithParent(rootFake);
            var pageDesign = designFake.ToSitecoreItem();
            databaseProvider.GetItem(PresentationConstants.ItemIds.PageDesignsRoot, DatabaseType.Master).Returns(rootFake.ToSitecoreItem());

            // ACT
            sut.ExtractFromPageDesignsMatchingTemplate(templateId);

            // ASSERT
            sut.LastExtractedFromItem.Should().BeSameAs(pageDesign);
        }

        [Fact]
        public void ExtractFromPageDesignsMatchingTemplate_WhenDesignMatchesTemplate_ShouldReturnPartialRenderingIds()
        {
            // ARRANGE
            var templateId = ID.NewID;
            var renderingId = ID.NewID;
            var rootFake = new FakeItem();
            var designFake = new FakeItem()
                .WithField(PresentationConstants.Fields.PageDesign.PageTemplatesFieldId, templateId.ToString())
                .WithParent(rootFake);
            databaseProvider.GetItem(PresentationConstants.ItemIds.PageDesignsRoot, DatabaseType.Master).Returns(rootFake.ToSitecoreItem());
            sut.ReturnOnExtract = new HashSet<ID> { renderingId };

            // ACT
            var result = sut.ExtractFromPageDesignsMatchingTemplate(templateId);

            // ASSERT
            result.Should().ContainSingle().Which.Should().Be(renderingId);
        }

        // ============================================================
        // ExtractFromItem (uses IFieldUtilsService.GetLayoutFieldValue)
        // ============================================================
        [Fact]
        public void ExtractFromItem_WhenLayoutFieldHasRenderings_ShouldReturnIds()
        {
            // ARRANGE
            var renderingId = ID.NewID;
            var xml = $"<r><d><r id=\"{renderingId}\" /></d></r>";
            var item = new FakeItem(ID.NewID).ToSitecoreItem();
            fieldUtilsService.GetLayoutFieldValue(Arg.Any<Sitecore.Data.Fields.Field>()).Returns(xml, string.Empty);
            var realSut = new RenderingIdExtractionService(logger, databaseProvider, fieldUtilsService);

            // ACT
            var result = realSut.ExtractFromItem(item);

            // ASSERT
            result.Should().ContainSingle().Which.Should().Be(renderingId);
        }

        [Fact]
        public void ExtractFromItem_WhenBothLayoutFieldsHaveRenderings_ShouldReturnCombinedIds()
        {
            // ARRANGE
            var id1 = ID.NewID;
            var id2 = ID.NewID;
            var xml1 = $"<r><d><r id=\"{id1}\" /></d></r>";
            var xml2 = $"<r><d><r id=\"{id2}\" /></d></r>";
            var item = new FakeItem(ID.NewID).ToSitecoreItem();
            fieldUtilsService.GetLayoutFieldValue(Arg.Any<Sitecore.Data.Fields.Field>()).Returns(xml1, xml2);
            var realSut = new RenderingIdExtractionService(logger, databaseProvider, fieldUtilsService);

            // ACT
            var result = realSut.ExtractFromItem(item);

            // ASSERT
            result.Should().HaveCount(2);
            result.Should().Contain(id1);
            result.Should().Contain(id2);
        }

        [Fact]
        public void ExtractFromItem_WhenNoLayoutXml_ShouldReturnEmpty()
        {
            // ARRANGE
            var item = new FakeItem(ID.NewID).ToSitecoreItem();
            fieldUtilsService.GetLayoutFieldValue(Arg.Any<Sitecore.Data.Fields.Field>()).Returns(string.Empty);
            var realSut = new RenderingIdExtractionService(logger, databaseProvider, fieldUtilsService);

            // ACT
            var result = realSut.ExtractFromItem(item);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void ExtractFromItemId_WhenXmlExtractionReturnsEmpty_ShouldCallVisualizationFallback()
        {
            // ARRANGE — simulate SXA delta: XML scan returns empty, page item exists
            var itemId = ID.NewID;
            var item = new FakeItem(itemId).ToSitecoreItem();
            databaseProvider.GetItem(itemId, DatabaseType.Master).Returns(item);
            sut.ReturnOnExtract = new HashSet<ID>(); // empty — triggers fallback

            // ACT
            sut.ExtractFromItemId(itemId);

            // ASSERT
            sut.VisualizationFallbackWasCalled.Should().BeTrue();
        }

        [Fact]
        public void ExtractFromItemId_WhenXmlExtractionReturnsEmpty_ShouldReturnVisualizationFallbackIds()
        {
            // ARRANGE — simulate SXA delta page where only GetRenderings returns IDs
            var itemId = ID.NewID;
            var renderingId = ID.NewID;
            var item = new FakeItem(itemId).ToSitecoreItem();
            databaseProvider.GetItem(itemId, DatabaseType.Master).Returns(item);
            sut.ReturnOnExtract = new HashSet<ID>(); // empty — triggers fallback
            sut.ReturnOnVisualizationFallback = new HashSet<ID> { renderingId };

            // ACT
            var result = sut.ExtractFromItemId(itemId);

            // ASSERT
            result.Should().ContainSingle().Which.Should().Be(renderingId);
        }

        [Fact]
        public void ExtractFromItemId_WhenXmlExtractionReturnsIds_ShouldNotCallVisualizationFallback()
        {
            // ARRANGE — non-delta page: XML scan finds IDs, fallback must NOT fire
            var itemId = ID.NewID;
            var renderingId = ID.NewID;
            var item = new FakeItem(itemId).ToSitecoreItem();
            databaseProvider.GetItem(itemId, DatabaseType.Master).Returns(item);
            sut.ReturnOnExtract = new HashSet<ID> { renderingId };

            // ACT
            sut.ExtractFromItemId(itemId);

            // ASSERT
            sut.VisualizationFallbackWasCalled.Should().BeFalse();
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("StyleCop.CSharp.OrderingRules", "SA1202", Justification = "Proxy class for testing.")]
        // ============================================================
        // ExtractFromLayoutXml (private, tested via reflection)
        // ============================================================
        [Fact]
        public void ExtractFromLayoutXml_WhenXmlContainsRenderingIds_ShouldAddThemToTarget()
        {
            // ARRANGE
            var renderingId = ID.NewID;
            var xml = $"<r><d><r id=\"{renderingId}\" /></d></r>";
            var target = new HashSet<ID>();
            var realSut = new RenderingIdExtractionService(logger, databaseProvider, fieldUtilsService);
            var method = typeof(RenderingIdExtractionService)
                .GetMethod("ExtractFromLayoutXml", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // ACT
            method.Invoke(realSut, new object[] { xml, target });

            // ASSERT
            target.Should().ContainSingle().Which.Should().Be(renderingId);
        }

        [Fact]
        public void ExtractFromLayoutXml_WhenXmlIsEmpty_ShouldNotAddAnyIds()
        {
            // ARRANGE
            var target = new HashSet<ID>();
            var realSut = new RenderingIdExtractionService(logger, databaseProvider, fieldUtilsService);
            var method = typeof(RenderingIdExtractionService)
                .GetMethod("ExtractFromLayoutXml", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // ACT
            method.Invoke(realSut, new object[] { string.Empty, target });

            // ASSERT
            target.Should().BeEmpty();
        }

        [Fact]
        public void ExtractFromLayoutXml_WhenXmlIsMalformed_ShouldLogWarningAndNotThrow()
        {
            // ARRANGE
            var target = new HashSet<ID>();
            var realSut = new RenderingIdExtractionService(logger, databaseProvider, fieldUtilsService);
            var method = typeof(RenderingIdExtractionService)
                .GetMethod("ExtractFromLayoutXml", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // ACT
            method.Invoke(realSut, new object[] { "<not-valid-xml", target });

            // ASSERT
            target.Should().BeEmpty();
            logger.Received(1).Warn(Arg.Is<string>(s => s.Contains("Failed to parse layout XML")), Arg.Any<Type>());
        }

        [Fact]
        public void ExtractFromLayoutXml_WhenXmlContainsMultipleRenderingIds_ShouldAddAll()
        {
            // ARRANGE
            var id1 = ID.NewID;
            var id2 = ID.NewID;
            var xml = $"<r><d><r id=\"{id1}\" /><r id=\"{id2}\" /></d></r>";
            var target = new HashSet<ID>();
            var realSut = new RenderingIdExtractionService(logger, databaseProvider, fieldUtilsService);
            var method = typeof(RenderingIdExtractionService)
                .GetMethod("ExtractFromLayoutXml", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // ACT
            method.Invoke(realSut, new object[] { xml, target });

            // ASSERT
            target.Should().HaveCount(2);
            target.Should().Contain(id1);
            target.Should().Contain(id2);
        }

        [Fact]
        public void ExtractFromLayoutXml_WhenRenderingElementHasNoIdAttribute_ShouldSkip()
        {
            // ARRANGE
            var xml = "<r><d><r ph=\"main\" /></d></r>";
            var target = new HashSet<ID>();
            var realSut = new RenderingIdExtractionService(logger, databaseProvider, fieldUtilsService);
            var method = typeof(RenderingIdExtractionService)
                .GetMethod("ExtractFromLayoutXml", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // ACT
            method.Invoke(realSut, new object[] { xml, target });

            // ASSERT
            target.Should().BeEmpty();
        }

        [Fact]
        public void ExtractFromLayoutXml_WhenIdIsNotValidGuid_ShouldSkip()
        {
            // ARRANGE
            var xml = "<r><d><r id=\"not-a-guid\" /></d></r>";
            var target = new HashSet<ID>();
            var realSut = new RenderingIdExtractionService(logger, databaseProvider, fieldUtilsService);
            var method = typeof(RenderingIdExtractionService)
                .GetMethod("ExtractFromLayoutXml", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // ACT
            method.Invoke(realSut, new object[] { xml, target });

            // ASSERT
            target.Should().BeEmpty();
        }

        // ============================================================
        // GetPageDesignItemsForTemplate — partial designs path
        // ============================================================
        [Fact]
        public void GetPageDesignItemsForTemplate_WhenDesignHasPartialDesigns_ShouldReturnDesignAndPartials()
        {
            // ARRANGE
            var templateId = ID.NewID;
            var partialId = ID.NewID;
            var rootFake = new FakeItem();
            var designFake = new FakeItem()
                .WithField(PresentationConstants.Fields.PageDesign.PageTemplatesFieldId, templateId.ToString())
                .WithField(PresentationConstants.Fields.PageDesign.PartialDesignsFieldId, partialId.ToString())
                .WithParent(rootFake);
            designFake.ToSitecoreItem();
            var partialItem = new FakeItem(partialId).ToSitecoreItem();
            databaseProvider.GetItem(PresentationConstants.ItemIds.PageDesignsRoot, DatabaseType.Master).Returns(rootFake.ToSitecoreItem());
            databaseProvider.GetItem(partialId, DatabaseType.Master).Returns(partialItem);

            // ACT
            var result = sut.GetPageDesignItemsForTemplate(templateId);

            // ASSERT
            result.Should().HaveCount(2);
            result.Should().Contain(partialItem);
        }

        [Fact]
        public void GetPageDesignItemsForTemplate_WhenPartialDesignNotFound_ShouldReturnDesignOnly()
        {
            // ARRANGE
            var templateId = ID.NewID;
            var missingPartialId = ID.NewID;
            var rootFake = new FakeItem();
            var designFake = new FakeItem()
                .WithField(PresentationConstants.Fields.PageDesign.PageTemplatesFieldId, templateId.ToString())
                .WithField(PresentationConstants.Fields.PageDesign.PartialDesignsFieldId, missingPartialId.ToString())
                .WithParent(rootFake);
            designFake.ToSitecoreItem();
            databaseProvider.GetItem(PresentationConstants.ItemIds.PageDesignsRoot, DatabaseType.Master).Returns(rootFake.ToSitecoreItem());
            databaseProvider.GetItem(missingPartialId, DatabaseType.Master).Returns((Item)null);

            // ACT
            var result = sut.GetPageDesignItemsForTemplate(templateId);

            // ASSERT
            result.Should().HaveCount(1);
        }

        [Fact]
        public void GetPageDesignItemsForTemplate_WhenDesignHasEmptyPartialDesignsField_ShouldReturnDesignOnly()
        {
            // ARRANGE
            var templateId = ID.NewID;
            var rootFake = new FakeItem();
            var designFake = new FakeItem()
                .WithField(PresentationConstants.Fields.PageDesign.PageTemplatesFieldId, templateId.ToString())
                .WithField(PresentationConstants.Fields.PageDesign.PartialDesignsFieldId, string.Empty)
                .WithParent(rootFake);
            designFake.ToSitecoreItem();
            databaseProvider.GetItem(PresentationConstants.ItemIds.PageDesignsRoot, DatabaseType.Master).Returns(rootFake.ToSitecoreItem());

            // ACT
            var result = sut.GetPageDesignItemsForTemplate(templateId);

            // ASSERT
            result.Should().HaveCount(1);
        }

        [Fact]
        public void GetPageDesignItemsForTemplate_WhenDesignHasEmptyTemplatesField_ShouldReturnEmpty()
        {
            // ARRANGE
            var templateId = ID.NewID;
            var rootFake = new FakeItem();
            _ = new FakeItem()
                .WithField(PresentationConstants.Fields.PageDesign.PageTemplatesFieldId, string.Empty)
                .WithParent(rootFake)
                .ToSitecoreItem();
            databaseProvider.GetItem(PresentationConstants.ItemIds.PageDesignsRoot, DatabaseType.Master).Returns(rootFake.ToSitecoreItem());

            // ACT
            var result = sut.GetPageDesignItemsForTemplate(templateId);

            // ASSERT
            result.Should().BeEmpty();
        }

        // ============================================================
        // GetItemsForPageId
        // ============================================================
        [Fact]
        public void GetItemsForPageId_WhenDatabaseIsNull_ShouldReturnEmpty()
        {
            // ARRANGE
            var pageId = ID.NewID;
            databaseProvider.GetItem(pageId, DatabaseType.Master).Returns((Item)null);

            // ACT
            var result = sut.GetItemsForPageId(pageId);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetItemsForPageId_WhenPageNotFound_ShouldReturnEmpty()
        {
            // ARRANGE
            var pageId = ID.NewID;
            databaseProvider.GetItem(pageId, DatabaseType.Master).Returns((Item)null);

            // ACT
            var result = sut.GetItemsForPageId(pageId);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetItemsForPageId_WhenPageFound_ShouldIncludePageItem()
        {
            // ARRANGE
            var pageId = ID.NewID;
            var pageItem = new FakeItem(pageId).ToSitecoreItem();
            databaseProvider.GetItem(pageId, DatabaseType.Master).Returns(pageItem);

            // ACT
            var result = sut.GetItemsForPageId(pageId);

            // ASSERT
            result.Should().Contain(pageItem);
        }

        // ============================================================
        // GetItemsForTemplateId
        // ============================================================
        [Fact]
        public void GetItemsForTemplateId_WhenDatabaseIsNull_ShouldReturnEmpty()
        {
            // ARRANGE
            var templateId = ID.NewID;
            databaseProvider.GetItem(templateId, DatabaseType.Master).Returns((Item)null);

            // ACT
            var result = sut.GetItemsForTemplateId(templateId);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetItemsForTemplateId_WhenTemplateItemNotFound_ShouldReturnPageDesignResults()
        {
            // ARRANGE
            var templateId = ID.NewID;
            databaseProvider.GetItem(templateId, DatabaseType.Master).Returns((Item)null);

            // ACT
            var result = sut.GetItemsForTemplateId(templateId);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetItemsForTemplateId_ShouldCapInstancesAtFive()
        {
            // ARRANGE — fast query returns 10 items; only the first 5 should be included
            // to avoid scanning the full content tree for large templates.
            var templateId = ID.NewID;
            databaseProvider.GetItem(Arg.Any<ID>(), Arg.Any<DatabaseType>()).Returns((Item)null);
            var manyInstances = Enumerable.Range(0, 10)
                .Select(_ => new FakeItem().ToSitecoreItem())
                .ToArray();
            databaseProvider.SelectItems(Arg.Any<string>(), Arg.Any<DatabaseType>()).Returns(manyInstances);

            // ACT
            var result = sut.GetItemsForTemplateId(templateId);

            // ASSERT
            result.Should().HaveCount(5);
        }

        [Fact]
        public void GetItemsForTemplateId_WhenFewerThanMaxInstances_ShouldIncludeAll()
        {
            // ARRANGE
            var templateId = ID.NewID;
            databaseProvider.GetItem(Arg.Any<ID>(), Arg.Any<DatabaseType>()).Returns((Item)null);
            var twoInstances = new[]
            {
                new FakeItem().ToSitecoreItem(),
                new FakeItem().ToSitecoreItem(),
            };
            databaseProvider.SelectItems(Arg.Any<string>(), Arg.Any<DatabaseType>()).Returns(twoInstances);

            // ACT
            var result = sut.GetItemsForTemplateId(templateId);

            // ASSERT
            result.Should().HaveCount(2);
        }

        // ============================================================
        // GetItemsForEcpRuleItem
        // ============================================================
        [Fact]
        public void GetItemsForEcpRuleItem_WhenRuleItemIsNull_ShouldReturnEmpty()
        {
            // Arrange / Act
            var result = sut.GetItemsForEcpRuleItem(null);

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetItemsForEcpRuleItem_WhenPageFieldIsSet_ShouldReturnItemsForThatPage()
        {
            // Arrange
            var pageItemId = ID.NewID;
            var pageItem = new FakeItem(pageItemId).ToSitecoreItem();
            var ruleItem = new FakeItem()
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPage.Page, pageItemId.ToString())
                .ToSitecoreItem();
            databaseProvider.GetItem(pageItemId, DatabaseType.Master).Returns(pageItem);

            // Act
            var result = sut.GetItemsForEcpRuleItem(ruleItem);

            // Assert
            result.Should().Contain(pageItem);
        }

        [Fact]
        public void GetItemsForEcpRuleItem_WhenPageFieldNotSetAndTemplateFieldIsSet_ShouldReturnItemsForThatTemplate()
        {
            // Arrange
            var templateItemId = ID.NewID;
            var sv = new FakeItem().ToSitecoreItem();
            var templateFake = new FakeItem(templateItemId);
            templateFake.WithTemplate(Sitecore.TemplateIDs.Template);
            var templateItem = templateFake.ToSitecoreItem();
            var ruleItem = new FakeItem()
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPage.Page, string.Empty)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPageTemplate.PageTemplate, templateItemId.ToString())
                .ToSitecoreItem();
            databaseProvider.GetItem(templateItemId, DatabaseType.Master).Returns(templateItem);
            databaseProvider.SelectItems(Arg.Any<string>(), Arg.Any<DatabaseType>()).Returns(Array.Empty<Item>());

            // Act
            var result = sut.GetItemsForEcpRuleItem(ruleItem);

            // Assert
            databaseProvider.Received(1).GetItem(templateItemId, DatabaseType.Master);
        }

        [Fact]
        public void GetItemsForEcpRuleItem_WhenNeitherFieldIsSet_ShouldReturnEmpty()
        {
            // Arrange
            var ruleItem = new FakeItem()
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPage.Page, string.Empty)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPageTemplate.PageTemplate, string.Empty)
                .ToSitecoreItem();

            // Act
            var result = sut.GetItemsForEcpRuleItem(ruleItem);

            // Assert
            result.Should().BeEmpty();
        }

        private sealed class TestableRenderingIdExtractionService : RenderingIdExtractionService
        {
            public Item LastExtractedFromItem { get; private set; }

            public HashSet<ID> ReturnOnExtract { get; set; } = new HashSet<ID>();

            public bool VisualizationFallbackWasCalled { get; private set; }

            public HashSet<ID> ReturnOnVisualizationFallback { get; set; } = new HashSet<ID>();

            public TestableRenderingIdExtractionService(ISitecoreEnhancmentLogger pLogger, IDatabaseProvider pDatabaseProvider, IFieldUtilsService pFieldUtilsService)
                : base(pLogger, pDatabaseProvider, pFieldUtilsService)
            {
            }

            public override HashSet<ID> ExtractFromItem(Item item)
            {
                LastExtractedFromItem = item;
                return ReturnOnExtract;
            }

            protected override void ExtractFromItemVisualization(Item item, HashSet<ID> target)
            {
                VisualizationFallbackWasCalled = true;
                foreach (var id in ReturnOnVisualizationFallback)
                {
                    target.Add(id);
                }
            }
        }
    }
}

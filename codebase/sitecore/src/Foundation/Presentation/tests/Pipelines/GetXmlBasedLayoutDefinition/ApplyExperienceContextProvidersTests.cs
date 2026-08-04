using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Web;
using System.Xml.Linq;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Models;
using easyJet.Foundation.Presentation.Pipelines.GetXmlBasedLayoutDefinition;
using easyJet.Foundation.Presentation.Repositories;
using easyJet.Foundation.Presentation.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Mvc.Pipelines.Response.GetXmlBasedLayoutDefinition;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Pipelines.GetXmlBasedLayoutDefinition
{
    /// <summary>
    /// Consolidated test class for ApplyExperienceContextProviders pipeline processor.
    /// Tests are organized by logical sections (Process Guards, Context Guards, Additional Guards, etc.)
    /// </summary>
    public class ApplyExperienceContextProvidersTests
    {
        [Fact]
        public void Process_DoesNothing_WhenArgsIsNull()
        {
            // ARRANGE
            var sut = CreateSut(out _, out _, out _);

            // ACT
            var exception = Record.Exception(() => sut.Process(null));

            // ASSERT
            exception.Should().BeNull();
        }

        [Fact]
        public void Process_DoesNothing_WhenResultIsNull()
        {
            // ARRANGE
            var sut = CreateSut(out _, out var pHttpAccessor, out var pScContext);
            var args = new GetXmlBasedLayoutDefinitionArgs();
            args.ContextItem = null;
            args.Result = null;
            pHttpAccessor.GetCurrent().Returns((HttpContext)null);
            pScContext.Item.Returns((Item)null);

            // ACT
            var exception = Record.Exception(() => sut.Process(args));

            // ASSERT
            exception.Should().BeNull();
        }

        [Fact]
        public void Process_ReturnsEarly_WhenContextItemIsNull()
        {
            // ARRANGE
            var pRepository = Substitute.For<IExperienceContextProviderRepository>();
            var pHttpAccessor = Substitute.For<IHttpContextAccessor>();
            var pScContext = Substitute.For<ISitecoreContextProvider>();
            var pLogger = Substitute.For<IPresentationLogger>();
            var sut = new ApplyExperienceContextProviders(pHttpAccessor, pScContext, pLogger, pRepository, Substitute.For<IRenderingReplacementService>());

            var args = new GetXmlBasedLayoutDefinitionArgs
            {
                Result = new XElement("root", new XElement("layout")),
                ContextItem = null
            };

            var pRequest = new HttpRequest(string.Empty, "http://localhost/", "ecp=foo");
            var pResponse = new HttpResponse(new StringWriter());
            pHttpAccessor.GetCurrent().Returns(new HttpContext(pRequest, pResponse));
            pScContext.Item.Returns((Item)null);

            // ACT
            sut.Process(args);

            // ASSERT
            var pFirst = args.Result.Elements().First();
            pFirst.Name.LocalName.Should().Be("layout");
        }

        [Fact]
        public void Process_DoesNothing_WhenQueryParamMissing()
        {
            // ARRANGE
            var sut = CreateSut(out _, out var pHttpAccessor, out var pScContext);
            var args = new GetXmlBasedLayoutDefinitionArgs
            {
                Result = new XElement("root", new XElement("layout")),
                ContextItem = null
            };

            var pRequest = new HttpRequest(string.Empty, "http://localhost/", string.Empty);
            var pResponse = new HttpResponse(new StringWriter());
            pHttpAccessor.GetCurrent().Returns(new HttpContext(pRequest, pResponse));

            // ACT
            sut.Process(args);

            // ASSERT
            args.Result.Elements().First().Name.LocalName.Should().Be("layout");
        }

        [Fact]
        public void Process_DoesNothing_WhenNoMatchingRules()
        {
            // ARRANGE
            var sut = CreateSut(out var pRepository, out var pHttpAccessor, out var pScContext);
            var pLayout = new XElement("root", new XElement("layout", new XElement("rendering", new XAttribute("id", ID.NewID.ToString()))));
            var args = new GetXmlBasedLayoutDefinitionArgs
            {
                Result = pLayout,
                ContextItem = null
            };

            var pRequest = new HttpRequest(string.Empty, "http://localhost/", "ecp=foo");
            var pResponse = new HttpResponse(new StringWriter());
            pHttpAccessor.GetCurrent().Returns(new HttpContext(pRequest, pResponse));
            pRepository.GetActiveProviderPages("foo", Arg.Any<ID>()).Returns(Array.Empty<ExperienceContextProviderPageRule>());

            // ACT
            sut.Process(args);

            // ASSERT
            var pLayoutElement = pLayout.Elements().First();
            pLayoutElement.Elements().Should().HaveCount(1);
        }

        [Fact]
        public void ProcessRenderingElement_ReturnsEarly_WhenNoIdAttribute()
        {
            // ARRANGE
            var sut = CreateSut();
            var pMethod = typeof(ApplyExperienceContextProviders).GetMethod(
                "ProcessRenderingElement",
                BindingFlags.NonPublic | BindingFlags.Instance);

            var pElement = new XElement("rendering");
            var pRules = new List<ExperienceContextProviderPageRule>();
            var pToRemove = new HashSet<ID>();

            // ACT
            pMethod.Invoke(sut, new object[] { pElement, pRules, pToRemove, false });

            // ASSERT
            pToRemove.Should().BeEmpty();
        }

        [Fact]
        public void ProcessRenderingElement_ReturnsEarly_WhenInvalidId()
        {
            // ARRANGE
            var sut = CreateSut();
            var pMethod = typeof(ApplyExperienceContextProviders).GetMethod(
                "ProcessRenderingElement",
                BindingFlags.NonPublic | BindingFlags.Instance);

            var pElement = new XElement("rendering", new XAttribute("id", "not-a-guid"));
            var pRules = new List<ExperienceContextProviderPageRule>();
            var pToRemove = new HashSet<ID>();

            // ACT
            pMethod.Invoke(sut, new object[] { pElement, pRules, pToRemove, false });

            // ASSERT
            pToRemove.Should().BeEmpty();
        }

        [Fact]
        public void TryRemoveRendering_CatchesAndDoesNotThrow_OnNullElement()
        {
            // ARRANGE
            var sut = CreateSut();
            var pMethod = typeof(ApplyExperienceContextProviders).GetMethod(
                "TryRemoveRendering",
                BindingFlags.NonPublic | BindingFlags.Instance,
                null,
                new[] { typeof(List<XElement>), typeof(HashSet<ID>), typeof(bool) },
                null);

            var pList = new List<XElement> { null };
            var pToRemove = new HashSet<ID> { ID.NewID };

            // ACT
            var pException = Record.Exception(() => pMethod.Invoke(sut, new object[] { pList, pToRemove, false }));

            // ASSERT
            pException.Should().BeNull();
        }

        [Fact]
        public void TryRemoveRendering_DoesNotThrow_WhenNoElementsOrNoToRemove()
        {
            // ARRANGE
            var sut = CreateSut(out _);
            var pList = new List<XElement>();
            var pSet = new HashSet<ID>();
            var pMethod = typeof(ApplyExperienceContextProviders).GetMethod("TryRemoveRendering", BindingFlags.NonPublic | BindingFlags.Instance);

            // ACT
            var pException = Record.Exception(() => pMethod.Invoke(sut, new object[] { pList, pSet, false }));

            // ASSERT
            pException.Should().BeNull();
        }

        [Fact]
        public void TryRemoveRendering_RemovesMatchingNodes()
        {
            // ARRANGE
            var sut = CreateSut(out _);
            var pId = ID.NewID;
            var pLayout = new XElement(
                "root",
                new XElement(
                    "layout",
                    new XElement("rendering", new XAttribute("id", pId.ToString())),
                    new XElement("rendering", new XAttribute("id", ID.NewID.ToString()))));
            var pLayoutElement = pLayout.Elements().First();
            var pRenderingElements = pLayoutElement.Elements().ToList();
            var pSet = new HashSet<ID> { pId };
            var pMethod = typeof(ApplyExperienceContextProviders).GetMethod("TryRemoveRendering", BindingFlags.NonPublic | BindingFlags.Instance);

            // ACT
            pMethod.Invoke(sut, new object[] { pRenderingElements, pSet, false });

            // ASSERT
            pLayoutElement.Elements().Should().HaveCount(1);
            pLayoutElement.Elements().Should().NotContain(e => e.Attribute("id").Value == pId.ToString());
        }

        [Fact]
        public void TryRemoveRendering_LogsError_OnException()
        {
            // ARRANGE
            var pRepository = Substitute.For<IExperienceContextProviderRepository>();
            var pHttpAccessor = Substitute.For<IHttpContextAccessor>();
            var pScContext = Substitute.For<ISitecoreContextProvider>();
            var pLogger = Substitute.For<IPresentationLogger>();
            var sut = new ApplyExperienceContextProviders(pHttpAccessor, pScContext, pLogger, pRepository, Substitute.For<IRenderingReplacementService>());

            var pRenderingElements = new List<XElement> { null };
            var pIds = new HashSet<ID> { ID.NewID };

            var pMethod = typeof(ApplyExperienceContextProviders).GetMethod(
                "TryRemoveRendering",
                BindingFlags.NonPublic | BindingFlags.Instance,
                null,
                new[] { typeof(List<XElement>), typeof(HashSet<ID>), typeof(bool) },
                null);

            // ACT
            Action pAct = () => pMethod.Invoke(sut, new object[] { pRenderingElements, pIds, false });

            // ASSERT
            pAct.Should().NotThrow();
            pLogger.ReceivedWithAnyArgs(1).Error(default, default, default(object));
        }

        [Fact]
        public void ApplyPageRule_RemovesRenderings_WhenNotAllowedAndNoValidReplacement()
        {
            // ARRANGE
            var sut = CreateSut(out var pRepository);
            var pId = ID.NewID;
            var pLayout = new XElement(
                "root",
                new XElement(
                    "layout",
                    new XElement("rendering", new XAttribute("id", pId.ToString()))));

            var pMapping = new RenderingMapping(pId, ID.Null, null);
            var pPageRule = new ExperienceContextProviderPageRule(ID.Null, Enumerable.Empty<ID>(), new[] { pMapping });
            pRepository.GetActiveProviderPages(Arg.Any<string>(), Arg.Any<ID>()).Returns(new[] { pPageRule });

            var pMethod = typeof(ApplyExperienceContextProviders).GetMethod("ApplyPageRule", BindingFlags.NonPublic | BindingFlags.Instance);

            // ACT
            pMethod.Invoke(sut, new object[] { pLayout, new List<ExperienceContextProviderPageRule> { pPageRule }, null, null, false });

            // ASSERT
            var pLayoutElement = pLayout.Elements().First();
            pLayoutElement.Elements().Should().BeEmpty();
        }

        [Fact]
        public void ApplyPageRule_WithUidTargetedJustRemove_RemovesOnlyMatchingElements()
        {
            // ARRANGE
            var sut = CreateSut(out _);
            var pRenderingId = ID.NewID;
            var pUid1 = Guid.NewGuid();
            var pUid2 = Guid.NewGuid();
            var pUid3 = Guid.NewGuid();

            var pLayout = new XElement(
                "root",
                new XElement(
                    "layout",
                    new XElement("rendering", new XAttribute("id", pRenderingId.ToString()), new XAttribute("uid", pUid1.ToString("B").ToUpper())),
                    new XElement("rendering", new XAttribute("id", pRenderingId.ToString()), new XAttribute("uid", pUid2.ToString("B").ToUpper())),
                    new XElement("rendering", new XAttribute("id", pRenderingId.ToString()), new XAttribute("uid", pUid3.ToString("B").ToUpper()))));

            var pMappings = new[]
            {
                new RenderingMapping(pRenderingId, ID.Null, null, pUid1, isJustRemove: true),
                new RenderingMapping(pRenderingId, ID.Null, null, pUid3, isJustRemove: true),
            };
            var pPageRule = new ExperienceContextProviderPageRule(ID.Null, Enumerable.Empty<ID>(), pMappings);
            var pMethod = typeof(ApplyExperienceContextProviders).GetMethod("ApplyPageRule", BindingFlags.NonPublic | BindingFlags.Instance);

            // ACT
            pMethod.Invoke(sut, new object[] { pLayout, new List<ExperienceContextProviderPageRule> { pPageRule }, null, null, false });

            // ASSERT — only UID2 survives
            var pLayoutElement = pLayout.Elements().First();
            pLayoutElement.Elements().Should().HaveCount(1);
            pLayoutElement.Elements().Single().Attribute("uid")?.Value.Should().BeEquivalentTo(pUid2.ToString("B").ToUpper());
        }

        [Fact]
        public void ApplyPageRule_WithWildcardJustRemove_RemovesAllInstances()
        {
            // ARRANGE
            var sut = CreateSut(out _);
            var pRenderingId = ID.NewID;

            var pLayout = new XElement(
                "root",
                new XElement(
                    "layout",
                    new XElement("rendering", new XAttribute("id", pRenderingId.ToString()), new XAttribute("uid", Guid.NewGuid().ToString("B").ToUpper())),
                    new XElement("rendering", new XAttribute("id", pRenderingId.ToString()), new XAttribute("uid", Guid.NewGuid().ToString("B").ToUpper()))));

            var pMapping = new RenderingMapping(pRenderingId, ID.Null, null, Guid.Empty, isJustRemove: true);
            var pPageRule = new ExperienceContextProviderPageRule(ID.Null, Enumerable.Empty<ID>(), new[] { pMapping });
            var pMethod = typeof(ApplyExperienceContextProviders).GetMethod("ApplyPageRule", BindingFlags.NonPublic | BindingFlags.Instance);

            // ACT
            pMethod.Invoke(sut, new object[] { pLayout, new List<ExperienceContextProviderPageRule> { pPageRule }, null, null, false });

            // ASSERT — all instances removed
            pLayout.Elements().First().Elements().Should().BeEmpty();
        }

        [Fact]
        public void ApplyPageRule_WithUidTargetedJustRemove_KeepsNonTargetedUids()
        {
            // Regression: a UID-targeted JustRemove for UID1 must not affect elements with other UIDs
            // of the same rendering type. Previously, shouldRemove fired for every element whose
            // rendering type appeared in RenderingReplacements, even when no mapping matched.

            // ARRANGE
            var sut = CreateSut(out _);
            var pRenderingId = ID.NewID;
            var pUid1 = Guid.NewGuid();
            var pUid2 = Guid.NewGuid();

            var pLayout = new XElement(
                "root",
                new XElement(
                    "layout",
                    new XElement("rendering", new XAttribute("id", pRenderingId.ToString()), new XAttribute("uid", pUid1.ToString("B").ToUpper())),
                    new XElement("rendering", new XAttribute("id", pRenderingId.ToString()), new XAttribute("uid", pUid2.ToString("B").ToUpper()))));

            var pMapping = new RenderingMapping(pRenderingId, ID.Null, null, pUid1, isJustRemove: true);
            var pPageRule = new ExperienceContextProviderPageRule(ID.Null, Enumerable.Empty<ID>(), new[] { pMapping });
            var pMethod = typeof(ApplyExperienceContextProviders).GetMethod("ApplyPageRule", BindingFlags.NonPublic | BindingFlags.Instance);

            // ACT
            pMethod.Invoke(sut, new object[] { pLayout, new List<ExperienceContextProviderPageRule> { pPageRule }, null, null, false });

            // ASSERT — only UID1 removed; UID2 survives
            var pLayoutElement = pLayout.Elements().First();
            pLayoutElement.Elements().Should().HaveCount(1);
            pLayoutElement.Elements().Single().Attribute("uid")?.Value.Should().BeEquivalentTo(pUid2.ToString("B").ToUpper());
        }

        [Fact]
        public void Process_ReturnsEarly_WhenContextItemExistsAndQueryStringEmpty()
        {
            // ARRANGE
            var pItem = new FakeItem(ID.NewID).WithDisplayName("homepage").ToSitecoreItem();
            var sut = CreateSut(out _, out var pHttpAccessor, out _);
            var pResult = new XElement("root", new XElement("layout"));
            var args = new GetXmlBasedLayoutDefinitionArgs
            {
                Result = pResult,
                ContextItem = pItem
            };
            var pRequest = new HttpRequest(string.Empty, "http://localhost/", string.Empty);
            var pResponse = new HttpResponse(new StringWriter());
            pHttpAccessor.GetCurrent().Returns(new HttpContext(pRequest, pResponse));

            // ACT
            sut.Process(args);

            // ASSERT
            pResult.Elements().First().Name.LocalName.Should().Be("layout");
        }

        [Fact]
        public void Process_ReturnsEarly_WhenContextItemExistsAndNoActiveConfigurations()
        {
            // ARRANGE
            var pItem = new FakeItem(ID.NewID).WithDisplayName("homepage").ToSitecoreItem();
            var sut = CreateSut(out var pRepository, out var pHttpAccessor, out _);
            var pResult = new XElement("root", new XElement("layout"));
            var args = new GetXmlBasedLayoutDefinitionArgs
            {
                Result = pResult,
                ContextItem = pItem
            };
            var pRequest = new HttpRequest(string.Empty, "http://localhost/", "ecp=mycontext");
            var pResponse = new HttpResponse(new StringWriter());
            pHttpAccessor.GetCurrent().Returns(new HttpContext(pRequest, pResponse));
            pRepository.GetActiveProviderPages("mycontext", Arg.Any<ID>()).Returns(Array.Empty<ExperienceContextProviderPageRule>());

            // ACT
            sut.Process(args);

            // ASSERT
            pResult.Elements().First().Name.LocalName.Should().Be("layout");
        }

        [Fact]
        public void Process_RemovesAndKeepsRenderingsWithVerboseLogging_WhenActiveConfigurationsExist()
        {
            // ARRANGE
            var pItem = new FakeItem(ID.NewID).WithDisplayName("homepage").ToSitecoreItem();
            var sut = CreateSut(out var pRepository, out var pHttpAccessor, out _);
            var pIdRemove = ID.NewID;
            var pIdKeep = ID.NewID;
            var pLayout = new XElement(
                "root",
                new XElement(
                    "layout",
                    new XElement("rendering", new XAttribute("id", pIdRemove.ToString())),
                    new XElement("rendering", new XAttribute("id", pIdKeep.ToString()))));
            var args = new GetXmlBasedLayoutDefinitionArgs
            {
                Result = pLayout,
                ContextItem = pItem
            };
            var pRequest = new HttpRequest(string.Empty, "http://localhost/", "ecp=testprovider");
            var pResponse = new HttpResponse(new StringWriter());
            pHttpAccessor.GetCurrent().Returns(new HttpContext(pRequest, pResponse));

            var pMapping = new RenderingMapping(pIdRemove, ID.Null, null);
            var pRule = new ExperienceContextProviderPageRule(ID.Null, new[] { pIdKeep }, new[] { pMapping });
            pRepository.GetActiveProviderPages("testprovider", Arg.Any<ID>()).Returns(new[] { pRule });
            pRepository.IsVerboseLoggingEnabled().Returns(true);

            // ACT
            sut.Process(args);

            // ASSERT
            var pLayoutElement = pLayout.Elements().First();
            pLayoutElement.Elements().Should().HaveCount(1);
            pLayoutElement.Elements().First().Attribute("id")?.Value.Should().Be(pIdKeep.ToString());
        }

        [Fact]
        public void ApplyPageRule_ReturnsEarly_WhenAllRulesHaveEmptyReplacements()
        {
            // ARRANGE
            var sut = CreateSut(out _);

            // A rule constructed with null renderingReplacements → RenderingReplacements is empty dict → filtered out
            var pRuleNoReplacements = new ExperienceContextProviderPageRule(ID.Null, Enumerable.Empty<ID>(), null);

            var pLayout = new XElement("root", new XElement("layout", new XElement("rendering", new XAttribute("id", ID.NewID.ToString()))));
            var pMethod = typeof(ApplyExperienceContextProviders).GetMethod("ApplyPageRule", BindingFlags.NonPublic | BindingFlags.Instance);

            // ACT — all rules are filtered out because RenderingReplacements.Any() is false
            var pException = Record.Exception(() =>
                pMethod.Invoke(sut, new object[] { pLayout, new List<ExperienceContextProviderPageRule> { pRuleNoReplacements }, null, null, false }));

            // ASSERT — no exception; layout is untouched (rendering not removed)
            pException.Should().BeNull();
            pLayout.Elements().First().Elements().Should().HaveCount(1);
        }

        [Fact]
        public void ApplyPageRule_ReturnsEarly_WhenLayoutXmlHasNoChildElements()
        {
            // ARRANGE
            var sut = CreateSut(out _);

            // A valid rule with non-empty replacements so it passes the filter
            var pValidId = ID.NewID;
            var pValidMapping = new RenderingMapping(pValidId, ID.NewID, null);
            var pValidRule = new ExperienceContextProviderPageRule(ID.Null, Enumerable.Empty<ID>(), new[] { pValidMapping });

            // layoutXml with no child elements → Elements().FirstOrDefault() == null → early return at line 131
            var pEmptyLayout = new XElement("root");
            var pMethod = typeof(ApplyExperienceContextProviders).GetMethod("ApplyPageRule", BindingFlags.NonPublic | BindingFlags.Instance);

            // ACT
            var pException = Record.Exception(() =>
                pMethod.Invoke(sut, new object[] { pEmptyLayout, new List<ExperienceContextProviderPageRule> { pValidRule }, null, null, false }));

            // ASSERT — no exception; early return prevents any processing
            pException.Should().BeNull();
            pEmptyLayout.Elements().Should().BeEmpty();
        }

        private static ApplyExperienceContextProviders CreateSut(out IExperienceContextProviderRepository pRepository, out IHttpContextAccessor pHttpAccessor, out ISitecoreContextProvider pScContext)
        {
            pRepository = Substitute.For<IExperienceContextProviderRepository>();
            pHttpAccessor = Substitute.For<IHttpContextAccessor>();
            pScContext = Substitute.For<ISitecoreContextProvider>();
            var pLogger = Substitute.For<IPresentationLogger>();
            return new ApplyExperienceContextProviders(pHttpAccessor, pScContext, pLogger, pRepository, Substitute.For<IRenderingReplacementService>());
        }

        private static ApplyExperienceContextProviders CreateSut()
        {
            var pRepository = Substitute.For<IExperienceContextProviderRepository>();
            var pHttpAccessor = Substitute.For<IHttpContextAccessor>();
            var pScContext = Substitute.For<ISitecoreContextProvider>();
            var pLogger = Substitute.For<IPresentationLogger>();
            return new ApplyExperienceContextProviders(pHttpAccessor, pScContext, pLogger, pRepository, Substitute.For<IRenderingReplacementService>());
        }

        private static ApplyExperienceContextProviders CreateSut(out IExperienceContextProviderRepository pRepository)
        {
            pRepository = Substitute.For<IExperienceContextProviderRepository>();
            var pHttpAccessor = Substitute.For<IHttpContextAccessor>();
            var pScContextProvider = Substitute.For<ISitecoreContextProvider>();
            var pLogger = Substitute.For<IPresentationLogger>();
            return new ApplyExperienceContextProviders(pHttpAccessor, pScContextProvider, pLogger, pRepository, Substitute.For<IRenderingReplacementService>());
        }
    }
}

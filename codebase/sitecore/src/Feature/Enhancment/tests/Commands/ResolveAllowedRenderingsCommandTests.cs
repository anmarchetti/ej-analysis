using System;
using System.Collections.Generic;
using easyJet.Feature.SitecoreEnhancment.Commands;
using easyJet.Feature.SitecoreEnhancment.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using Xunit;
using PresentationConstants = easyJet.Foundation.Presentation.Constants;
using PresentationTemplates = easyJet.Foundation.Presentation.Templates;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Commands
{
    public class ResolveAllowedRenderingsCommandTests
    {
        private readonly IDatabaseProvider databaseProvider;
        private readonly ISheerUiService sheerUiService;
        private readonly IRenderingIdExtractionService renderingIdExtractionService;
        private readonly ISitecoreUIService sitecoreUiService;
        private readonly ResolveAllowedRenderingsCommandProxy sut;

        public ResolveAllowedRenderingsCommandTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            sheerUiService = Substitute.For<ISheerUiService>();
            renderingIdExtractionService = Substitute.For<IRenderingIdExtractionService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            renderingIdExtractionService.ExtractFromTemplateId(Arg.Any<ID>()).Returns(new HashSet<ID>());
            renderingIdExtractionService.ExtractFromItemId(Arg.Any<ID>()).Returns(new HashSet<ID>());
            sut = new ResolveAllowedRenderingsCommandProxy(
                databaseProvider,
                sheerUiService,
                sitecoreUiService,
                renderingIdExtractionService);
        }

        [Fact]
        public void QueryState_WhenContextHasNoItem_ShouldReturnHidden()
        {
            // ARRANGE
            var context = new CommandContext();

            // ACT
            var result = sut.QueryState(context);

            // ASSERT
            result.Should().Be(CommandState.Hidden);
        }

        [Fact]
        public void QueryState_WhenItemTemplateIsNotEcpPage_ShouldReturnHidden()
        {
            // ARRANGE
            var item = new FakeItem().ToSitecoreItem();
            var context = new CommandContext(item);

            // ACT
            var result = sut.QueryState(context);

            // ASSERT
            result.Should().Be(CommandState.Hidden);
        }

        [Fact]
        public void QueryState_WhenItemTemplateIsEcpPage_ShouldNotReturnHidden()
        {
            // ARRANGE
            var item = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPage)
                .ToSitecoreItem();
            var context = new CommandContext(item);

            // ACT
            var result = sut.QueryState(context);

            // ASSERT
            result.Should().NotBe(CommandState.Hidden);
        }

        [Fact]
        public void ExecuteJob_WhenIdParameterIsMissing_ShouldAlertSourceIdNotSet()
        {
            // ARRANGE
            var args = new ClientPipelineArgs();

            // ACT
            sut.CallExecuteJob(args);

            // ASSERT
            sheerUiService.Received(1).Alert(Arg.Is<string>(s => s.Contains("SourceId")));
        }

        [Fact]
        public void ExecuteJob_WhenPageFieldIsEmpty_ShouldAlertAndNotWriteAllowedRenderings()
        {
            // ARRANGE
            var item = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPage)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPage.Page, string.Empty)
                .ToSitecoreItem();
            databaseProvider.GetItem(item.ID, Arg.Any<Language>(), DatabaseType.Master).Returns(item);

            // ACT
            sut.CallExecuteJob(CreateArgs(item));

            // ASSERT
            sut.LastWrittenRenderingIds.Should().BeEmpty();
            sheerUiService.Received(1).Alert(Arg.Is<string>(s => s.Contains("Page")));
        }

        [Fact]
        public void ExecuteJob_WhenPageFieldIsNotValidId_ShouldAlertAndNotWriteAllowedRenderings()
        {
            // ARRANGE
            var item = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPage)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPage.Page, "not-a-guid")
                .ToSitecoreItem();
            databaseProvider.GetItem(item.ID, Arg.Any<Language>(), DatabaseType.Master).Returns(item);

            // ACT
            sut.CallExecuteJob(CreateArgs(item));

            // ASSERT
            sut.LastWrittenRenderingIds.Should().BeEmpty();
            sheerUiService.Received(1).Alert(Arg.Is<string>(s => s.Contains("valid item ID")));
        }

        [Fact]
        public void ExecuteJob_WhenPageFieldIsValidId_ShouldCallExtractFromItemIdWithPageItemId()
        {
            // ARRANGE
            var pageItemId = ID.NewID;
            var ecpItem = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPage)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPage.Page, pageItemId.ToString())
                .ToSitecoreItem();
            databaseProvider.GetItem(ecpItem.ID, Arg.Any<Language>(), DatabaseType.Master).Returns(ecpItem);

            // ACT
            sut.CallExecuteJob(CreateArgs(ecpItem));

            // ASSERT
            renderingIdExtractionService.Received(1).ExtractFromItemId(pageItemId);
        }

        [Fact]
        public void ExecuteJob_WhenRenderingsResolved_ShouldShowSuccessAlert()
        {
            // ARRANGE
            var pageItemId = ID.NewID;
            var pageItem = new FakeItem(pageItemId).ToSitecoreItem();
            var ecpItem = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPage)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPage.Page, pageItemId.ToString())
                .ToSitecoreItem();
            databaseProvider.GetItem(ecpItem.ID, Arg.Any<Language>(), DatabaseType.Master).Returns(ecpItem);
            databaseProvider.GetItem(pageItemId, DatabaseType.Master).Returns(pageItem);
            databaseProvider.GetItem(PresentationConstants.ItemIds.PageDesignsRoot, DatabaseType.Master).Returns((Item)null);

            // ACT
            sut.CallExecuteJob(CreateArgs(ecpItem));

            // ASSERT
            sheerUiService.Received(1).Alert(Arg.Is<string>(s => s.Contains("Resolved") && s.Contains("rendering")));
        }

        [Fact]
        public void ExecuteJob_WhenRenderingsResolved_ShouldSendItemLoadMessage()
        {
            // ARRANGE
            var pageItemId = ID.NewID;
            var pageItem = new FakeItem(pageItemId).ToSitecoreItem();
            var ecpItem = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPage)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPage.Page, pageItemId.ToString())
                .ToSitecoreItem();
            databaseProvider.GetItem(ecpItem.ID, Arg.Any<Language>(), DatabaseType.Master).Returns(ecpItem);
            databaseProvider.GetItem(pageItemId, DatabaseType.Master).Returns(pageItem);
            databaseProvider.GetItem(PresentationConstants.ItemIds.PageDesignsRoot, DatabaseType.Master).Returns((Item)null);

            // ACT
            sut.CallExecuteJob(CreateArgs(ecpItem));

            // ASSERT
            sitecoreUiService.Received(1).ClientPage_SendMessage(
                sut,
                Arg.Is<string>(s => s.Contains("item:load") && s.Contains(ecpItem.ID.ToString())));
        }

        [Fact]
        public void ExecuteJob_WhenItemNotFound_ShouldAlertAndNotSendMessage()
        {
            // ARRANGE
            var itemId = ID.NewID;
            databaseProvider.GetItem(itemId, Arg.Any<Language>(), DatabaseType.Master).Returns((Item)null);

            var args = new ClientPipelineArgs();
            args.Parameters["id"] = itemId.ToString();
            args.Parameters["language"] = "en";

            // ACT
            sut.CallExecuteJob(args);

            // ASSERT
            sheerUiService.Received(1).Alert(Arg.Is<string>(s => s.Contains("No context item")));
            sitecoreUiService.DidNotReceive().ClientPage_SendMessage(Arg.Any<object>(), Arg.Any<string>());
        }

        [Fact]
        public void ExecuteJob_WhenExtractionServiceReturnsEmptyForPageItem_ShouldWriteEmptyRenderings()
        {
            // ARRANGE
            var pageItemId = ID.NewID;
            var ecpItem = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPage)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPage.Page, pageItemId.ToString())
                .ToSitecoreItem();
            databaseProvider.GetItem(ecpItem.ID, Arg.Any<Language>(), DatabaseType.Master).Returns(ecpItem);

            // ACT
            sut.CallExecuteJob(CreateArgs(ecpItem));

            // ASSERT
            sut.LastWrittenRenderingIds.Should().BeEmpty();
        }

        [Fact]
        public void ExecuteJob_WhenPageItemFound_ShouldDelegateToExtractionService()
        {
            // ARRANGE
            var pageItemId = ID.NewID;
            var ecpItem = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPage)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPage.Page, pageItemId.ToString())
                .ToSitecoreItem();
            databaseProvider.GetItem(ecpItem.ID, Arg.Any<Language>(), DatabaseType.Master).Returns(ecpItem);

            // ACT
            sut.CallExecuteJob(CreateArgs(ecpItem));

            // ASSERT
            renderingIdExtractionService.Received(1).ExtractFromItemId(pageItemId);
        }

        [Fact]
        public void ExecuteJob_WhenExtractionServiceReturnsIds_ShouldWriteThem()
        {
            // ARRANGE
            var pageItemId = ID.NewID;
            var renderingId = ID.NewID;
            var ecpItem = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPage)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPage.Page, pageItemId.ToString())
                .ToSitecoreItem();
            databaseProvider.GetItem(ecpItem.ID, Arg.Any<Language>(), DatabaseType.Master).Returns(ecpItem);
            renderingIdExtractionService.ExtractFromItemId(Arg.Any<ID>()).Returns(new HashSet<ID> { renderingId });

            // ACT
            sut.CallExecuteJob(CreateArgs(ecpItem));

            // ASSERT
            sut.LastWrittenRenderingIds.Should().ContainSingle().Which.Should().Be(renderingId);
        }

        [Fact]
        public void ExecuteJob_WhenPageDesignDoesNotMatchTemplate_ShouldNotCallFieldUtils()
        {
            // ARRANGE
            var pageItemId = ID.NewID;
            var pageTemplateId = ID.NewID;
            var differentTemplateId = ID.NewID;
            var pageItem = new FakeItem(pageItemId)
                .WithTemplate(pageTemplateId)
                .ToSitecoreItem();
            var ecpItem = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPage)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPage.Page, pageItemId.ToString())
                .ToSitecoreItem();
            databaseProvider.GetItem(ecpItem.ID, Arg.Any<Language>(), DatabaseType.Master).Returns(ecpItem);
            databaseProvider.GetItem(pageItemId, DatabaseType.Master).Returns(pageItem);
            var pageDesignsRootFake = new FakeItem();
            var pageDesignFake = new FakeItem()
                .WithField(PresentationConstants.Fields.PageDesign.PageTemplatesFieldId, differentTemplateId.ToString())
                .WithParent(pageDesignsRootFake);
            var pageDesignsRoot = pageDesignsRootFake.ToSitecoreItem();
            _ = pageDesignFake.ToSitecoreItem();
            databaseProvider.GetItem(PresentationConstants.ItemIds.PageDesignsRoot, DatabaseType.Master).Returns(pageDesignsRoot);

            // ACT
            sut.CallExecuteJob(CreateArgs(ecpItem));

            // ASSERT
            renderingIdExtractionService.Received(1).ExtractFromItemId(pageItemId);
        }

        // ─── Template-based items (ExperienceContextProviderPageTemplate) ───
        [Fact]
        public void QueryState_WhenItemTemplateIsEcpPageTemplate_ShouldNotReturnHidden()
        {
            // ARRANGE
            var item = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPageTemplate)
                .ToSitecoreItem();
            var context = new CommandContext(item);

            // ACT
            var result = sut.QueryState(context);

            // ASSERT
            result.Should().NotBe(CommandState.Hidden);
        }

        [Fact]
        public void ExecuteJob_WhenPageTemplateItemHasEmptyPageTemplateField_ShouldAlert()
        {
            // ARRANGE
            var ecpItem = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPageTemplate)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPageTemplate.PageTemplate, string.Empty)
                .ToSitecoreItem();
            databaseProvider.GetItem(ecpItem.ID, Arg.Any<Language>(), DatabaseType.Master).Returns(ecpItem);

            // ACT
            sut.CallExecuteJob(CreateArgs(ecpItem));

            // ASSERT
            sheerUiService.Received(1).Alert(Arg.Is<string>(s => s.Contains("Page Template") && s.Contains("empty")));
            sut.LastWrittenTemplateRenderingIds.Should().BeNull();
        }

        [Fact]
        public void ExecuteJob_WhenPageTemplateItemHasInvalidPageTemplateField_ShouldAlert()
        {
            // ARRANGE
            var ecpItem = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPageTemplate)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPageTemplate.PageTemplate, "not-a-valid-id")
                .ToSitecoreItem();
            databaseProvider.GetItem(ecpItem.ID, Arg.Any<Language>(), DatabaseType.Master).Returns(ecpItem);

            // ACT
            sut.CallExecuteJob(CreateArgs(ecpItem));

            // ASSERT
            sheerUiService.Received(1).Alert(Arg.Is<string>(s => s.Contains("Page Template") && s.Contains("valid")));
            sut.LastWrittenTemplateRenderingIds.Should().BeNull();
        }

        [Fact]
        public void ExecuteJob_WhenPageTemplateItemIsValid_ShouldWriteToTemplateAllowedRenderings()
        {
            // ARRANGE
            var templateId = ID.NewID;
            var renderingId = ID.NewID;
            var ecpItem = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPageTemplate)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPageTemplate.PageTemplate, templateId.ToString())
                .ToSitecoreItem();
            databaseProvider.GetItem(ecpItem.ID, Arg.Any<Language>(), DatabaseType.Master).Returns(ecpItem);
            renderingIdExtractionService.ExtractFromTemplateId(Arg.Any<ID>()).Returns(new HashSet<ID> { renderingId });

            // ACT
            sut.CallExecuteJob(CreateArgs(ecpItem));

            // ASSERT
            sut.LastWrittenTemplateRenderingIds.Should().ContainSingle().Which.Should().Be(renderingId);
        }

        [Fact]
        public void ExecuteJob_WhenPageTemplateItemIsValid_ShouldShowSuccessAlert()
        {
            // ARRANGE
            var templateId = ID.NewID;
            var ecpItem = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPageTemplate)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPageTemplate.PageTemplate, templateId.ToString())
                .ToSitecoreItem();
            databaseProvider.GetItem(ecpItem.ID, Arg.Any<Language>(), DatabaseType.Master).Returns(ecpItem);
            databaseProvider.SelectItems(Arg.Any<string>(), DatabaseType.Master).Returns(System.Array.Empty<Item>());
            databaseProvider.GetItem(PresentationConstants.ItemIds.PageDesignsRoot, DatabaseType.Master).Returns((Item)null);

            // ACT
            sut.CallExecuteJob(CreateArgs(ecpItem));

            // ASSERT
            sheerUiService.Received(1).Alert(Arg.Is<string>(s => s.Contains("Resolved") && s.Contains("rendering")));
        }

        [Fact]
        public void ExecuteJob_WhenPageTemplateItemIsValid_ShouldSendItemLoadMessage()
        {
            // ARRANGE
            var templateId = ID.NewID;
            var ecpItem = new FakeItem()
                .WithTemplate(PresentationConstants.TemplateIds.ExperienceContextProviderPageTemplate)
                .WithField(PresentationConstants.Fields.ExperienceContextProviderPageTemplate.PageTemplate, templateId.ToString())
                .ToSitecoreItem();
            databaseProvider.GetItem(ecpItem.ID, Arg.Any<Language>(), DatabaseType.Master).Returns(ecpItem);
            databaseProvider.SelectItems(Arg.Any<string>(), DatabaseType.Master).Returns(System.Array.Empty<Item>());
            databaseProvider.GetItem(PresentationConstants.ItemIds.PageDesignsRoot, DatabaseType.Master).Returns((Item)null);

            // ACT
            sut.CallExecuteJob(CreateArgs(ecpItem));

            // ASSERT
            sitecoreUiService.Received(1).ClientPage_SendMessage(
                sut,
                Arg.Is<string>(s => s.Contains("item:load") && s.Contains(ecpItem.ID.ToString())));
        }

        [Fact]
        public void ExecuteJob_WhenLanguageParameterIsInvalid_ShouldAlertSourceLanguageNotSet()
        {
            // ARRANGE
            var args = new ClientPipelineArgs();
            args.Parameters["id"] = ID.NewID.ToString();

            // ACT
            sut.CallExecuteJob(args);

            // ASSERT
            sheerUiService.Received(1).Alert(Arg.Is<string>(s => s.Contains("SourceLanguage")));
        }

        private static ClientPipelineArgs CreateArgs(Item item)
        {
            var args = new ClientPipelineArgs();
            args.Parameters["id"] = item.ID.ToString();
            args.Parameters["language"] = item.Language?.Name ?? "en";
            return args;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("StyleCop.CSharp.OrderingRules", "SA1202", Justification = "Proxy class for testing.")]
        [System.Diagnostics.CodeAnalysis.SuppressMessage("StyleCop.CSharp.MaintainabilityRules", "SA1516", Justification = "Reviewed.")]
        private class ResolveAllowedRenderingsCommandProxy : ResolveAllowedRenderingsCommand
        {
            public HashSet<ID> LastWrittenRenderingIds { get; private set; } = new HashSet<ID>();
            public HashSet<ID> LastWrittenTemplateRenderingIds { get; private set; }

            public ResolveAllowedRenderingsCommandProxy(
                IDatabaseProvider pDatabaseProvider,
                ISheerUiService pSheerUiService,
                ISitecoreUIService pSitecoreUiService,
                IRenderingIdExtractionService pRenderingIdExtractionService)
                : base(pDatabaseProvider, pSheerUiService, pSitecoreUiService, pRenderingIdExtractionService)
            {
            }

            public void CallExecuteJob(ClientPipelineArgs args) => ExecuteJob(args);

            protected override void WriteAllowedRenderings(Item item, HashSet<ID> renderingIds, ID allowedRenderingsFieldId)
            {
                if (allowedRenderingsFieldId == PresentationConstants.Fields.ExperienceContextProviderPageTemplate.AllowedRenderings)
                {
                    LastWrittenTemplateRenderingIds = renderingIds;
                }
                else
                {
                    LastWrittenRenderingIds = renderingIds;
                }
            }
        }
    }
}
using System;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Web;
using System.Web.UI;
using easyJet.Feature.SitecoreEnhancment.CustomFields.FieldTypes;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Feature.SitecoreEnhancment.Services;
using easyJet.Feature.SitecoreEnhancment.Utils;
using easyJet.Foundation.Presentation.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Text;
using Sitecore.Web.UI.Sheer;
using Xunit;
using PresentationConstants = easyJet.Foundation.Presentation.Constants;

namespace easyJet.Feature.SitecoreEnhancment.Tests.CustomFields.FieldTypes
{
    public class RenderingMappingEditorTests
    {
        private readonly ISitecoreContextProvider contextProvider;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IRenderingMappingHtmlBuilder renderingMappingHtmlBuilder;
        private readonly IRenderingParameterEditorService renderingParameterEditorService;
        private readonly IHostingEnvironmentService hostingEnvironmentService;
        private readonly ISheerUiService sheerUiService;
        private readonly IHttpContextAccessor httpContextAccessor;

        public RenderingMappingEditorTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            renderingMappingHtmlBuilder = Substitute.For<IRenderingMappingHtmlBuilder>();
            renderingParameterEditorService = Substitute.For<IRenderingParameterEditorService>();
            hostingEnvironmentService = Substitute.For<IHostingEnvironmentService>();
            contextProvider = Substitute.For<ISitecoreContextProvider>();
            sheerUiService = Substitute.For<ISheerUiService>();
            httpContextAccessor = Substitute.For<IHttpContextAccessor>();
            httpContextAccessor.GetCurrent().Returns(_ => HttpContext.Current);
        }

        [Fact]
        public void EditParametersClick_WithValidMetadata_StartsClientPage()
        {
            // ARRANGE
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            var hiddenFieldId = "hid";
            var dropdownId = "drop";
            var hiddenFieldClientId = "hidClient";

            renderingParameterEditorService
                .ParseEditParametersMetadata(Arg.Any<string>())
                .Returns((hiddenFieldId, dropdownId, hiddenFieldClientId));

            var pipelineParams = new NameValueCollection { { "p", "v" } };
            renderingParameterEditorService
                .CreatePipelineParameters(hiddenFieldId, dropdownId, hiddenFieldClientId)
                .Returns(pipelineParams);

            // ACT
            sut.InvokeEditParametersClick("meta");

            // ASSERT
            contextProvider.Received()
                .StartClientPage(
                    sut,
                    "RunEditParametersPipeline",
                    Arg.Is<ClientPipelineArgs>(a => a.Parameters["p"] == "v"));
        }

        [Fact]
        public void SetModified_WhenTrackModifiedFalse_ShouldNotSetClientPage()
        {
            // ARRANGE
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            sut.TrackModified = false;
            var mi = typeof(RenderingMappingEditor).GetMethod("SetModified", BindingFlags.NonPublic | BindingFlags.Instance);

            // ACT
            mi.Invoke(sut, null);

            // ASSERT
            contextProvider.DidNotReceive().SetClientPageModified(Arg.Any<bool>());
        }

        [Fact]
        public void RunEditParametersPipeline_WhenRenderingIdParseFails_ShouldAlertAndReturn()
        {
            // ARRANGE
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            var args = new ClientPipelineArgs();
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldId] = "hid";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.DropdownId] = "drop";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldClientId] = "hidClient";

            renderingParameterEditorService
                .TryParseRenderingId(Arg.Any<string>(), out Arg.Any<ID>())
                .Returns(ci =>
                {
                    ci[1] = ID.NewID;
                    return false;
                });

            // ACT
            sut.InvokeRunEditParametersPipeline(args);

            // ASSERT
            sheerUiService.Received().Alert(Constants.RenderingMappingEditor.PleaseSelectRenderingText);
        }

        [Fact]
        public void LoadValue_ReadOnly_ShouldNotChangeValueOrSetModified()
        {
            // ARRANGE
            var sw = new StringWriter();
            HttpContext.Current = new HttpContext(new HttpRequest(string.Empty, "http://tempuri.org", string.Empty), new HttpResponse(sw));

            var baseId = "RM_Row0";
            var keyField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Key;
            var valueField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Value;
            var paramsField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Params;

            var form = new NameValueCollection();
            form.Add(keyField, "Key");
            form.Add(valueField, "Value");
            form.Add(paramsField, "p:1|two");
            SetRequestForm(form);

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService)
            {
                ID = "RM",
                ReadOnly = true,
                TrackModified = true
            };
            sut.SetValue(string.Empty);

            // ACT
            sut.InvokeLoadValue();

            // ASSERT
            sut.GetValue().Should().BeEmpty();
            contextProvider.DidNotReceive().SetClientPageModified(Arg.Any<bool>());
        }

        [Fact]
        public void LoadValue_WhenValueUnchanged_ShouldNotSetModified()
        {
            // ARRANGE
            var sw = new StringWriter();
            HttpContext.Current = new HttpContext(new HttpRequest(string.Empty, "http://tempuri.org", string.Empty), new HttpResponse(sw));

            var baseId = "RM_Row0";
            var keyField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Key;
            var valueField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Value;
            var paramsField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Params;

            var form = new NameValueCollection();
            form.Add(keyField, "K");
            form.Add(valueField, "V");
            form.Add(paramsField, "P");
            SetRequestForm(form);

            var expectedParams = RenderingMappingValueEscaper.EscapeValue("P");
            var existing = string.Format("{0}:{1}:{2}", "K", "V", expectedParams);

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService)
            {
                ID = "RM",
                TrackModified = true
            };
            sut.SetValue(existing);

            // ACT
            sut.InvokeLoadValue();

            // ASSERT
            sut.GetValue().Should().Be(existing);
            contextProvider.DidNotReceive().SetClientPageModified(Arg.Any<bool>());
        }

        [Fact]
        public void RunEditParametersPipeline_Postback_SetsHiddenFieldAttribute()
        {
            // Arrange
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            renderingParameterEditorService.Configure().TryParseRenderingId(Arg.Any<string>(), out Arg.Any<ID>()).ReturnsForAnyArgs(true);
            var args = new ClientPipelineArgs();
            args.IsPostBack = true;
            args.Result = "res";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldClientId] = "RM_Row0_Params";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldId] = "hid";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.DropdownId] = "dropDown";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.RenderingId] = ID.NewID.ToString();
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.UseBasicParams] = "false";

            renderingParameterEditorService.ProcessFieldEditorResult(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<bool>()).Returns("updated");

            // Act
            sut.InvokeRunEditParametersPipeline(args);

            // Assert
            sheerUiService.Received(1).SetAttribute("RM_Row0_Params", "value", "updated");
        }

        [Fact]
        public void RunEditParametersPipeline_Postback_WithUseBasicParamsTrue_SetsHiddenFieldAttribute()
        {
            // ARRANGE
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            renderingParameterEditorService.Configure().TryParseRenderingId(Arg.Any<string>(), out Arg.Any<ID>()).ReturnsForAnyArgs(true);
            var args = new ClientPipelineArgs
            {
                IsPostBack = true,
                Result = "res"
            };
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldClientId] = "RM_Row1_Params";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldId] = "hid1";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.DropdownId] = "drop1";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.RenderingId] = ID.NewID.ToString();
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.UseBasicParams] = "true";

            renderingParameterEditorService.ProcessFieldEditorResult(Arg.Any<string>(), Arg.Any<ID>(), true).Returns("basic-updated");

            // ACT
            sut.InvokeRunEditParametersPipeline(args);

            // ASSERT
            sheerUiService.Received(1).SetAttribute("RM_Row1_Params", "value", "basic-updated");
        }

        [Fact]
        public void RunEditParametersPipeline_Postback_WhenHiddenFieldClientIdMissing_FallsBackToHiddenFieldId()
        {
            // ARRANGE
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            renderingParameterEditorService.Configure().TryParseRenderingId(Arg.Any<string>(), out Arg.Any<ID>()).ReturnsForAnyArgs(true);
            var args = new ClientPipelineArgs
            {
                IsPostBack = true,
                Result = "res"
            };
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldClientId] = string.Empty; // simulate old metadata (no client id)
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldId] = "RM_OldRow_Params";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.DropdownId] = "drop2";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.RenderingId] = ID.NewID.ToString();
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.UseBasicParams] = "false";

            renderingParameterEditorService.ProcessFieldEditorResult(Arg.Any<string>(), Arg.Any<ID>(), false).Returns("updated-old");

            // ACT
            sut.InvokeRunEditParametersPipeline(args);

            // ASSERT
            sheerUiService.Received(1).SetAttribute("RM_OldRow_Params", "value", "updated-old");
        }

        [Fact]
        public void LoadValue_EscapedParameters_PopulatesValueAndSetsModified()
        {
            // Arrange
            var sw = new StringWriter();
            HttpContext.Current = new HttpContext(new HttpRequest(string.Empty, "http://tempuri.org", string.Empty), new HttpResponse(sw));

            var baseId = "RM_Row0";
            var keyField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Key;
            var valueField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Value;
            var paramsField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Params;

            var form = new NameValueCollection();
            form.Add(keyField, "Key:With:Colon");
            form.Add(valueField, "Val|With|Pipe");
            form.Add(paramsField, "p:1|two");
            SetRequestForm(form);

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            sut.ID = "RM";
            sut.TrackModified = true;

            // Act
            sut.InvokeLoadValue();

            // Assert - value should contain escaped parameters
            var expectedParams = RenderingMappingValueEscaper.EscapeValue("p:1|two");
            sut.GetValue().Should().Contain(expectedParams);
        }

        [Fact]
        public void LoadValue_IgnoresEmptyKeyAndValue()
        {
            var sw = new StringWriter();
            HttpContext.Current = new HttpContext(new HttpRequest(string.Empty, "http://tempuri.org", string.Empty), new HttpResponse(sw));

            var baseId = "RM_Row0";
            var keyField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Key;
            var valueField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Value;
            var paramsField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Params;

            var form = new NameValueCollection();
            form.Add(keyField, string.Empty);
            form.Add(valueField, string.Empty);
            form.Add(paramsField, string.Empty);
            SetRequestForm(form);

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            sut.ID = "RM";
            sut.SetValue(string.Empty);

            sut.InvokeLoadValue();

            sut.GetValue().Should().BeEmpty();
        }

        [Fact]
        public void BuildControl_WithMultipleMappings_CreatesRows()
        {
            // Arrange
            renderingMappingHtmlBuilder.BuildHeaderHtml(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>()).Returns("<header/>");
            renderingMappingHtmlBuilder.BuildRowContext(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<RenderingColumnConfig>(), Arg.Any<RenderingColumnConfig>())
                .Returns(ci => new RenderingMappingRowContext());
            renderingMappingHtmlBuilder.BuildRowHtml(Arg.Any<RenderingMappingRowContext>()).Returns("<row/>");

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService)
            {
                ID = "RM"
            };

            sut.SetValue("{K1}:{V1}:P1|{K2}:{V2}:P2");

            // Act
            sut.InvokeBuildControl();

            // Assert
            sut.Controls.OfType<LiteralControl>().Should().NotBeEmpty();
        }

        [Fact]
        public void BuildControl_WithEmptyValue_AddsHeaderAndRowControls()
        {
            // Arrange
            contextProvider.GetClientEvent(Arg.Any<string>()).Returns("testEvent");
            var sut = new RenderingMappingEditorProxy(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            sut.Value = string.Empty;
            sut.ID = "testId";
            renderingMappingHtmlBuilder.BuildHeaderHtml(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>()).Returns("<header>");
            renderingMappingHtmlBuilder.BuildRowHtml(Arg.Any<RenderingMappingRowContext>()).Returns("<row>");

            // Act
            sut.InvokeBuildControl();

            // Assert
            sut.Controls.Count.Should().BeGreaterThan(0);
            renderingMappingHtmlBuilder.Received().BuildHeaderHtml(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>());
            renderingMappingHtmlBuilder.Received().BuildRowHtml(Arg.Any<RenderingMappingRowContext>());
        }

        [Fact]
        public void RunEditParametersPipeline_NonPostback_CallsGetFieldEditorUrlOptions()
        {
            // Arrange
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            var args = new ClientPipelineArgs();
            args.IsPostBack = false;
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.DropdownId] = "dropdown";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.RenderingId] = ID.NewID.ToString();
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldId] = "hid";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldClientId] = "hidClient";

            renderingParameterEditorService.GetFieldEditorUrlOptions(Arg.Any<ID>(), Arg.Any<string>()).Returns(new FieldEditorUrlOptions { Url = new UrlString("http://x"), UseBasicParams = true, Width = "100", Height = "100", Header = "h" });
            renderingParameterEditorService.TryParseRenderingId(Arg.Any<string>(), out Arg.Any<ID>())
                .Returns(ci =>
                {
                    ci[1] = ID.NewID;
                    return true;
                });

            // Act
            sut.InvokeRunEditParametersPipeline(args);

            // Assert
            renderingParameterEditorService.Received().GetFieldEditorUrlOptions(Arg.Any<ID>(), Arg.Any<string>());
        }

        // ============================================================
        // Bug fix: RunEditParametersPipeline postback path
        // Previously the form was read BEFORE the IsPostBack check,
        // causing form[dropdownId] == "" on Sheer postback → Alert fired
        // and ProcessFieldEditorPostBack was never called.
        // ============================================================
        [Fact]
        public void RunEditParametersPipeline_OnPostback_DoesNotCallAlert_WhenFormDropdownIsEmpty()
        {
            // ARRANGE
            // On a Sheer postback the form does NOT contain the CE Value dropdown —
            // the old code read form[dropdownId] here and called Alert when it was empty.
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            var args = new ClientPipelineArgs();
            args.IsPostBack = true;
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldId] = "hid";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.DropdownId] = "drop";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldClientId] = "hidClient";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.RenderingId] = ID.NewID.ToString();
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.UseBasicParams] = "false";
            args.Result = string.Empty;

            // ACT
            sut.InvokeRunEditParametersPipeline(args);

            // ASSERT — Alert must NOT be called (the form-read + Alert guard only applies to initial call)
            sheerUiService.DidNotReceive().Alert(Arg.Any<string>());
        }

        [Fact]
        public void RunEditParametersPipeline_OnPostback_WithResult_CallsProcessFieldEditorResultAndSetAttribute()
        {
            // ARRANGE
            var renderingId = ID.NewID;
            var hiddenClientId = "hid_client";
            var updatedParams = "Placeholder=TestPlaceholder&DataSource=TestDs";

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            var args = new ClientPipelineArgs();
            args.IsPostBack = true;
            args.Result = "dialog-result-handle";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldId] = "hid";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.DropdownId] = "drop";
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldClientId] = hiddenClientId;
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.RenderingId] = renderingId.ToString();
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.UseBasicParams] = "false";

            renderingParameterEditorService
                .ProcessFieldEditorResult(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<bool>())
                .Returns(updatedParams);

            // ACT
            sut.InvokeRunEditParametersPipeline(args);

            // ASSERT — ProcessFieldEditorResult is called and SetAttribute updates the hidden field
            renderingParameterEditorService.Received(1)
                .ProcessFieldEditorResult("dialog-result-handle", Arg.Any<ID>(), false);
            sheerUiService.Received(1)
                .SetAttribute(hiddenClientId, "value", updatedParams);
            sheerUiService.Received(1)
                .Eval(Arg.Is<string>(s => s.Contains("scRmUpdateParamsDetails")));
        }

        [Fact]
        public void DoRender_WithIdAndChildren_WritesDivWithContent()
        {
            // Arrange
            var sut = new RenderingMappingEditorProxy(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            sut.ID = "testId";
            sut.Controls.Add(new LiteralControl("<span>child</span>"));
            var output = new StringWriter();
            var writer = new HtmlTextWriter(output);

            // Act
            sut.InvokeDoRender(writer);

            // Assert
            var result = output.ToString();
            result.Should().Contain("<div");
            result.Should().Contain("</div>");
            result.Should().Contain("child");
        }

        [Fact]
        public void SetModified_RespectTrackModified()
        {
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            sut.TrackModified = true;
            var mi = typeof(RenderingMappingEditor).GetMethod("SetModified", BindingFlags.NonPublic | BindingFlags.Instance);
            mi.Invoke(sut, null);
            contextProvider.Received().SetClientPageModified(true);
        }

        [Fact]
        public void EnsureClientScripts_WhenCssAndJsExist_AddsControls()
        {
            // Arrange
            hostingEnvironmentService.MapPath(Arg.Any<string>()).Returns(ci => "C:/fake" + ci.Arg<string>());
            hostingEnvironmentService.FileExists(Arg.Any<string>()).Returns(true);

            var sut = new RenderingMappingEditorProxy(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // Act
            var mi = typeof(RenderingMappingEditor).GetMethod("EnsureClientScripts", BindingFlags.NonPublic | BindingFlags.Instance);
            mi.Invoke(sut, Array.Empty<object>());

            // Assert
            var literals = sut.Controls.OfType<LiteralControl>().ToList();
            literals.Should().ContainSingle(l => l.Text.Contains("<link") && l.Text.Contains(".css"));
            literals.Should().ContainSingle(l => l.Text.Contains("<script") && l.Text.Contains("<!--RenderingMappingEditor.js-->"));
        }

        [Fact]
        public void EnsureClientScripts_WhenJsReadFails_FallsBackToSrcTag()
        {
            // Arrange
            hostingEnvironmentService.MapPath(Arg.Any<string>()).Returns(ci => "C:/fake" + ci.Arg<string>());
            hostingEnvironmentService.FileExists(Arg.Any<string>()).Returns(true);
            hostingEnvironmentService.ReadAllText(Arg.Any<string>()).Returns(ci => { throw new Exception("fail"); });

            var sut = new RenderingMappingEditorProxy(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            var mi = typeof(RenderingMappingEditor).GetMethod("EnsureClientScripts", BindingFlags.NonPublic | BindingFlags.Instance);
            mi.Invoke(sut, Array.Empty<object>());

            var literals = sut.Controls.OfType<LiteralControl>().ToList();
            literals.Should().ContainSingle(l => l.Text.Contains("<script") && l.Text.Contains("src=\""));
        }

        [Fact]
        public void EnsureClientScripts_WhenResourcesMissing_AddsNothing()
        {
            hostingEnvironmentService.MapPath(Arg.Any<string>()).Returns((string)null);
            hostingEnvironmentService.FileExists(Arg.Any<string>()).Returns(false);

            var sut = new RenderingMappingEditorProxy(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            var mi = typeof(RenderingMappingEditor).GetMethod("EnsureClientScripts", BindingFlags.NonPublic | BindingFlags.Instance);
            mi.Invoke(sut, Array.Empty<object>());

            sut.Controls.Should().BeEmpty();
        }

        [Fact]
        public void AddLiteralIfMissing_WhenTargetIsNull_ShouldNotThrow()
        {
            // ARRANGE
            var method = typeof(RenderingMappingEditor).GetMethod("AddLiteralIfMissing", BindingFlags.NonPublic | BindingFlags.Static);

            // ACT / ASSERT
            Action act = () => method.Invoke(null, new object[] { null, "m", "<x/>" });
            act.Should().NotThrow();
        }

        [Fact]
        public void BuildControl_SetsLastRowServerProperty()
        {
            // ARRANGE
            renderingMappingHtmlBuilder.BuildHeaderHtml(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>()).Returns("<header/>");
            renderingMappingHtmlBuilder.BuildRowContext(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<RenderingColumnConfig>(), Arg.Any<RenderingColumnConfig>())
                .Returns(_ => new RenderingMappingRowContext());
            renderingMappingHtmlBuilder.BuildRowHtml(Arg.Any<RenderingMappingRowContext>()).Returns("<row/>");

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService)
            {
                ID = "RM"
            };

            // ACT
            sut.InvokeBuildControl();

            // ASSERT
            contextProvider.Received().SetServerProperty(Arg.Is<string>(s => s.EndsWith("_LastRowID")), Arg.Any<string>());
        }

        [Fact]
        public void AddLiteralIfMissing_WhenTargetIsNull_DoesNotThrow()
        {
            // Arrange
            var panel = new Control();
            var method = typeof(RenderingMappingEditor).GetMethod("AddLiteralIfMissing", BindingFlags.NonPublic | BindingFlags.Static);

            // Act
            method.Invoke(null, new object[] { panel, "m1", "<script/>" });
            method.Invoke(null, new object[] { panel, "m1", "<script/>" });

            // Assert
            var literals = panel.Controls.OfType<LiteralControl>().ToList();
            literals.Count.Should().Be(1);
            literals[0].Text.Should().Contain("<script/>");
        }

        [Fact]
        public void ExtractParam_WhenNotPresent_ReturnsDefault()
        {
            // Arrange
            var sut = new RenderingMappingEditorProxy();
            var method = typeof(RenderingMappingEditor).GetMethod("ExtractParam", BindingFlags.NonPublic | BindingFlags.Instance);

            // Act
            var result = (string)method.Invoke(sut, new object[] { "LabelKey" });

            // Assert
            result.Should().Be("Rendering to be replace");
        }

        [Fact]
        public void RunEditParametersPipeline_WithValidArgs_DoesNotThrow()
        {
            // Arrange
            var args = new ClientPipelineArgs();
            args.Parameters["selected"] = "test:value";
            args.Parameters["controlid"] = "testControl";

            var sut = new RenderingMappingEditorProxy(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // Act / Assert
            Action act = () => sut.InvokeRunEditParametersPipeline(args);
            act.Should().NotThrow();
        }

        [Fact]
        public void BuildControl_WithSingleMapping_AddsHeaderAndTwoRows()
        {
            // Arrange
            hostingEnvironmentService.MapPath(Arg.Any<string>()).Returns((string)null);
            hostingEnvironmentService.FileExists(Arg.Any<string>()).Returns(false);

            contextProvider.GetClientEvent(Arg.Any<string>()).Returns("javascript:test");

            renderingMappingHtmlBuilder.BuildHeaderHtml(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>()).Returns("<header/>");
            renderingMappingHtmlBuilder.BuildRowContext(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<RenderingColumnConfig>(), Arg.Any<RenderingColumnConfig>())
                .Returns(ci => new RenderingMappingRowContext());
            renderingMappingHtmlBuilder.BuildRowHtml(Arg.Any<RenderingMappingRowContext>())
                .Returns(ci => "<row/>");

            var sut = new RenderingMappingEditorProxy(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService)
            {
                ID = "RM"
            };

            sut.SetValue("{K}:{V}:Placeholder=Main");

            // Act
            var mi = typeof(RenderingMappingEditor).GetMethod("BuildControl", BindingFlags.NonPublic | BindingFlags.Instance);
            mi.Invoke(sut, Array.Empty<object>());

            // Assert
            var html = string.Concat(sut.Controls.OfType<LiteralControl>().Select(l => l.Text));
            html.Should().Contain("<header/");
            html.Should().Contain("<row/");
            sut.Controls.OfType<LiteralControl>().Count().Should().BeGreaterOrEqualTo(2);
            renderingMappingHtmlBuilder.Received().BuildHeaderHtml(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>());
            renderingMappingHtmlBuilder.Received(2).BuildRowHtml(Arg.Any<RenderingMappingRowContext>());
        }

        // ============================================================
        // AutoRefreshUidDropdowns — success paths
        // ============================================================
        [Fact]
        public void AutoRefreshUidDropdowns_WhenPageFieldHasId_DispatchesToRefreshUidDropdowns()
        {
            // ARRANGE
            var ecrItemId = ID.NewID;
            var pageRefId = ID.NewID;
            var db = Substitute.For<Sitecore.Data.Database>();
            databaseProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var ecrItem = Substitute.For<Item>(ecrItemId, ItemData.Empty, db);
            db.GetItem(ecrItemId).Returns(ecrItem);
            ecrItem[PresentationConstants.Fields.ExperienceContextProviderPage.Page].Returns(pageRefId.ToString());

            var refItem = Substitute.For<Item>(pageRefId, ItemData.Empty, db);
            db.GetItem(pageRefId).Returns(refItem);
            refItem.TemplateName.Returns("Page");
            refItem.Paths.Returns((ItemPath)null);
            refItem.TemplateID.Returns(ID.Null);

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            sut.InvokeAutoRefreshUidDropdowns(ecrItemId.ToString());

            // ASSERT
            sheerUiService.Received().Eval(Arg.Is<string>(s => s.Contains("scRmRefreshUidDropdowns")));
        }

        [Fact]
        public void AutoRefreshUidDropdowns_WhenTemplateFieldHasId_DispatchesToRefreshUidDropdowns()
        {
            // ARRANGE
            var ecrItemId = ID.NewID;
            var templateRefId = ID.NewID;
            var db = Substitute.For<Sitecore.Data.Database>();
            databaseProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var ecrItem = Substitute.For<Item>(ecrItemId, ItemData.Empty, db);
            db.GetItem(ecrItemId).Returns(ecrItem);
            ecrItem[PresentationConstants.Fields.ExperienceContextProviderPage.Page].Returns(string.Empty);
            ecrItem[PresentationConstants.Fields.ExperienceContextProviderPageTemplate.PageTemplate].Returns(templateRefId.ToString());

            var refItem = Substitute.For<Item>(templateRefId, ItemData.Empty, db);
            db.GetItem(templateRefId).Returns(refItem);
            refItem.TemplateName.Returns("PageTemplate");
            refItem.Paths.Returns((ItemPath)null);

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            sut.InvokeAutoRefreshUidDropdowns(ecrItemId.ToString());

            // ASSERT
            sheerUiService.Received().Eval(Arg.Is<string>(s => s.Contains("scRmRefreshUidDropdowns")));
        }

        [Fact]
        public void AutoRefreshUidDropdowns_WhenNeitherFieldHasId_DoesNotCallSheerUi()
        {
            // ARRANGE
            var ecrItemId = ID.NewID;
            var db = Substitute.For<Sitecore.Data.Database>();
            databaseProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var ecrItem = Substitute.For<Item>(ecrItemId, ItemData.Empty, db);
            db.GetItem(ecrItemId).Returns(ecrItem);
            ecrItem[PresentationConstants.Fields.ExperienceContextProviderPage.Page].Returns("not-a-guid");
            ecrItem[PresentationConstants.Fields.ExperienceContextProviderPageTemplate.PageTemplate].Returns(string.Empty);

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            sut.InvokeAutoRefreshUidDropdowns(ecrItemId.ToString());

            // ASSERT
            sheerUiService.DidNotReceive().Eval(Arg.Any<string>());
        }

        // ============================================================
        // RefreshUidDropdowns — success path (JSON build + Eval)
        // ============================================================
        [Fact]
        public void RefreshUidDropdowns_WhenPageItem_BuildsJsonAndCallsEval()
        {
            // ARRANGE
            var pageId = ID.NewID;
            var db = Substitute.For<Sitecore.Data.Database>();
            databaseProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var pageItem = Substitute.For<Item>(pageId, ItemData.Empty, db);
            db.GetItem(pageId).Returns(pageItem);
            pageItem.TemplateName.Returns("ContentPage");
            pageItem.Paths.Returns((ItemPath)null);
            pageItem.TemplateID.Returns(ID.Null);

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            sut.InvokeRefreshUidDropdowns(pageId.ToString());

            // ASSERT
            sheerUiService.Received().Eval(Arg.Is<string>(s => s.Contains("scRmRefreshUidDropdowns") && s.Contains("[]")));
        }

        [Fact]
        public void RefreshUidDropdowns_WhenTemplateItem_BuildsJsonAndCallsEval()
        {
            // ARRANGE
            var templateId = ID.NewID;
            var db = Substitute.For<Sitecore.Data.Database>();
            databaseProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var templateItem = Substitute.For<Item>(templateId, ItemData.Empty, db);
            db.GetItem(templateId).Returns(templateItem);
            templateItem.TemplateName.Returns("ArticleTemplate");
            templateItem.Paths.Returns((ItemPath)null);

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            sut.InvokeRefreshUidDropdowns(templateId.ToString());

            // ASSERT
            sheerUiService.Received().Eval(Arg.Is<string>(s => s.Contains("scRmRefreshUidDropdowns")));
        }

        // ============================================================
        // BuildUidDropdownHtml tests (private, via reflection)
        // ============================================================
        [Fact]
        public void BuildUidDropdownHtml_WithNoOptions_ReturnsSelectWithDefaultOption()
        {
            // ARRANGE
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            var result = sut.InvokeBuildUidDropdownHtml("ctrl1", string.Empty, null);

            // ASSERT
            result.Should().Contain("<select");
            result.Should().Contain("</select>");
            result.Should().Contain("-- Any instance --");
            result.Should().Contain("selected=\"selected\"");
        }

        [Fact]
        public void BuildUidDropdownHtml_WithOptions_RendersOptionsAndSelects()
        {
            // ARRANGE
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            var options = new System.Collections.Generic.List<(string uid, string label, string renderingId)>
            {
                ("{UID-1}", "Rendering A", string.Empty),
                ("{UID-2}", "Rendering B", string.Empty)
            };

            // ACT
            var result = sut.InvokeBuildUidDropdownHtml("ctrl2", "{UID-2}", options);

            // ASSERT
            result.Should().Contain("{UID-1}");
            result.Should().Contain("Rendering A");
            result.Should().Contain("{UID-2}");
            result.Should().Contain("Rendering B");
        }

        [Fact]
        public void BuildUidDropdownHtml_WhenSelectedNotInOptions_AddsExtraSelectedOption()
        {
            // ARRANGE
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            var options = new System.Collections.Generic.List<(string uid, string label, string renderingId)>
            {
                ("{UID-1}", "Rendering A", string.Empty)
            };

            // ACT
            var result = sut.InvokeBuildUidDropdownHtml("ctrl3", "{MISSING-UID}", options);

            // ASSERT
            result.Should().Contain("{MISSING-UID}");
            result.Should().Contain("selected=\"selected\"");
        }

        // ============================================================
        // LoadValue with UID tests
        // ============================================================
        [Fact]
        public void LoadValue_WithUidField_IncludesUidInValue()
        {
            // ARRANGE
            var sw = new StringWriter();
            HttpContext.Current = new HttpContext(new HttpRequest(string.Empty, "http://tempuri.org", string.Empty), new HttpResponse(sw));

            var baseId = "RM_Row0";
            var keyField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Key;
            var valueField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Value;
            var paramsField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Params;
            var uidField = baseId + Constants.RenderingMappingEditor.ControlSuffixes.Uid;

            var form = new NameValueCollection();
            form.Add(keyField, "{K1}");
            form.Add(valueField, "{V1}");
            form.Add(paramsField, "Placeholder=Main");
            form.Add(uidField, "{UID-123}");
            SetRequestForm(form);

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService)
            {
                ID = "RM",
                TrackModified = true
            };
            sut.SetValue(string.Empty);

            // ACT
            sut.InvokeLoadValue();

            // ASSERT
            sut.GetValue().Should().Contain("{UID-123}");
            sut.GetValue().Split(':').Length.Should().Be(4);
        }

        [Fact]
        public void LoadValue_MultipleRowsWithUid_SeparatedByPipe()
        {
            // ARRANGE
            var sw = new StringWriter();
            HttpContext.Current = new HttpContext(new HttpRequest(string.Empty, "http://tempuri.org", string.Empty), new HttpResponse(sw));

            var form = new NameValueCollection();
            for (var i = 0; i < 2; i++)
            {
                var baseId = $"RM_Row{i}";
                form.Add(baseId + Constants.RenderingMappingEditor.ControlSuffixes.Key, $"{{K{i}}}");
                form.Add(baseId + Constants.RenderingMappingEditor.ControlSuffixes.Value, $"{{V{i}}}");
                form.Add(baseId + Constants.RenderingMappingEditor.ControlSuffixes.Params, $"P{i}");
                form.Add(baseId + Constants.RenderingMappingEditor.ControlSuffixes.Uid, $"{{UID-{i}}}");
            }

            SetRequestForm(form);

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService)
            {
                ID = "RM",
                TrackModified = true
            };
            sut.SetValue(string.Empty);

            // ACT
            sut.InvokeLoadValue();

            // ASSERT
            var entries = sut.GetValue().Split('|');
            entries.Should().HaveCount(2);
            entries[0].Should().Contain("{UID-0}");
            entries[1].Should().Contain("{UID-1}");
        }

        [Fact]
        public void LoadValue_WhenUidEmpty_ExcludesFromValue()
        {
            // ARRANGE
            var sw = new StringWriter();
            HttpContext.Current = new HttpContext(new HttpRequest(string.Empty, "http://tempuri.org", string.Empty), new HttpResponse(sw));

            var baseId = "RM_Row0";
            var form = new NameValueCollection();
            form.Add(baseId + Constants.RenderingMappingEditor.ControlSuffixes.Key, "{K1}");
            form.Add(baseId + Constants.RenderingMappingEditor.ControlSuffixes.Value, "{V1}");
            form.Add(baseId + Constants.RenderingMappingEditor.ControlSuffixes.Params, "P1");
            form.Add(baseId + Constants.RenderingMappingEditor.ControlSuffixes.Uid, string.Empty);
            SetRequestForm(form);

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService)
            {
                ID = "RM",
                TrackModified = true
            };
            sut.SetValue(string.Empty);

            // ACT
            sut.InvokeLoadValue();

            // ASSERT
            sut.GetValue().Split(':').Length.Should().Be(3);
        }

        // ============================================================
        // ExtractParam with custom Source
        // ============================================================
        [Fact]
        public void ExtractParam_WithCustomSource_ReturnsExtractedValue()
        {
            // ARRANGE
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);
            sut.Source = "LabelKey=CustomKey&LabelValue=CustomValue&LabelUid=CustomUid";

            // ACT
            var result = sut.InvokeExtractParam("LabelKey");

            // ASSERT
            result.Should().Be("CustomKey");
        }

        // ============================================================
        // RefreshUidDropdowns tests
        // ============================================================
        [Fact]
        public void RefreshUidDropdowns_WhenIdIsNull_DoesNotCallSheerUi()
        {
            // ARRANGE
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            sut.InvokeRefreshUidDropdowns(null);

            // ASSERT
            sheerUiService.DidNotReceive().Eval(Arg.Any<string>());
        }

        [Fact]
        public void RefreshUidDropdowns_WhenIdIsNotValidGuid_DoesNotCallSheerUi()
        {
            // ARRANGE
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            sut.InvokeRefreshUidDropdowns("not-a-guid");

            // ASSERT
            sheerUiService.DidNotReceive().Eval(Arg.Any<string>());
        }

        [Fact]
        public void RefreshUidDropdowns_WhenDatabaseIsNull_DoesNotCallSheerUi()
        {
            // ARRANGE
            databaseProvider.GetDatabase(DatabaseType.Master).Returns((Sitecore.Data.Database)null);
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            sut.InvokeRefreshUidDropdowns(ID.NewID.ToString());

            // ASSERT
            sheerUiService.DidNotReceive().Eval(Arg.Any<string>());
        }

        [Fact]
        public void RefreshUidDropdowns_WhenItemNotFound_DoesNotCallSheerUi()
        {
            // ARRANGE
            var db = Substitute.For<Sitecore.Data.Database>();
            databaseProvider.GetDatabase(DatabaseType.Master).Returns(db);
            db.GetItem(Arg.Any<ID>()).Returns((Item)null);
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            sut.InvokeRefreshUidDropdowns(ID.NewID.ToString());

            // ASSERT
            sheerUiService.DidNotReceive().Eval(Arg.Any<string>());
        }

        private class TestEditor : RenderingMappingEditor
        {
            public TestEditor(RenderingMappingEditorDependencies deps)
                : base(deps)
            {
            }

            public TestEditor()
                : base(new RenderingMappingEditorDependencies
                {
                    DatabaseProvider = Substitute.For<IDatabaseProvider>(),
                    HtmlBuilder = Substitute.For<IRenderingMappingHtmlBuilder>(),
                    ParameterEditorService = Substitute.For<IRenderingParameterEditorService>(),
                    ContextProvider = Substitute.For<ISitecoreContextProvider>(),
                    SheerUiService = Substitute.For<ISheerUiService>(),
                    HttpContextAccessor = Substitute.For<IHttpContextAccessor>(),
                    HostingEnvironmentService = Substitute.For<IHostingEnvironmentService>(),
                    Logger = Substitute.For<IRenderingMappingLogger>(),
                    RenderingIdExtractionService = Substitute.For<IRenderingIdExtractionService>()
                })
            {
            }

            public TestEditor(IDatabaseProvider db, IRenderingMappingHtmlBuilder hb, IRenderingParameterEditorService pe, ISitecoreContextProvider contextProvider, ISheerUiService sheerUiService, IHttpContextAccessor httpContextAccessor, IHostingEnvironmentService hostingEnvironmentService)
                : base(new RenderingMappingEditorDependencies
                {
                    DatabaseProvider = db,
                    HtmlBuilder = hb,
                    ParameterEditorService = pe,
                    ContextProvider = contextProvider,
                    SheerUiService = sheerUiService,
                    HttpContextAccessor = httpContextAccessor,
                    HostingEnvironmentService = hostingEnvironmentService,
                    Logger = Substitute.For<IRenderingMappingLogger>(),
                    RenderingIdExtractionService = Substitute.For<IRenderingIdExtractionService>()
                })
            {
            }

            public void InvokeLoadValue()
            {
                var mi = typeof(RenderingMappingEditor).GetMethod("LoadValue", BindingFlags.NonPublic | BindingFlags.Instance);
                mi.Invoke(this, null);
            }

            public void InvokeRunEditParametersPipeline(ClientPipelineArgs args)
            {
                var mi = typeof(RenderingMappingEditor).GetMethod("RunEditParametersPipeline", BindingFlags.NonPublic | BindingFlags.Instance);
                mi.Invoke(this, new object[] { args });
            }

            public void InvokeBuildControl()
            {
                var mi = typeof(RenderingMappingEditor).GetMethod("BuildControl", BindingFlags.NonPublic | BindingFlags.Instance);
                mi.Invoke(this, null);
            }

            public void InvokeEditParametersClick(string metadata)
            {
                var mi = typeof(RenderingMappingEditor).GetMethod("EditParametersClick", BindingFlags.NonPublic | BindingFlags.Instance);
                mi.Invoke(this, new object[] { metadata });
            }

            public void InvokeRefreshUidDropdowns(string pageOrTemplateId)
            {
                var mi = typeof(RenderingMappingEditor).GetMethod("RefreshUidDropdowns", BindingFlags.NonPublic | BindingFlags.Instance);
                mi.Invoke(this, new object[] { pageOrTemplateId });
            }

            public void InvokeOnLoad()
            {
                var mi = typeof(RenderingMappingEditor).GetMethod("OnLoad", BindingFlags.NonPublic | BindingFlags.Instance);
                mi.Invoke(this, new object[] { EventArgs.Empty });
            }

            public void InvokeAutoRefreshUidDropdowns(string ecrItemId)
            {
                var mi = typeof(RenderingMappingEditor).GetMethod("AutoRefreshUidDropdowns", BindingFlags.NonPublic | BindingFlags.Instance);
                mi.Invoke(this, new object[] { ecrItemId });
            }

            public string InvokeBuildUidDropdownHtml(string controlId, string selectedUid, System.Collections.Generic.List<(string uid, string label, string renderingId)> uidOptions)
            {
                var mi = typeof(RenderingMappingEditor).GetMethod("BuildUidDropdownHtml", BindingFlags.NonPublic | BindingFlags.Static);
                return (string)mi.Invoke(null, new object[] { controlId, selectedUid, uidOptions });
            }

            public string InvokeExtractParam(string name)
            {
                var mi = typeof(RenderingMappingEditor).GetMethod("ExtractParam", BindingFlags.NonPublic | BindingFlags.Instance);
                return (string)mi.Invoke(this, new object[] { name });
            }

            public System.Collections.Generic.List<(string uid, string label, string renderingId)> InvokeGetPageRenderingInstances()
            {
                var mi = typeof(RenderingMappingEditor).GetMethod("GetPageRenderingInstances", BindingFlags.NonPublic | BindingFlags.Instance);
                return (System.Collections.Generic.List<(string uid, string label, string renderingId)>)mi.Invoke(this, null);
            }
        }

        private static void SetRequestForm(NameValueCollection values)
        {
            var request = HttpContext.Current.Request;
            var field = typeof(HttpRequest).GetField("_form", BindingFlags.Instance | BindingFlags.NonPublic);
            if (field != null)
            {
                var hvType = typeof(HttpRequest).Assembly.GetType("System.Web.HttpValueCollection");
                object hv = null;
                if (hvType != null)
                {
                    try
                    {
                        hv = Activator.CreateInstance(hvType, values, null, false);
                    }
                    catch
                    {
                        try
                        {
                            hv = Activator.CreateInstance(hvType, values);
                        }
                        catch
                        {
                            hv = null;
                        }
                    }
                }

                if (hv != null)
                {
                    field.SetValue(request, hv);
                    return;
                }

                try
                {
                    field.SetValue(request, values);
                    return;
                }
                catch
                {
                }

                try
                {
                    var query = string.Join("&", values.AllKeys.SelectMany(k => values.GetValues(k).Select(v => $"{HttpUtility.UrlEncode(k)}={HttpUtility.UrlEncode(v)}")));
                    var parsed = HttpUtility.ParseQueryString(query);
                    field.SetValue(request, parsed);
                    return;
                }
                catch
                {
                }
            }

            var paramsField = typeof(HttpRequest).GetField("_params", BindingFlags.Instance | BindingFlags.NonPublic);
            if (paramsField != null)
            {
                try
                {
                    paramsField.SetValue(request, values);
                }
                catch
                {
                }
            }
        }

        private class RenderingMappingEditorProxy : RenderingMappingEditor
        {
            public RenderingMappingEditorProxy()
                : base(new RenderingMappingEditorDependencies
                {
                    DatabaseProvider = Substitute.For<IDatabaseProvider>(),
                    HtmlBuilder = Substitute.For<IRenderingMappingHtmlBuilder>(),
                    ParameterEditorService = Substitute.For<IRenderingParameterEditorService>(),
                    ContextProvider = Substitute.For<ISitecoreContextProvider>(),
                    SheerUiService = Substitute.For<ISheerUiService>(),
                    HttpContextAccessor = Substitute.For<IHttpContextAccessor>(),
                    HostingEnvironmentService = Substitute.For<IHostingEnvironmentService>(),
                    Logger = Substitute.For<IRenderingMappingLogger>(),
                    RenderingIdExtractionService = Substitute.For<IRenderingIdExtractionService>()
                })
            {
            }

            public RenderingMappingEditorProxy(IDatabaseProvider db, IRenderingMappingHtmlBuilder hb, IRenderingParameterEditorService pe, ISitecoreContextProvider contextProvider, ISheerUiService sheerUiService, IHttpContextAccessor httpContextAccessor, IHostingEnvironmentService hostingEnvironmentService)
                : base(new RenderingMappingEditorDependencies
                {
                    DatabaseProvider = db,
                    HtmlBuilder = hb,
                    ParameterEditorService = pe,
                    ContextProvider = contextProvider,
                    SheerUiService = sheerUiService,
                    HttpContextAccessor = httpContextAccessor,
                    HostingEnvironmentService = hostingEnvironmentService,
                    Logger = Substitute.For<IRenderingMappingLogger>(),
                    RenderingIdExtractionService = Substitute.For<IRenderingIdExtractionService>()
                })
            {
            }

            public void InvokeRunEditParametersPipeline(ClientPipelineArgs args)
            {
                var mi = typeof(RenderingMappingEditor).GetMethod("RunEditParametersPipeline", BindingFlags.NonPublic | BindingFlags.Instance);
                mi.Invoke(this, new object[] { args });
            }

            public void InvokeBuildControl()
            {
                var mi = typeof(RenderingMappingEditor).GetMethod("BuildControl", BindingFlags.NonPublic | BindingFlags.Instance);
                mi.Invoke(this, null);
            }

            public void InvokeDoRender(HtmlTextWriter writer)
            {
                var mi = typeof(RenderingMappingEditor).GetMethod("DoRender", BindingFlags.NonPublic | BindingFlags.Instance);
                mi.Invoke(this, new object[] { writer });
            }
        }

        // ============================================================
        // BuildHierarchicalList — uid dropdown tree ordering tests
        // ============================================================
        [Fact]
        public void BuildHierarchicalList_WhenEmpty_ReturnsEmpty()
        {
            // ARRANGE
            var input = Enumerable.Empty<(string uid, string displayName, string renderingId)>();

            // ACT
            var result = RenderingMappingEditor.BuildHierarchicalList(input);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void BuildHierarchicalList_FlatList_ReturnsAllItemsWithUidSuffix()
        {
            // ARRANGE
            var input = new (string uid, string displayName, string renderingId)[]
            {
                ("{UID-A}", "ComponentA", string.Empty),
                ("{UID-B}", "ComponentB", string.Empty)
            };

            // ACT
            var result = RenderingMappingEditor.BuildHierarchicalList(input);

            // ASSERT
            result.Should().HaveCount(2);
            result[0].label.Should().Be("ComponentA -> {UID-A}");
            result[1].label.Should().Be("ComponentB -> {UID-B}");
        }

        [Fact]
        public void BuildHierarchicalList_WhenUidPresent_ShowsUidSuffix()
        {
            // ARRANGE
            var input = new (string uid, string displayName, string renderingId)[] { ("{UID-A}", "ComponentA", string.Empty) };

            // ACT
            var result = RenderingMappingEditor.BuildHierarchicalList(input);

            // ASSERT
            result.Single().label.Should().Be("ComponentA -> {UID-A}");
        }

        [Fact]
        public void BuildHierarchicalList_WhenUidEmpty_OmitsArrowSuffix()
        {
            // ARRANGE
            var input = new (string uid, string displayName, string renderingId)[] { (string.Empty, "ComponentA", string.Empty) };

            // ACT
            var result = RenderingMappingEditor.BuildHierarchicalList(input);

            // ASSERT
            result.Single().label.Should().Be("ComponentA");
        }

        [Fact]
        public void BuildHierarchicalList_FlatList_PreservesInputOrder()
        {
            // ARRANGE
            const string uid1 = "{AAAA0000-0000-0000-0000-000000000001}";
            const string uid2 = "{BBBB0000-0000-0000-0000-000000000002}";
            var input = new (string uid, string displayName, string renderingId)[]
            {
                (uid2, "Child", string.Empty),
                (uid1, "Parent", string.Empty)
            };

            // ACT
            var result = RenderingMappingEditor.BuildHierarchicalList(input);

            // ASSERT
            result.Should().HaveCount(2);
            result[0].uid.Should().Be(uid2);
            result[0].label.Should().Be($"Child -> {uid2}");
            result[1].uid.Should().Be(uid1);
            result[1].label.Should().Be($"Parent -> {uid1}");
        }

        [Fact]
        public void BuildHierarchicalList_FlatList_NoIndentation()
        {
            // ARRANGE
            const string parentUid = "{AAAA0000-0000-0000-0000-000000000001}";
            const string childUid = "{BBBB0000-0000-0000-0000-000000000002}";
            var input = new (string uid, string displayName, string renderingId)[]
            {
                (childUid, "Child", string.Empty),
                (parentUid, "Parent", string.Empty)
            };

            // ACT
            var result = RenderingMappingEditor.BuildHierarchicalList(input);

            // ASSERT — no NBSP indentation, flat output
            result.Should().HaveCount(2);
            result[0].label.Should().NotStartWith("\u00A0");
            result[1].label.Should().NotStartWith("\u00A0");
        }

        [Fact]
        public void BuildHierarchicalList_PreservesRenderingId()
        {
            // ARRANGE
            const string renderingId = "{DD000000-0000-0000-0000-000000000001}";
            var input = new (string uid, string displayName, string renderingId)[]
            {
                ("{UID-1}", "MyComponent", renderingId)
            };

            // ACT
            var result = RenderingMappingEditor.BuildHierarchicalList(input);

            // ASSERT
            result.Single().renderingId.Should().Be(renderingId);
        }

        // ============================================================
        // Constructor null guard
        // ============================================================
        [Fact]
        public void Constructor_WhenDependenciesIsNull_ThrowsArgumentNullException()
        {
            // ARRANGE + ACT
            Action act = () => new TestEditor((RenderingMappingEditorDependencies)null);

            // ASSERT
            act.Should().Throw<ArgumentNullException>()
                .WithMessage("*dependencies*");
        }

        // ============================================================
        // AutoRefreshUidDropdowns — early-return guard paths
        // ============================================================
        [Fact]
        public void AutoRefreshUidDropdowns_WhenEcrItemIdIsNull_DoesNotCallSheerUi()
        {
            // ARRANGE
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            sut.InvokeAutoRefreshUidDropdowns(null);

            // ASSERT
            sheerUiService.DidNotReceive().Eval(Arg.Any<string>());
        }

        [Fact]
        public void AutoRefreshUidDropdowns_WhenEcrItemIdIsInvalidGuid_DoesNotCallSheerUi()
        {
            // ARRANGE
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            sut.InvokeAutoRefreshUidDropdowns("not-a-valid-id");

            // ASSERT
            sheerUiService.DidNotReceive().Eval(Arg.Any<string>());
        }

        [Fact]
        public void AutoRefreshUidDropdowns_WhenDatabaseIsNull_DoesNotCallSheerUi()
        {
            // ARRANGE
            databaseProvider.GetDatabase(DatabaseType.Master).Returns((Sitecore.Data.Database)null);
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            sut.InvokeAutoRefreshUidDropdowns(ID.NewID.ToString());

            // ASSERT
            sheerUiService.DidNotReceive().Eval(Arg.Any<string>());
        }

        [Fact]
        public void AutoRefreshUidDropdowns_WhenEcrItemNotFound_DoesNotCallSheerUi()
        {
            // ARRANGE
            var db = Substitute.For<Sitecore.Data.Database>();
            databaseProvider.GetDatabase(DatabaseType.Master).Returns(db);
            db.GetItem(Arg.Any<ID>()).Returns((Item)null);
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            sut.InvokeAutoRefreshUidDropdowns(ID.NewID.ToString());

            // ASSERT
            sheerUiService.DidNotReceive().Eval(Arg.Any<string>());
        }

        // ============================================================
        // GetPageRenderingInstances — private method via reflection
        // ============================================================
        [Fact]
        public void GetPageRenderingInstances_WhenFoQueryStringIsEmpty_ReturnsEmpty()
        {
            // ARRANGE
            var sw = new System.IO.StringWriter();
            HttpContext.Current = new HttpContext(new HttpRequest(string.Empty, "http://tempuri.org", string.Empty), new HttpResponse(sw));
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            var result = sut.InvokeGetPageRenderingInstances();

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetPageRenderingInstances_WhenFoQueryStringHasNoGuid_ReturnsEmpty()
        {
            // ARRANGE
            var sw = new System.IO.StringWriter();
            HttpContext.Current = new HttpContext(new HttpRequest(string.Empty, "http://tempuri.org", "fo=not-a-guid"), new HttpResponse(sw));
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            var result = sut.InvokeGetPageRenderingInstances();

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetPageRenderingInstances_WhenDatabaseIsNull_ReturnsEmpty()
        {
            // ARRANGE
            var itemId = ID.NewID;
            var sw = new System.IO.StringWriter();
            HttpContext.Current = new HttpContext(new HttpRequest(string.Empty, "http://tempuri.org", $"fo={itemId}"), new HttpResponse(sw));
            databaseProvider.GetDatabase(DatabaseType.Master).Returns((Sitecore.Data.Database)null);
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            var result = sut.InvokeGetPageRenderingInstances();

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetPageRenderingInstances_WhenCurrentItemNotFound_ReturnsEmpty()
        {
            // ARRANGE
            var itemId = ID.NewID;
            var sw = new System.IO.StringWriter();
            HttpContext.Current = new HttpContext(new HttpRequest(string.Empty, "http://tempuri.org", $"fo={itemId}"), new HttpResponse(sw));
            var db = Substitute.For<Sitecore.Data.Database>();
            databaseProvider.GetDatabase(DatabaseType.Master).Returns(db);
            db.GetItem(itemId).Returns((Item)null);
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            var result = sut.InvokeGetPageRenderingInstances();

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetPageRenderingInstances_WhenPageFieldHasId_ReturnsRenderingInstances()
        {
            // ARRANGE
            var ecrItemId = ID.NewID;
            var pageItemId = ID.NewID;
            var sw = new System.IO.StringWriter();
            HttpContext.Current = new HttpContext(new HttpRequest(string.Empty, "http://tempuri.org", $"fo={ecrItemId}"), new HttpResponse(sw));
            var db = Substitute.For<Sitecore.Data.Database>();
            databaseProvider.GetDatabase(DatabaseType.Master).Returns(db);
            var ecrItem = Substitute.For<Item>(ecrItemId, ItemData.Empty, db);
            db.GetItem(ecrItemId).Returns(ecrItem);
            ecrItem[PresentationConstants.Fields.ExperienceContextProviderPage.Page].Returns(pageItemId.ToString());
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            var result = sut.InvokeGetPageRenderingInstances();

            // ASSERT
            result.Should().NotBeNull();
        }

        [Fact]
        public void GetPageRenderingInstances_WhenTemplateFieldHasId_ReturnsRenderingInstances()
        {
            // ARRANGE
            var ecrItemId = ID.NewID;
            var templateItemId = ID.NewID;
            var sw = new System.IO.StringWriter();
            HttpContext.Current = new HttpContext(new HttpRequest(string.Empty, "http://tempuri.org", $"fo={ecrItemId}"), new HttpResponse(sw));
            var db = Substitute.For<Sitecore.Data.Database>();
            databaseProvider.GetDatabase(DatabaseType.Master).Returns(db);
            var ecrItem = Substitute.For<Item>(ecrItemId, ItemData.Empty, db);
            db.GetItem(ecrItemId).Returns(ecrItem);
            ecrItem[PresentationConstants.Fields.ExperienceContextProviderPage.Page].Returns(string.Empty);
            ecrItem[PresentationConstants.Fields.ExperienceContextProviderPageTemplate.PageTemplate].Returns(templateItemId.ToString());
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            var result = sut.InvokeGetPageRenderingInstances();

            // ASSERT
            result.Should().NotBeNull();
        }

        [Fact]
        public void GetPageRenderingInstances_WhenNeitherPageNorTemplateFieldSet_ReturnsEmpty()
        {
            // ARRANGE
            var ecrItemId = ID.NewID;
            var sw = new System.IO.StringWriter();
            HttpContext.Current = new HttpContext(new HttpRequest(string.Empty, "http://tempuri.org", $"fo={ecrItemId}"), new HttpResponse(sw));
            var db = Substitute.For<Sitecore.Data.Database>();
            databaseProvider.GetDatabase(DatabaseType.Master).Returns(db);
            var ecrItem = Substitute.For<Item>(ecrItemId, ItemData.Empty, db);
            db.GetItem(ecrItemId).Returns(ecrItem);
            ecrItem[PresentationConstants.Fields.ExperienceContextProviderPage.Page].Returns("not-a-guid");
            ecrItem[PresentationConstants.Fields.ExperienceContextProviderPageTemplate.PageTemplate].Returns(string.Empty);
            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            var result = sut.InvokeGetPageRenderingInstances();

            // ASSERT
            result.Should().BeEmpty();
        }

        // ============================================================
        // RefreshUidDropdowns — fallback to template scan when page has no renderings
        // ============================================================
        [Fact]
        public void RefreshUidDropdowns_WhenPageItemHasNoRenderingsAndTemplateIdSet_FallsBackToTemplateScan()
        {
            // ARRANGE
            var pageId = ID.NewID;
            var templateId = ID.NewID;
            var db = Substitute.For<Sitecore.Data.Database>();
            databaseProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var pageItem = Substitute.For<Item>(pageId, ItemData.Empty, db);
            db.GetItem(pageId).Returns(pageItem);
            pageItem.TemplateName.Returns("ContentPage");
            pageItem.Paths.Returns((ItemPath)null);
            pageItem.TemplateID.Returns(templateId);

            var sut = new TestEditor(databaseProvider, renderingMappingHtmlBuilder, renderingParameterEditorService, contextProvider, sheerUiService, httpContextAccessor, hostingEnvironmentService);

            // ACT
            sut.InvokeRefreshUidDropdowns(pageId.ToString());

            // ASSERT
            sheerUiService.Received().Eval(Arg.Is<string>(s => s.Contains("scRmRefreshUidDropdowns")));
        }
    }
}

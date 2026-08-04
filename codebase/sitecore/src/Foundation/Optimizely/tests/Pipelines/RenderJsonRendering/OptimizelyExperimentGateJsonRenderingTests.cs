using System;
using System.Collections.Generic;
using easyJet.Foundation.Optimizely.Models;
using easyJet.Foundation.Optimizely.Pipelines.RenderJsonRendering;
using easyJet.Foundation.Optimizely.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Collections;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.ItemRendering;
using Sitecore.LayoutService.Presentation.Pipelines.RenderJsonRendering;
using Sitecore.Mvc.Presentation;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Optimizely.Tests.Pipelines.RenderJsonRendering
{
    public class OptimizelyExperimentGateJsonRenderingTests
    {
        [Fact]
        public void Process_ShouldReturnWithoutCallingDecide_WhenFlagKeyIsMissing()
        {
            var decisionService = Substitute.For<IOptimizelyService>();
            var gateService = Substitute.For<IOptimizelyExperimentationGateService>();
            var sut = new OptimizelyExperimentGateJsonRendering(decisionService, gateService);
            var args = CreateArgs(null);

            sut.Process(args);

            decisionService.DidNotReceive().Decide(Arg.Any<string>(), Arg.Any<OptimizelyDecisionSource>());
        }

        [Fact]
        public void Process_ShouldReturnWithoutCallingDecide_WhenExperimentationIsDisabled()
        {
            var decisionService = Substitute.For<IOptimizelyService>();
            var gateService = Substitute.For<IOptimizelyExperimentationGateService>();
            gateService.IsEnabledForCurrentLanguage().Returns(false);
            var sut = new OptimizelyExperimentGateJsonRendering(decisionService, gateService);
            var args = CreateArgs("flag-a");

            ExecuteInSiteContext(enableWebEdit: false, displayMode: DisplayMode.Normal, action: () => sut.Process(args));

            decisionService.DidNotReceive().Decide("flag-a", Arg.Any<OptimizelyDecisionSource>());
        }

        [Fact]
        public void Process_ShouldSetEnabledKey_WhenDecisionIsMade()
        {
            var decisionService = Substitute.For<IOptimizelyService>();
            var gateService = Substitute.For<IOptimizelyExperimentationGateService>();
            gateService.IsEnabledForCurrentLanguage().Returns(true);
            decisionService.Decide("flag-a", OptimizelyDecisionSource.ComponentParamFlag)
                .Returns((false, "variation-a", (IDictionary<string, object>)new Dictionary<string, object>()));
            var sut = new OptimizelyExperimentGateJsonRendering(decisionService, gateService);
            var args = CreateArgs("flag-a");

            ExecuteInSiteContext(enableWebEdit: false, displayMode: DisplayMode.Normal, action: () => sut.Process(args));

            args.Result.RenderingParams.Should().ContainKey("experimentEnabled");
            decisionService.Received(1).Decide("flag-a", OptimizelyDecisionSource.ComponentParamFlag);
        }

        [Fact]
        public void Process_ShouldSetVariant_WhenDecisionIsEnabledAndVariationHasValue()
        {
            var decisionService = Substitute.For<IOptimizelyService>();
            var gateService = Substitute.For<IOptimizelyExperimentationGateService>();
            gateService.IsEnabledForCurrentLanguage().Returns(true);
            decisionService.Decide("flag-a", OptimizelyDecisionSource.ComponentParamFlag)
                .Returns((true, "variation-a", (IDictionary<string, object>)new Dictionary<string, object>()));
            var sut = new OptimizelyExperimentGateJsonRendering(decisionService, gateService);
            var args = CreateArgs("flag-a");

            ExecuteInSiteContext(enableWebEdit: false, displayMode: DisplayMode.Normal, action: () => sut.Process(args));

            args.Result.RenderingParams.Should().ContainKey("experimentVariant");
            args.Result.RenderingParams["experimentVariant"].Should().Be("variation-a");
        }

        [Fact]
        public void Process_ShouldNotSetVariant_WhenVariationIsWhitespace()
        {
            var decisionService = Substitute.For<IOptimizelyService>();
            var gateService = Substitute.For<IOptimizelyExperimentationGateService>();
            gateService.IsEnabledForCurrentLanguage().Returns(true);
            decisionService.Decide("flag-a", OptimizelyDecisionSource.ComponentParamFlag)
                .Returns((true, "   ", (IDictionary<string, object>)new Dictionary<string, object>()));
            var sut = new OptimizelyExperimentGateJsonRendering(decisionService, gateService);
            var args = CreateArgs("flag-a");

            ExecuteInSiteContext(enableWebEdit: false, displayMode: DisplayMode.Normal, action: () => sut.Process(args));

            args.Result.RenderingParams.Should().NotContainKey("experimentVariant");
        }

        private static RenderJsonRenderingArgs CreateArgs(string flagKey)
        {
            var parameterValue = string.IsNullOrWhiteSpace(flagKey) ? string.Empty : $"optimizelyFlag={flagKey}";
            return new RenderJsonRenderingArgs
            {
                Rendering = new Rendering
                {
                    Parameters = new RenderingParameters(parameterValue)
                },
                Result = new RenderedJsonRendering
                {
                    RenderingParams = new Dictionary<string, string>()
                }
            };
        }

        private static void ExecuteInSiteContext(bool enableWebEdit, DisplayMode displayMode, Action action)
        {
            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "name", "Holidays" },
                { "enableWebEdit", enableWebEdit ? "true" : "false" },
                { "masterDatabase", "master" }
            });

            using (new SiteContextSwitcher(fakeSiteContext))
            {
                Context.Site.SetDisplayMode(displayMode, DisplayModeDuration.Remember);
                action();
            }
        }
    }
}

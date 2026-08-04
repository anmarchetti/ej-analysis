using System;
using System.Collections.Generic;
using System.Web.Mvc;
using easyJet.Foundation.Optimizely.Models;
using easyJet.Foundation.Optimizely.Rules.Conditions;
using easyJet.Foundation.Optimizely.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Collections;
using Sitecore.FakeDb.Sites;
using Sitecore.Rules;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Optimizely.Tests.Rules.Conditions
{
    public class OptimizelyFlagEnabledConditionTests
    {
        [Fact]
        public void Execute_ShouldReturnFalse_WhenExperimentationIsDisabled()
        {
            var decisionService = Substitute.For<IOptimizelyService>();
            var gateService = Substitute.For<IOptimizelyExperimentationGateService>();
            gateService.IsEnabledForCurrentLanguage().Returns(false);

            var sut = new TestableOptimizelyFlagEnabledCondition { FlagKey = "flag-a" };
            SetDependencies(decisionService, gateService);

            var result = EvaluateInNormalDisplayMode(() => sut.Evaluate(new RuleContext()));

            result.Should().BeFalse();
            decisionService.DidNotReceive().Decide(Arg.Any<string>(), Arg.Any<OptimizelyDecisionSource>());
        }

        [Fact]
        public void Execute_ShouldReturnDecisionEnabledValue_WhenExperimentationIsEnabled()
        {
            var decisionService = Substitute.For<IOptimizelyService>();
            var gateService = Substitute.For<IOptimizelyExperimentationGateService>();
            gateService.IsEnabledForCurrentLanguage().Returns(true);
            decisionService.Decide("flag-a", OptimizelyDecisionSource.ComponentPersonalization)
                .Returns((true, "variation", (IDictionary<string, object>)new Dictionary<string, object>()));

            var sut = new TestableOptimizelyFlagEnabledCondition { FlagKey = "flag-a" };
            SetDependencies(decisionService, gateService);

            var result = EvaluateInNormalDisplayMode(() => sut.Evaluate(new RuleContext()));

            result.Should().BeTrue();
            decisionService.Received(1).Decide("flag-a", OptimizelyDecisionSource.ComponentPersonalization);
        }

        [Fact]
        public void Execute_ShouldReturnFalse_WhenDecisionServiceIsMissing()
        {
            var gateService = Substitute.For<IOptimizelyExperimentationGateService>();
            gateService.IsEnabledForCurrentLanguage().Returns(true);

            var sut = new TestableOptimizelyFlagEnabledCondition { FlagKey = "flag-a" };
            SetDependencies(null, gateService);

            var result = EvaluateInNormalDisplayMode(() => sut.Evaluate(new RuleContext()));

            result.Should().BeFalse();
        }

        private static void SetDependencies(
            IOptimizelyService decisionService,
            IOptimizelyExperimentationGateService gateService)
        {
            var dependencyResolver = Substitute.For<IDependencyResolver>();
            dependencyResolver.GetService(typeof(IOptimizelyService)).Returns(decisionService);
            dependencyResolver.GetService(typeof(IOptimizelyExperimentationGateService)).Returns(gateService);
            DependencyResolver.SetResolver(dependencyResolver);
        }

        private sealed class TestableOptimizelyFlagEnabledCondition : OptimizelyFlagEnabledCondition<RuleContext>
        {
            public bool Evaluate(RuleContext ruleContext) => Execute(ruleContext);
        }

        private static bool EvaluateInNormalDisplayMode(Func<bool> evaluate)
        {
            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "name", "Holidays" },
                { "enableWebEdit", "false" },
                { "masterDatabase", "master" }
            });

            using (new SiteContextSwitcher(fakeSiteContext))
            {
                Context.Site.SetDisplayMode(DisplayMode.Normal, DisplayModeDuration.Remember);
                return evaluate();
            }
        }
    }
}

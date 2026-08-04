using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using easyJet.Foundation.Optimizely.Logging;
using easyJet.Foundation.Optimizely.Models;
using easyJet.Foundation.Optimizely.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Optimizely.Tests.Services
{
    public class OptimizelyDecisionContextTests
    {
        [Fact]
        public void TryAdd_ShouldStoreLastDecisionPerFeature()
        {
            var sut = CreateSut();

            sut.TryAdd(
                new OptimizelyDecisionContextModel
                {
                    FeatureKey = "feature-a",
                    VariationKey = "v1",
                    IsDisabled = false,
                    Source = OptimizelyDecisionSource.Default
                });

            sut.TryAdd(
                new OptimizelyDecisionContextModel
                {
                    FeatureKey = "feature-a",
                    VariationKey = "v2",
                    IsDisabled = true,
                    Source = OptimizelyDecisionSource.Default
                });

            var decisions = sut.GetAll().ToList();
            decisions.Should().HaveCount(1);
            decisions[0].VariationKey.Should().Be("v2");
            decisions[0].IsDisabled.Should().BeTrue();
        }

        [Fact]
        public void TryAdd_ShouldPreserveFirstSeenOrder_WhenReplacingDecision()
        {
            var sut = CreateSut();

            sut.TryAdd(new OptimizelyDecisionContextModel { FeatureKey = "feature-b", VariationKey = "b1" });
            sut.TryAdd(new OptimizelyDecisionContextModel { FeatureKey = "feature-a", VariationKey = "a1" });
            sut.TryAdd(new OptimizelyDecisionContextModel { FeatureKey = "feature-c", VariationKey = "c1" });
            sut.TryAdd(new OptimizelyDecisionContextModel { FeatureKey = "feature-a", VariationKey = "a2" });

            sut.GetAll().Select(x => x.FeatureKey).Should().Equal("feature-b", "feature-a", "feature-c");
            sut.GetAll().Single(x => x.FeatureKey == "feature-a").VariationKey.Should().Be("a2");
        }

        [Fact]
        public void TryAdd_ShouldKeepHigherPriorityDecision_WhenLowerPriorityIsAddedLater()
        {
            var sut = CreateSut();

            sut.TryAdd(new OptimizelyDecisionContextModel
            {
                FeatureKey = "feature-a",
                VariationKey = "high",
                Source = OptimizelyDecisionSource.ComponentParamFlag
            });
            sut.TryAdd(new OptimizelyDecisionContextModel
            {
                FeatureKey = "feature-a",
                VariationKey = "low",
                Source = OptimizelyDecisionSource.ComponentPersonalization
            });

            var decision = sut.GetAll().Single();
            decision.VariationKey.Should().Be("high");
            decision.Source.Should().Be(OptimizelyDecisionSource.ComponentParamFlag);
        }

        [Fact]
        public void TryAdd_ShouldReplaceWithHigherPriorityDecision_WhenAddedLater()
        {
            var sut = CreateSut();

            sut.TryAdd(new OptimizelyDecisionContextModel
            {
                FeatureKey = "feature-a",
                VariationKey = "low",
                Source = OptimizelyDecisionSource.ComponentPersonalization
            });
            sut.TryAdd(new OptimizelyDecisionContextModel
            {
                FeatureKey = "feature-a",
                VariationKey = "high",
                Source = OptimizelyDecisionSource.ComponentParamFlag
            });

            var decision = sut.GetAll().Single();
            decision.VariationKey.Should().Be("high");
            decision.Source.Should().Be(OptimizelyDecisionSource.ComponentParamFlag);
        }

        [Fact]
        public void TryAdd_ShouldIgnoreInvalidDecisions()
        {
            var sut = CreateSut();

            sut.TryAdd(null);
            sut.TryAdd(new OptimizelyDecisionContextModel { FeatureKey = "   " });

            sut.GetAll().Should().BeEmpty();
        }

        [Fact]
        public void SetUserContext_ShouldStoreFirstNonEmptyValues()
        {
            var sut = CreateSut();

            sut.SetUserContext(null, null);
            sut.SetUserContext("user-a", new Dictionary<string, object> { { "site", "holidays" } });
            sut.SetUserContext("user-b", new Dictionary<string, object> { { "site", "trade" } });

            sut.GetUserId().Should().Be("user-a");
            sut.GetUserAttributes().Should().ContainKey("site");
            sut.GetUserAttributes()["site"].Should().Be("holidays");
        }

        [Fact]
        public void TryAdd_ShouldTreatTrimmedFeatureKeyAsSameFeatureAndKeepHigherPriorityDecision()
        {
            var sut = CreateSut();

            sut.TryAdd(new OptimizelyDecisionContextModel
            {
                FeatureKey = " feature-a ",
                VariationKey = "low",
                Source = OptimizelyDecisionSource.ComponentPersonalization
            });
            sut.TryAdd(new OptimizelyDecisionContextModel
            {
                FeatureKey = "feature-a",
                VariationKey = "high",
                Source = OptimizelyDecisionSource.ComponentParamFlag
            });

            var decision = sut.GetAll().Single();
            decision.FeatureKey.Should().Be("feature-a");
            decision.VariationKey.Should().Be("high");
            decision.Source.Should().Be(OptimizelyDecisionSource.ComponentParamFlag);
        }

        [Fact]
        public void TryAdd_ShouldShareRequestStateAcrossMultipleContextInstances()
        {
            var previousContext = HttpContext.Current;
            try
            {
                HttpContext.Current = new HttpContext(
                    new HttpRequest(string.Empty, "http://localhost/", string.Empty),
                    new HttpResponse(new StringWriter()));

                var personalizationContext = CreateSut();
                var paramFlagContext = CreateSut();

                personalizationContext.TryAdd(new OptimizelyDecisionContextModel
                {
                    FeatureKey = "component_test",
                    VariationKey = "personalization",
                    Source = OptimizelyDecisionSource.ComponentPersonalization
                });
                paramFlagContext.TryAdd(new OptimizelyDecisionContextModel
                {
                    FeatureKey = "component_test",
                    VariationKey = "param-flag",
                    Source = OptimizelyDecisionSource.ComponentParamFlag
                });

                var decisionFromFirstInstance = personalizationContext.GetAll().Single();
                var decisionFromSecondInstance = paramFlagContext.GetAll().Single();

                decisionFromFirstInstance.Source.Should().Be(OptimizelyDecisionSource.ComponentParamFlag);
                decisionFromFirstInstance.VariationKey.Should().Be("param-flag");
                decisionFromSecondInstance.Source.Should().Be(OptimizelyDecisionSource.ComponentParamFlag);
            }
            finally
            {
                HttpContext.Current = previousContext;
            }
        }

        private static OptimizelyDecisionContext CreateSut()
        {
            return new OptimizelyDecisionContext(Substitute.For<IOptimizelyLogger>());
        }
    }
}

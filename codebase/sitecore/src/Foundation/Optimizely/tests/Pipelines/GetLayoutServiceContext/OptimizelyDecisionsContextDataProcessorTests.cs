using System.Collections.Generic;
using System.Web.Mvc;
using easyJet.Foundation.Optimizely.Models;
using easyJet.Foundation.Optimizely.Pipelines.GetLayoutServiceContext;
using easyJet.Foundation.Optimizely.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;
using Xunit;

namespace easyJet.Foundation.Optimizely.Tests.Pipelines.GetLayoutServiceContext
{
    public class OptimizelyDecisionsContextDataProcessorTests
    {
        [Fact]
        public void Process_ShouldAddOptimizelyDecisionsToContext()
        {
            var decisionContext = Substitute.For<IOptimizelyDecisionContext>();
            var decisions = new List<OptimizelyDecisionContextModel>
            {
                new OptimizelyDecisionContextModel
                {
                    FeatureKey = "feature-a",
                    VariationKey = "variation-a",
                    ExperimentKey = "experiment-a",
                    IsDisabled = false,
                    Source = OptimizelyDecisionSource.ComponentParamFlag
                }
            };
            decisionContext.GetAll().Returns(decisions);
            decisionContext.GetUserId().Returns("user-a");
            decisionContext.GetUserAttributes().Returns(new Dictionary<string, object> { { "site", "holidays" } });

            var dependencyResolver = Substitute.For<IDependencyResolver>();
            dependencyResolver.GetService(typeof(IOptimizelyDecisionContext)).Returns(decisionContext);
            DependencyResolver.SetResolver(dependencyResolver);

            var sut = new OptimizelyDecisionsContextDataProcessor();
            var args = new GetLayoutServiceContextArgs();

            sut.Process(args);

            args.ContextData.Should().ContainKey(OptimizelyDecisionsContextDataProcessor.OptimizelyDecisionsPropertyName);
            args.ContextData.Should().ContainKey(OptimizelyDecisionsContextDataProcessor.OptimizelyUserIdPropertyName);
            args.ContextData.Should().ContainKey(OptimizelyDecisionsContextDataProcessor.OptimizelyUserAttributesPropertyName);
            args.ContextData[OptimizelyDecisionsContextDataProcessor.OptimizelyDecisionsPropertyName].Should().BeEquivalentTo(decisions);
            args.ContextData[OptimizelyDecisionsContextDataProcessor.OptimizelyUserIdPropertyName].Should().Be("user-a");
        }

        [Fact]
        public void Process_ShouldNotAddOptimizelyKeys_WhenNoDecisionsExist()
        {
            var decisionContext = Substitute.For<IOptimizelyDecisionContext>();
            decisionContext.GetAll().Returns(new List<OptimizelyDecisionContextModel>());

            var dependencyResolver = Substitute.For<IDependencyResolver>();
            dependencyResolver.GetService(typeof(IOptimizelyDecisionContext)).Returns(decisionContext);
            DependencyResolver.SetResolver(dependencyResolver);

            var sut = new OptimizelyDecisionsContextDataProcessor();
            var args = new GetLayoutServiceContextArgs();

            sut.Process(args);

            args.ContextData.Should().NotContainKey(OptimizelyDecisionsContextDataProcessor.OptimizelyDecisionsPropertyName);
            args.ContextData.Should().NotContainKey(OptimizelyDecisionsContextDataProcessor.OptimizelyUserIdPropertyName);
            args.ContextData.Should().NotContainKey(OptimizelyDecisionsContextDataProcessor.OptimizelyUserAttributesPropertyName);
        }

        [Fact]
        public void Process_ShouldRefreshExistingOptimizelyContextData()
        {
            var decisionContext = Substitute.For<IOptimizelyDecisionContext>();
            var decisions = new List<OptimizelyDecisionContextModel>
            {
                new OptimizelyDecisionContextModel { FeatureKey = "latest", Source = OptimizelyDecisionSource.ComponentParamFlag }
            };
            decisionContext.GetAll().Returns(decisions);
            decisionContext.GetUserId().Returns("user-b");
            decisionContext.GetUserAttributes().Returns(new Dictionary<string, object> { { "site", "trade" } });

            var dependencyResolver = Substitute.For<IDependencyResolver>();
            dependencyResolver.GetService(typeof(IOptimizelyDecisionContext)).Returns(decisionContext);
            DependencyResolver.SetResolver(dependencyResolver);

            var sut = new OptimizelyDecisionsContextDataProcessor();
            var args = new GetLayoutServiceContextArgs();
            var existing = new List<OptimizelyDecisionContextModel>
            {
                new OptimizelyDecisionContextModel { FeatureKey = "existing" }
            };
            args.ContextData.Add(OptimizelyDecisionsContextDataProcessor.OptimizelyDecisionsPropertyName, existing);
            args.ContextData.Add(OptimizelyDecisionsContextDataProcessor.OptimizelyUserIdPropertyName, "user-a");
            args.ContextData.Add(OptimizelyDecisionsContextDataProcessor.OptimizelyUserAttributesPropertyName, new Dictionary<string, object> { { "site", "holidays" } });

            sut.Process(args);

            args.ContextData[OptimizelyDecisionsContextDataProcessor.OptimizelyDecisionsPropertyName].Should().BeEquivalentTo(decisions);
            args.ContextData[OptimizelyDecisionsContextDataProcessor.OptimizelyUserIdPropertyName].Should().Be("user-b");
        }

        [Fact]
        public void Process_ShouldRemoveExistingOptimizelyKeys_WhenNoDecisionsExist()
        {
            var decisionContext = Substitute.For<IOptimizelyDecisionContext>();
            decisionContext.GetAll().Returns(new List<OptimizelyDecisionContextModel>());

            var dependencyResolver = Substitute.For<IDependencyResolver>();
            dependencyResolver.GetService(typeof(IOptimizelyDecisionContext)).Returns(decisionContext);
            DependencyResolver.SetResolver(dependencyResolver);

            var sut = new OptimizelyDecisionsContextDataProcessor();
            var args = new GetLayoutServiceContextArgs();
            args.ContextData.Add(OptimizelyDecisionsContextDataProcessor.OptimizelyDecisionsPropertyName, new List<OptimizelyDecisionContextModel> { new OptimizelyDecisionContextModel { FeatureKey = "old" } });
            args.ContextData.Add(OptimizelyDecisionsContextDataProcessor.OptimizelyUserIdPropertyName, "user-a");
            args.ContextData.Add(OptimizelyDecisionsContextDataProcessor.OptimizelyUserAttributesPropertyName, new Dictionary<string, object> { { "site", "holidays" } });

            sut.Process(args);

            args.ContextData.Should().NotContainKey(OptimizelyDecisionsContextDataProcessor.OptimizelyDecisionsPropertyName);
            args.ContextData.Should().NotContainKey(OptimizelyDecisionsContextDataProcessor.OptimizelyUserIdPropertyName);
            args.ContextData.Should().NotContainKey(OptimizelyDecisionsContextDataProcessor.OptimizelyUserAttributesPropertyName);
        }
    }
}

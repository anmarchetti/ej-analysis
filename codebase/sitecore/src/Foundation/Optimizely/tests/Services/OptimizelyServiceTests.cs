using System;
using System.Collections.Generic;
using System.Reflection;
using System.Runtime.Serialization;
using easyJet.Foundation.Optimizely.Factory;
using easyJet.Foundation.Optimizely.Logging;
using easyJet.Foundation.Optimizely.Models;
using easyJet.Foundation.Optimizely.Services;
using FluentAssertions;
using NSubstitute;
using OptimizelySDK;
using OptimizelySDK.Entity;
using OptimizelySDK.OptimizelyDecisions;
using Xunit;

namespace easyJet.Foundation.Optimizely.Tests.Services
{
    public class OptimizelyServiceTests
    {
        private readonly IOptimizely optly;
        private readonly IOptimizelyDecisionContext decisionContext;
        private readonly IOptimizelyExperimentationGateService experimentationGateService;
        private readonly IOptimizelyLogger logger;

        public OptimizelyServiceTests()
        {
            optly = Substitute.For<IOptimizely>();
            decisionContext = Substitute.For<IOptimizelyDecisionContext>();
            experimentationGateService = Substitute.For<IOptimizelyExperimentationGateService>();
            logger = Substitute.For<IOptimizelyLogger>();
        }

        [Fact]
        public void Decide_ShouldNotStoreDecision_WhenExperimentationIsDisabled()
        {
            var userContextFactory = new FakeUserContextFactory
            {
                UserId = "user-1",
                Attributes = new UserAttributes { ["site"] = "holidays", ["language"] = "en" },
                CanCreateUserContext = true
            };
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(false);
            var sut = new OptimizelyService(optly, userContextFactory, decisionContext, experimentationGateService, logger);

            var result = sut.Decide("flag-a");

            result.Item1.Should().BeFalse();
            result.Item2.Should().BeNull();
            decisionContext.DidNotReceive().TryAdd(Arg.Any<OptimizelyDecisionContextModel>());
            decisionContext.DidNotReceive().SetUserContext(Arg.Any<string>(), Arg.Any<IDictionary<string, object>>());
        }

        [Fact]
        public void Decide_ShouldStoreDisabledDecision_WhenUserContextCreationFails()
        {
            var userContextFactory = new FakeUserContextFactory
            {
                UserId = "user-2",
                Attributes = new UserAttributes { ["site"] = "holidays", ["language"] = "en" },
                CanCreateUserContext = false
            };
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(true);
            var sut = new OptimizelyService(optly, userContextFactory, decisionContext, experimentationGateService, logger);

            var result = sut.Decide("flag-b");

            result.Item1.Should().BeFalse();
            result.Item2.Should().BeNull();
            decisionContext.Received(1).TryAdd(Arg.Is<OptimizelyDecisionContextModel>(x =>
                x.FeatureKey == "flag-b" &&
                x.IsDisabled &&
                x.Source == OptimizelyDecisionSource.Default));
        }

        [Fact]
        public void Decide_WithComponentParamFlagSource_ShouldStoreComponentParamFlagDecision_WhenUserContextCreationFails()
        {
            var userContextFactory = new FakeUserContextFactory
            {
                UserId = "user-2",
                Attributes = new UserAttributes { ["site"] = "holidays", ["language"] = "en" },
                CanCreateUserContext = false
            };
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(true);
            var sut = new OptimizelyService(optly, userContextFactory, decisionContext, experimentationGateService, logger);

            var result = sut.Decide("flag-b", OptimizelyDecisionSource.ComponentParamFlag);

            result.Item1.Should().BeFalse();
            result.Item2.Should().BeNull();
            decisionContext.Received(1).TryAdd(Arg.Is<OptimizelyDecisionContextModel>(x =>
                x.FeatureKey == "flag-b" &&
                x.IsDisabled &&
                x.Source == OptimizelyDecisionSource.ComponentParamFlag));
        }

        [Fact]
        public void Decide_ShouldStoreNormalizedFeatureKey_WhenFlagContainsWhitespace()
        {
            var userContextFactory = new FakeUserContextFactory
            {
                UserId = "user-2",
                Attributes = new UserAttributes { ["site"] = "holidays", ["language"] = "en" },
                CanCreateUserContext = false
            };
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(true);
            var sut = new OptimizelyService(optly, userContextFactory, decisionContext, experimentationGateService, logger);

            var result = sut.Decide("  flag-b  ", OptimizelyDecisionSource.ComponentParamFlag);

            result.Item1.Should().BeFalse();
            result.Item2.Should().BeNull();
            decisionContext.Received(1).TryAdd(Arg.Is<OptimizelyDecisionContextModel>(x =>
                x.FeatureKey == "flag-b" &&
                x.IsDisabled &&
                x.Source == OptimizelyDecisionSource.ComponentParamFlag));
        }

        [Fact]
        public void Decide_ShouldStoreDisabledDecision_WhenSdkDecisionIsNull()
        {
            var userContext = CreateUserContextFake(
                decideHandler: (_, __) => null);

            var userContextFactory = new FakeUserContextFactory
            {
                UserId = "user-2",
                Attributes = new UserAttributes { ["site"] = "holidays", ["language"] = "en" },
                CanCreateUserContext = true,
                UserContext = userContext
            };
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(true);
            var sut = new OptimizelyService(optly, userContextFactory, decisionContext, experimentationGateService, logger);

            var result = sut.Decide("flag-c", OptimizelyDecisionSource.ComponentParamFlag);

            result.Item1.Should().BeFalse();
            result.Item2.Should().BeNull();
            decisionContext.Received(1).TryAdd(Arg.Is<OptimizelyDecisionContextModel>(x =>
                x.FeatureKey == "flag-c" &&
                x.IsDisabled &&
                x.Source == OptimizelyDecisionSource.ComponentParamFlag));
        }

        [Fact]
        public void Decide_ShouldStoreDecision_WhenSdkDecisionIsReturned()
        {
            var userContext = CreateUserContextFake();
            var sdkDecision = new OptimizelyDecision(
                variationKey: "variation-c",
                enabled: true,
                variables: null,
                ruleKey: "rule-c",
                flagKey: "flag-c",
                userContext: userContext,
                reasons: Array.Empty<string>());
            userContext = CreateUserContextFake(
                decideHandler: (_, __) => sdkDecision);

            var userContextFactory = new FakeUserContextFactory
            {
                UserId = "user-2",
                Attributes = new UserAttributes { ["site"] = "holidays", ["language"] = "en" },
                CanCreateUserContext = true,
                UserContext = userContext
            };
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(true);
            var sut = new OptimizelyService(optly, userContextFactory, decisionContext, experimentationGateService, logger);

            var result = sut.Decide("flag-c", OptimizelyDecisionSource.ComponentParamFlag);

            result.Item1.Should().BeTrue();
            result.Item2.Should().Be("variation-c");
            decisionContext.Received(1).TryAdd(Arg.Is<OptimizelyDecisionContextModel>(x =>
                x.FeatureKey == "flag-c" &&
                x.VariationKey == "variation-c" &&
                x.ExperimentKey == "rule-c" &&
                !x.IsDisabled &&
                x.Source == OptimizelyDecisionSource.ComponentParamFlag));
        }

        [Fact]
        public void Decide_ShouldStoreDisabledDecision_WhenSdkDecideThrows()
        {
            var userContext = CreateUserContextFake(
                decideHandler: (_, __) => throw new InvalidOperationException("boom"));

            var userContextFactory = new FakeUserContextFactory
            {
                UserId = "user-2",
                Attributes = new UserAttributes { ["site"] = "holidays", ["language"] = "en" },
                CanCreateUserContext = true,
                UserContext = userContext
            };
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(true);
            var sut = new OptimizelyService(optly, userContextFactory, decisionContext, experimentationGateService, logger);

            var result = sut.Decide("flag-d", OptimizelyDecisionSource.ComponentParamFlag);

            result.Item1.Should().BeFalse();
            result.Item2.Should().BeNull();
            logger.Received(1).Error(Arg.Is<string>(s => s.Contains("decision failure for flag-d")), Arg.Any<Exception>(), Arg.Any<object>());
            decisionContext.Received(1).TryAdd(Arg.Is<OptimizelyDecisionContextModel>(x =>
                x.FeatureKey == "flag-d" &&
                x.IsDisabled &&
                x.Source == OptimizelyDecisionSource.ComponentParamFlag));
        }

        [Fact]
        public void Decide_ShouldNotStoreDecision_WhenFlagKeyIsEmpty()
        {
            var userContextFactory = new FakeUserContextFactory
            {
                UserId = "user-3",
                Attributes = new UserAttributes { ["site"] = "holidays" },
                CanCreateUserContext = false
            };
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(true);
            var sut = new OptimizelyService(optly, userContextFactory, decisionContext, experimentationGateService, logger);

            var result = sut.Decide(" ");

            result.Item1.Should().BeFalse();
            decisionContext.DidNotReceive().TryAdd(Arg.Any<OptimizelyDecisionContextModel>());
        }

        [Fact]
        public void DecideForKeys_ShouldNotStoreDecisions_WhenExperimentationIsDisabled()
        {
            var userContextFactory = new FakeUserContextFactory
            {
                UserId = "user-4",
                Attributes = new UserAttributes { ["site"] = "holidays" },
                CanCreateUserContext = true
            };
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(false);
            var sut = new OptimizelyService(optly, userContextFactory, decisionContext, experimentationGateService, logger);

            var result = sut.Decide(new[] { "flag-1", "flag-2" });

            result.Should().NotBeNull();
            result.Should().BeEmpty();
            decisionContext.DidNotReceive().TryAdd(Arg.Any<OptimizelyDecisionContextModel>());
            decisionContext.DidNotReceive().SetUserContext(Arg.Any<string>(), Arg.Any<IDictionary<string, object>>());
        }

        [Fact]
        public void DecideForKeys_ShouldReturnEmptyDictionary_WhenKeysAreNull()
        {
            var userContextFactory = new FakeUserContextFactory
            {
                UserId = "user-5",
                Attributes = new UserAttributes { ["site"] = "holidays" },
                CanCreateUserContext = true
            };
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(true);
            var sut = new OptimizelyService(optly, userContextFactory, decisionContext, experimentationGateService, logger);

            var result = sut.Decide((string[])null);

            result.Should().NotBeNull();
            result.Should().BeEmpty();
            decisionContext.DidNotReceive().TryAdd(Arg.Any<OptimizelyDecisionContextModel>());
        }

        [Fact]
        public void DecideForKeys_ShouldReturnEmptyDictionary_WhenKeysAreWhitespaceOnly()
        {
            var userContextFactory = new FakeUserContextFactory
            {
                UserId = "user-6",
                Attributes = new UserAttributes { ["site"] = "holidays" },
                CanCreateUserContext = true
            };
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(true);
            var sut = new OptimizelyService(optly, userContextFactory, decisionContext, experimentationGateService, logger);

            var result = sut.Decide(new[] { " ", "\t" });

            result.Should().NotBeNull();
            result.Should().BeEmpty();
            decisionContext.DidNotReceive().TryAdd(Arg.Any<OptimizelyDecisionContextModel>());
        }

        [Fact]
        public void DecideForKeys_ShouldStoreDisabledDecisionForEachNormalizedFlag_WhenUserContextCreationFails()
        {
            var userContextFactory = new FakeUserContextFactory
            {
                UserId = "user-7",
                Attributes = new UserAttributes { ["site"] = "holidays" },
                CanCreateUserContext = false
            };
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(true);
            var sut = new OptimizelyService(optly, userContextFactory, decisionContext, experimentationGateService, logger);

            var result = sut.Decide(new[] { "flag-1", " flag-1 ", "flag-2" });

            result.Should().NotBeNull();
            result.Should().BeEmpty();
            decisionContext.Received(1).TryAdd(Arg.Is<OptimizelyDecisionContextModel>(x => x.FeatureKey == "flag-1" && x.IsDisabled && x.Source == OptimizelyDecisionSource.Default));
            decisionContext.Received(1).TryAdd(Arg.Is<OptimizelyDecisionContextModel>(x => x.FeatureKey == "flag-2" && x.IsDisabled && x.Source == OptimizelyDecisionSource.Default));
        }

        [Fact]
        public void DecideForKeys_ShouldStoreDisabledDecisionForEachNormalizedFlag_WhenFactoryThrows()
        {
            var userContextFactory = new FakeUserContextFactory
            {
                UserId = "user-8",
                Attributes = new UserAttributes { ["site"] = "holidays" },
                CanCreateUserContext = true,
                ThrowOnTryCreate = true
            };
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(true);
            var sut = new OptimizelyService(optly, userContextFactory, decisionContext, experimentationGateService, logger);

            var result = sut.Decide(new[] { "flag-1", "flag-2" });

            result.Should().NotBeNull();
            result.Should().BeEmpty();
            decisionContext.Received(1).TryAdd(Arg.Is<OptimizelyDecisionContextModel>(x => x.FeatureKey == "flag-1" && x.IsDisabled && x.Source == OptimizelyDecisionSource.Default));
            decisionContext.Received(1).TryAdd(Arg.Is<OptimizelyDecisionContextModel>(x => x.FeatureKey == "flag-2" && x.IsDisabled && x.Source == OptimizelyDecisionSource.Default));
            logger.Received(1).Error(Arg.Is<string>(s => s.Contains("decisions failure for keys")), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void DecideForKeys_ShouldStoreDecisionAndFallbackDisabledDecision_WhenSomeFlagsMissing()
        {
            var userContext = CreateUserContextFake();
            var sdkDecision = new OptimizelyDecision(
                variationKey: "variation-1",
                enabled: true,
                variables: null,
                ruleKey: "rule-1",
                flagKey: "flag-1",
                userContext: userContext,
                reasons: Array.Empty<string>());
            userContext = CreateUserContextFake(
                decideForKeysHandler: (_, __) => new Dictionary<string, OptimizelyDecision>
                {
                    { "flag-1", sdkDecision }
                });

            var userContextFactory = new FakeUserContextFactory
            {
                UserId = "user-9",
                Attributes = new UserAttributes { ["site"] = "holidays" },
                CanCreateUserContext = true,
                UserContext = userContext
            };
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(true);
            var sut = new OptimizelyService(optly, userContextFactory, decisionContext, experimentationGateService, logger);

            var result = sut.Decide(new[] { "flag-1", "flag-2" });

            result.Should().ContainKey("flag-1");
            decisionContext.Received(1).TryAdd(Arg.Is<OptimizelyDecisionContextModel>(x =>
                x.FeatureKey == "flag-1" &&
                x.VariationKey == "variation-1" &&
                x.ExperimentKey == "rule-1" &&
                !x.IsDisabled &&
                x.Source == OptimizelyDecisionSource.Default));
            decisionContext.Received(1).TryAdd(Arg.Is<OptimizelyDecisionContextModel>(x =>
                x.FeatureKey == "flag-2" &&
                x.IsDisabled &&
                x.Source == OptimizelyDecisionSource.Default));
        }

        [Fact]
        public void DefaultOptions_ShouldDisableDecisionEvents()
        {
            var field = typeof(OptimizelyService).GetField("DefaultOptions", BindingFlags.Static | BindingFlags.NonPublic);
            field.Should().NotBeNull();
            var options = field.GetValue(null) as OptimizelyDecideOption[];

            options.Should().NotBeNull();
            options.Should().Contain(OptimizelyDecideOption.DISABLE_DECISION_EVENT);
            options.Should().Contain(OptimizelyDecideOption.ENABLED_FLAGS_ONLY);
        }

        private class FakeUserContextFactory : IOptimizelyUserContextFactory
        {
            public string UserId { get; set; }

            public UserAttributes Attributes { get; set; } = new UserAttributes();

            public OptimizelyUserContext UserContext { get; set; }

            public bool CanCreateUserContext { get; set; }

            public bool ThrowOnTryCreate { get; set; }

            public bool TryCreateUserContext(IOptimizely client, out OptimizelyUserContext context, out string userId)
            {
                if (ThrowOnTryCreate)
                {
                    throw new InvalidOperationException("test");
                }

                context = UserContext;
                userId = UserId;
                return CanCreateUserContext;
            }

            public string GetUserId() => UserId;

            public UserAttributes GetAttributes() => Attributes;
        }

        private static OptimizelyUserContext CreateUserContextFake(
            Func<string, OptimizelyDecideOption[], OptimizelyDecision> decideHandler = null,
            Func<string[], OptimizelyDecideOption[], Dictionary<string, OptimizelyDecision>> decideForKeysHandler = null)
        {
            var context = (FakeOptimizelyUserContext)FormatterServices.GetUninitializedObject(typeof(FakeOptimizelyUserContext));
            context.DecideHandler = decideHandler;
            context.DecideForKeysHandler = decideForKeysHandler;
            return context;
        }

        private class FakeOptimizelyUserContext : OptimizelyUserContext
        {
            public FakeOptimizelyUserContext()
                : base(null, "unused", new UserAttributes(), null, null)
            {
            }

            public Func<string, OptimizelyDecideOption[], OptimizelyDecision> DecideHandler { get; set; }

            public Func<string[], OptimizelyDecideOption[], Dictionary<string, OptimizelyDecision>> DecideForKeysHandler { get; set; }

            public override OptimizelyDecision Decide(string key, OptimizelyDecideOption[] options) =>
                DecideHandler?.Invoke(key, options);

            public override Dictionary<string, OptimizelyDecision> DecideForKeys(string[] keys, OptimizelyDecideOption[] options) =>
                DecideForKeysHandler?.Invoke(keys, options);
        }
    }
}

using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Web.Mvc;
using easyJet.Feature.Tracker.Models.Personalize;
using easyJet.Feature.Tracker.Rules.Personalize;
using easyJet.Feature.Tracker.Services.Personalize;
using easyJet.Foundation.Analytics.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.FakeDb.Sites;
using Sitecore.Layouts;
using Sitecore.NSubstituteUtils;
using Sitecore.NSubstituteUtils.Extensions;
using Sitecore.Rules;
using Sitecore.Rules.ConditionalRenderings;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Feature.Tracker.Tests.Rules
{
    public class PersonalizeRuleTests
    {
        private IPersonalizationContext personalizationContext;

        [Fact]
        public void ValidateRule_Success_PersonalizationContext()
        {
            SetDependencyResolverData(true, false);

            var rule = new PersonalizeRule<RuleContext>()
            {
                SelectionAttribute = "testAttr",
                ExperimentId = "testExp",
                CacheMinutes = 5
            };

            var item = new FakeItem().ToSitecoreItem();
            var renderingReference = new RenderingReference(item);
            var renderingReferenceUniqueId = renderingReference.UniqueId.Replace("{", string.Empty).Replace("}", string.Empty).ToLowerInvariant();
            var ruleContext = new ConditionalRenderingsRuleContext(new List<RenderingReference> { renderingReference }, renderingReference);
            var ruleStack = new RuleStack();

            using (new FakeSiteContextSwitcher(GetFakeSiteContext(false, false)))
            {
                rule.Evaluate(ruleContext, ruleStack);

                var context = personalizationContext.GetAllPersonalizations();
                context.Should().NotBeNull();
                context.Count().Should().Be(1);
                context.First().UniqueId.Should().BeEquivalentTo(renderingReferenceUniqueId);
                context.First().FriendlyId.Should().Be(rule.ExperimentId);
                context.First().SelectionAttr.Should().Be("testAttr");
                context.First().Ctas.Length.Should().Be(1);
                context.First().Ctas[0].Token.Should().Be("token");
                context.First().Ctas[0].Url.Should().Be("url/test/test?test");
                ruleContext.IsAborted.Should().BeFalse();
                ruleContext.SkipRule.Should().BeFalse();
                ruleStack.Count.Should().Be(1);
                ruleStack.Pop().Should().Be(true);
            }
        }

        [Fact]
        public void ValidateRule_Success_PersonalizeService()
        {
            SetDependencyResolverData(false, true);

            var rule = new PersonalizeRule<RuleContext>()
            {
                SelectionAttribute = "testAttr1",
                ExperimentId = "testExp1",
                CacheMinutes = 5
            };

            var item = new FakeItem().ToSitecoreItem();
            var renderingReference = new RenderingReference(item);
            var renderingReferenceUniqueId = renderingReference.UniqueId.Replace("{", string.Empty).Replace("}", string.Empty).ToLowerInvariant();
            var ruleContext = new ConditionalRenderingsRuleContext(new List<RenderingReference> { renderingReference }, renderingReference);
            var ruleStack = new RuleStack();

            using (new FakeSiteContextSwitcher(GetFakeSiteContext(false, false)))
            {
                rule.Evaluate(ruleContext, ruleStack);

                var context = personalizationContext.GetAllPersonalizations();
                context.Should().NotBeNull();
                context.Count().Should().Be(1);
                context.First().UniqueId.Should().BeEquivalentTo(renderingReferenceUniqueId);
                context.First().FriendlyId.Should().Be(rule.ExperimentId);
                context.First().SelectionAttr.Should().Be("testAttr1");
                context.First().Ctas.Length.Should().Be(1);
                context.First().Ctas[0].Token.Should().Be("token");
                context.First().Ctas[0].Url.Should().Be("url/test/test?test");
                ruleContext.IsAborted.Should().BeFalse();
                ruleContext.SkipRule.Should().BeFalse();
                ruleStack.Count.Should().Be(1);
                ruleStack.Pop().Should().Be(true);
            }
        }

        [Fact]
        public void ValidateRule_Fail_PersonalizationContextAndServiceDifferentData()
        {
            // change initial params as PersonalizationService returns Default Result instead of null
            SetDependencyResolverData(true, false);

            var rule = new PersonalizeRule<RuleContext>()
            {
                SelectionAttribute = "testAttr2",
                ExperimentId = "testExp2",
                CacheMinutes = 5
            };

            var item = new FakeItem().ToSitecoreItem();
            var renderingReference = new RenderingReference(item);
            var renderingReferenceUniqueId = renderingReference.UniqueId.Replace("{", string.Empty).Replace("}", string.Empty).ToLowerInvariant();
            var ruleContext = new ConditionalRenderingsRuleContext(new List<RenderingReference> { renderingReference }, renderingReference);
            var ruleStack = new RuleStack();

            using (new FakeSiteContextSwitcher(GetFakeSiteContext(false, false)))
            {
                rule.Evaluate(ruleContext, ruleStack);

                var context = personalizationContext.GetAllPersonalizations();
                context.Should().NotBeNull();
                context.Count().Should().Be(1);
                context.First().UniqueId.Should().BeEquivalentTo(renderingReferenceUniqueId);
                context.First().FriendlyId.Should().Be(rule.ExperimentId);
                context.First().SelectionAttr.Should().Be("Default");
                ruleContext.IsAborted.Should().BeFalse();
                ruleContext.SkipRule.Should().BeFalse();
                ruleStack.Count.Should().Be(1);
                ruleStack.Peek().Should().Be(false);
            }
        }

        [Fact]
        public void ValidateRule_False_NoData()
        {
            SetDependencyResolverData(false, false);

            var rule = new PersonalizeRule<RuleContext>()
            {
                SelectionAttribute = "testAttr2",
                ExperimentId = "testExp2",
                CacheMinutes = 5
            };

            var item = new FakeItem().ToSitecoreItem();
            var renderingReference = new RenderingReference(item);
            var renderingReferenceUniqueId = renderingReference.UniqueId.Replace("{", string.Empty).Replace("}", string.Empty).ToLowerInvariant();
            var ruleContext = new ConditionalRenderingsRuleContext(new List<RenderingReference> { renderingReference }, renderingReference);
            var ruleStack = new RuleStack();

            using (new FakeSiteContextSwitcher(GetFakeSiteContext(false, false)))
            {
                rule.Evaluate(ruleContext, ruleStack);

                var context = personalizationContext.GetAllPersonalizations();
                context.Should().NotBeNull();
                context.Count().Should().Be(1);
                context.First().UniqueId.Should().BeEquivalentTo(renderingReferenceUniqueId);
                context.First().FriendlyId.Should().Be(rule.ExperimentId);
                context.First().SelectionAttr.Should().Be("Default");
                ruleContext.IsAborted.Should().BeFalse();
                ruleContext.SkipRule.Should().BeFalse();
                ruleStack.Count.Should().Be(1);
                ruleStack.Peek().Should().Be(false);
            }
        }

        [Theory]
        [InlineData(false, true)]
        [InlineData(true, false)]
        public void RuleIsNotRun_ContextEmpty(bool enablePreview, bool enableExperienceEditor)
        {
            SetDependencyResolverData(false, false);

            var rule = new PersonalizeRule<RuleContext>()
            {
                SelectionAttribute = "testAttr2",
                ExperimentId = "testExp2",
                CacheMinutes = 5
            };

            using (new FakeSiteContextSwitcher(GetFakeSiteContext(enablePreview, enableExperienceEditor)))
            {
                var item = new FakeItem().ToSitecoreItem();
                var renderingReference = new RenderingReference(item);
                var ruleContext = new ConditionalRenderingsRuleContext(new List<RenderingReference> { renderingReference }, renderingReference);
                var ruleStack = new RuleStack();

                rule.Evaluate(ruleContext, ruleStack);

                var context = personalizationContext.GetAllPersonalizations();
                context.Should().BeEmpty();

                ruleContext.IsAborted.Should().BeFalse();
                ruleContext.SkipRule.Should().BeFalse();
                ruleStack.Count.Should().Be(1);
                ruleStack.Peek().Should().Be(false);
            }
        }

        [Theory]
        [InlineData(false, true)]
        [InlineData(true, false)]
        public void RuleIsNotRun_PersonalizationIsNotEnabled(bool consetGiven, bool personalizationEnabled)
        {
            SetDependencyResolverData(false, false, consetGiven, personalizationEnabled);

            var rule = new PersonalizeRule<RuleContext>()
            {
                SelectionAttribute = "testAttr2",
                ExperimentId = "testExp2",
                CacheMinutes = 5
            };

            using (new FakeSiteContextSwitcher(GetFakeSiteContext(false, false)))
            {
                var item = new FakeItem().ToSitecoreItem();
                var renderingReference = new RenderingReference(item);
                var ruleContext = new ConditionalRenderingsRuleContext(new List<RenderingReference> { renderingReference }, renderingReference);
                var ruleStack = new RuleStack();

                rule.Evaluate(ruleContext, ruleStack);

                var context = personalizationContext.GetAllPersonalizations();
                context.Should().BeEmpty();

                ruleContext.IsAborted.Should().BeFalse();
                ruleContext.SkipRule.Should().BeFalse();
                ruleStack.Count.Should().Be(1);
                ruleStack.Peek().Should().Be(false);
            }
        }

        [Fact]
        public void ValidateRule_Fail_NullResultMarketingChannelPersonalized()
        {
            // change initial params as PersonalizationService returns Default Result instead of null
            SetDependencyResolverData(false, false);

            var rule = new PersonalizeRule<RuleContext>()
            {
                SelectionAttribute = "testAttr2",
                ExperimentId = "testExp2",
                CacheMinutes = 5
            };

            var item = new FakeItem().ToSitecoreItem();
            var renderingReference = new RenderingReference(item);
            var renderingReferenceUniqueId = renderingReference.UniqueId.Replace("{", string.Empty).Replace("}", string.Empty).ToLowerInvariant();
            var ruleContext = new ConditionalRenderingsRuleContext(new List<RenderingReference> { renderingReference }, renderingReference);
            var ruleStack = new RuleStack();

            using (new FakeSiteContextSwitcher(GetFakeSiteContext(false, false)))
            {
                rule.Evaluate(ruleContext, ruleStack);

                var context = personalizationContext.GetAllPersonalizations();
                context.Should().NotBeNull();
                context.Count().Should().Be(1);
                context.First().UniqueId.Should().BeEquivalentTo(renderingReferenceUniqueId);
                context.First().FriendlyId.Should().Be(rule.ExperimentId);
                context.First().SelectionAttr.Should().Be("Default");
                ruleContext.IsAborted.Should().BeFalse();
                ruleContext.SkipRule.Should().BeFalse();
                ruleStack.Count.Should().Be(1);
                ruleStack.Peek().Should().Be(false);
            }
        }

        private SiteContext GetFakeSiteContext(bool enablePreview, bool enableExperienceEditor)
        {
            var siteContext = new SiteInfoPropertiesBuilder("TestContext");
            var site = siteContext.ToSiteContext();

            var value = enablePreview ? DisplayMode.Preview : enableExperienceEditor ? DisplayMode.Edit : DisplayMode.Normal;
            var field = site.GetType().GetField("displayMode", BindingFlags.NonPublic | BindingFlags.Instance);
            field.SetValue(site, value);
            return site;
        }

        private void SetDependencyResolverData(bool initContext, bool initServicePersonalizeCall, bool consent = true, bool personalization = true)
        {
            var personalizeService = Substitute.For<IPersonalizeService>();
            personalizationContext = new PersonalizationContext();
            var consentService = Substitute.For<IConsentService>();

            if (initContext)
            {
                personalizationContext.AddOrUpdatePersonalization("testExp", new PersonalizeResult { SelectionAttribute = "testAttr", Ctas = new[] { new PersonalizedCta { Token = "token", Url = "url/test/test?test" } } });
            }

            if (initServicePersonalizeCall)
            {
                personalizeService.GetPersonalizedExperience("testExp1", 5).Returns(new PersonalizeResult { SelectionAttribute = "testAttr1", Ctas = new[] { new PersonalizedCta { Token = "token", Url = "url/test/test?test" } } });
            }
            else
            {
                // service always returns default result
                personalizeService.GetPersonalizedExperience(Arg.Any<string>(), Arg.Any<int>()).Returns(new PersonalizeResult());
            }

            consentService.IsPersonalizationEnabled().Returns(personalization);
            consentService.IsPersonalizationConsentGiven().Returns(consent);

            var dependencyResolver = Substitute.For<IDependencyResolver>();
            dependencyResolver.GetService(typeof(IPersonalizationContext)).Returns(personalizationContext);
            dependencyResolver.GetService(typeof(IPersonalizeService)).Returns(personalizeService);
            dependencyResolver.GetService(typeof(IConsentService)).Returns(consentService);
            DependencyResolver.SetResolver(dependencyResolver);
        }
    }
}

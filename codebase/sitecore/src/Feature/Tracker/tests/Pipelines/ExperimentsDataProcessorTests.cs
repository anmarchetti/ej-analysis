using System.Collections.Generic;
using System.Web.Mvc;
using easyJet.Feature.Tracker.Models.Personalize;
using easyJet.Feature.Tracker.Pipelines.Personalize;
using easyJet.Feature.Tracker.Services.Personalize;
using FluentAssertions;
using NSubstitute;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;
using Xunit;

namespace easyJet.Feature.Tracker.Tests.Pipelines
{
    public class ExperimentsDataProcessorTests
    {
        [Fact]
        public void GetAllPersonalization_Success()
        {
            var personalizationContext = Substitute.For<IPersonalizationContext>();
            var personalizations = new List<Personalization>() { new Personalization() { FriendlyId = "test", SelectionAttr = "test" } };
            personalizationContext.GetAllPersonalizations().Returns(personalizations);
            var processor = new ExperimentsContextDataProcessor();

            var dependencyResolver = Substitute.For<IDependencyResolver>();
            dependencyResolver.GetService(typeof(IPersonalizationContext)).Returns(personalizationContext);
            DependencyResolver.SetResolver(dependencyResolver);

            var args = new GetLayoutServiceContextArgs();
            processor.Process(args);

            args.ContextData.Keys.Count.Should().Be(1);
            args.ContextData.Should().ContainKey(ExperimentsContextDataProcessor.ExperimentsPropertyName);
            args.ContextData[ExperimentsContextDataProcessor.ExperimentsPropertyName].Should().Be(personalizations);
        }
    }
}

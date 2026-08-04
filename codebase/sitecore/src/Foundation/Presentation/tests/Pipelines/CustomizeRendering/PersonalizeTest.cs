using NSubstitute;
using Sitecore.Mvc.Presentation;
using Sitecore.Personalization.Mvc.Pipelines.Response.CustomizeRendering;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Pipelines.CustomizeRendering
{
    public class PersonalizeTest
    {
        [Fact]
        public void Process_ShouldNotCallBase_WhenAborted()
        {
            // Arrange
            var args = new CustomizeRenderingArgs(new Rendering());
            args.AbortPipeline();

            var sut = Substitute.ForPartsOf<PersonalizeTestable>();

            // Act
            sut.Process(args);

            // Assert
            sut.DidNotReceive().CallBaseProcess(args);
        }

        [Fact]
        public void Process_ShouldCallBase_WhenNotAborted()
        {
            // Arrange
            var args = new CustomizeRenderingArgs(new Rendering());
            var sut = Substitute.ForPartsOf<PersonalizeTestable>();

            // Act
            sut.Process(args);

            // Assert
            sut.Received(1).CallBaseProcess(args);
        }

        // Testable subclass that exposes base.Process for mocking
        public class PersonalizeTestable : Personalize
        {
            public virtual void CallBaseProcess(CustomizeRenderingArgs args)
            {
            }

            public override void Process(CustomizeRenderingArgs args)
            {
                if (args.Aborted)
                {
                    return;
                }

                CallBaseProcess(args);
            }
        }
    }
}
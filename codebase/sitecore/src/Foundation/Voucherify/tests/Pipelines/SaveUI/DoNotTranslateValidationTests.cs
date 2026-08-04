using System;
using easyJet.Foundation.Voucherify.Pipelines.SaveUI;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Pipelines.SaveUI
{
    public class DoNotTranslateValidationTests
    {
        private readonly DoNotTranslateValidationProcessor processor;

        public DoNotTranslateValidationTests()
        {
            processor = new DoNotTranslateValidationProcessor();
        }

        [Fact]
        public void Process_ThrowArgumentNullException_IfArgsIsNull()
        {
            // Act
            Action actual = () => processor.Process(null);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }
    }
}

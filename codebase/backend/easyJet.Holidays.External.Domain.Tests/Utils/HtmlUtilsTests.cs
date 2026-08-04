using easyJet.Holidays.External.Domain.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Domain.Tests.Utils
{
    public class HtmlUtilsTests
    {
        [Theory]
        [InlineData(
            "<p style=\"MARGIN: 0cm 0cm 8pt\"><span style=\"FONT-FAMILY: Calibri\">There has been a recent change to the entry requirements for anyone travelling to Spain from the UK. You may need to provide proof of negative Covid test or appropriate vaccination status. Please keep checking the FCDO advice and sign up for their email alerts for entry requirements for Spain as it could change between booking and travelling. </span></p>",
            "<p><span>There has been a recent change to the entry requirements for anyone travelling to Spain from the UK. You may need to provide proof of negative Covid test or appropriate vaccination status. Please keep checking the FCDO advice and sign up for their email alerts for entry requirements for Spain as it could change between booking and travelling. </span></p>")]
        public void RemoveStylesAndScripts_InputHtmlWithStyleTags_StyleTagsRemoved(string inputHtml, string outputHtml)
        {
            // Act
            var result = HtmlUtils.RemoveStylesAndScripts(inputHtml);

            // Assert
            result.Should().BeEquivalentTo(outputHtml);
        }

        [Theory]
        [InlineData(
            "<script>alert(\"hello\")</script>", "")]
        public void RemoveStylesAndScripts_InputHtmlIsOnlyScript_EmptyOutput(string inputHtml, string outputHtml)
        {
            // Act
            var result = HtmlUtils.RemoveStylesAndScripts(inputHtml);

            // Assert
            result.Should().BeEquivalentTo(outputHtml);
        }

        [Theory]
        [InlineData(
            "<p style=\"MARGIN: 0cm 0cm 8pt\"><span style=\"FONT-FAMILY: Calibri\">There has been a recent change to the entry requirements for anyone travelling to Spain from the UK. You may need to provide proof of negative Covid test or appropriate vaccination status. Please keep checking the FCDO advice and sign up for their email alerts for entry requirements for Spain as it could change between booking and travelling. </span><script>alert(\"hello\")</script></p>",
            "<p><span>There has been a recent change to the entry requirements for anyone travelling to Spain from the UK. You may need to provide proof of negative Covid test or appropriate vaccination status. Please keep checking the FCDO advice and sign up for their email alerts for entry requirements for Spain as it could change between booking and travelling. </span></p>")]
        public void RemoveStylesAndScripts_InputHtmlWithScriptNodesAndStyleTags_ScriptAndStylesRemoved(string inputHtml, string outputHtml)
        {
            // Act
            var result = HtmlUtils.RemoveStylesAndScripts(inputHtml);

            // Assert
            result.Should().BeEquivalentTo(outputHtml);
        }

        [Theory]
        [InlineData(
            "<p><span>There has been a recent change to the entry requirements for anyone travelling to Spain from the UK. You may need to provide proof of negative Covid test or appropriate vaccination status. Please keep checking the FCDO advice and sign up for their email alerts for entry requirements for Spain as it could change between booking and travelling. </span></p>",
            "<p><span>There has been a recent change to the entry requirements for anyone travelling to Spain from the UK. You may need to provide proof of negative Covid test or appropriate vaccination status. Please keep checking the FCDO advice and sign up for their email alerts for entry requirements for Spain as it could change between booking and travelling. </span></p>")]
        public void RemoveStylesAndScripts_InputHtmlWithoutScriptsAndTags_HtmlRemainsTheSame(string inputHtml, string outputHtml)
        {
            // Act
            var result = HtmlUtils.RemoveStylesAndScripts(inputHtml);

            // Assert
            result.Should().BeEquivalentTo(outputHtml);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData(" ")]
        public void RemoveStylesAndScripts_InputHtmlEmptyOrNull_ReturnEmptyOrNull(string inputHtml)
        {
            // Act
            var result = HtmlUtils.RemoveStylesAndScripts(inputHtml);

            // Assert
            result.Should().BeNullOrWhiteSpace();
        }
    }
}
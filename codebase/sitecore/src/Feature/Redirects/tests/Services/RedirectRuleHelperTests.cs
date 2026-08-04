using System.Text.RegularExpressions;
using easyJet.Feature.Redirects.Models;
using easyJet.Feature.Redirects.Services;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Feature.Redirects.Tests.Services
{
    public class RedirectRuleHelperTests
    {
        [Theory]
        [InlineData(" /EN/Path/?q=1 ", "/en/path")]
        [InlineData("http://example.com/EN/Path/", "/en/path")]
        [InlineData("en/path", "/en/path")]
        public void NormalizeUrl_ShouldReturnNormalizedPath(string input, string expected)
        {
            // Act
            var actual = RedirectRuleHelper.NormalizeUrl(input);

            // Assert
            actual.Should().Be(expected);
        }

        [Fact]
        public void NormalizePattern_ShouldPreserveRegex()
        {
            // Arrange
            var pattern = "^/destinations(.*)$";

            // Act
            var actual = RedirectRuleHelper.NormalizePattern(pattern);

            // Assert
            actual.Should().Be(pattern);
        }

        [Fact]
        public void NormalizePattern_ShouldNormalizeAbsoluteUrl()
        {
            // Act
            var actual = RedirectRuleHelper.NormalizePattern("https://example.com/Deals/");

            // Assert
            actual.Should().Be("/deals");
        }

        [Fact]
        public void IsWildcardPattern_ShouldDetectWildcards()
        {
            // Act / Assert
            RedirectRuleHelper.IsWildcardPattern("/sale/*").Should().BeTrue();
            RedirectRuleHelper.IsWildcardPattern("^/sale(.*)$").Should().BeFalse();
        }

        [Fact]
        public void IsRegexPattern_ShouldDetectRegex()
        {
            // Act / Assert
            RedirectRuleHelper.IsRegexPattern("^/sale(.*)$").Should().BeTrue();
            RedirectRuleHelper.IsRegexPattern(".*/spain/costa").Should().BeTrue();
            RedirectRuleHelper.IsRegexPattern("/sale/*").Should().BeFalse();
        }

        [Fact]
        public void BuildWildcardRegex_ShouldMatchWildcardPattern()
        {
            // Act
            Regex regex = RedirectRuleHelper.BuildWildcardRegex("/sale/*");

            // Assert
            regex.IsMatch("/sale/item").Should().BeTrue();
            regex.IsMatch("/sales/item").Should().BeFalse();
        }

        [Fact]
        public void GetSpecificityScore_ShouldIgnoreWildcards()
        {
            // Act
            var score = RedirectRuleHelper.GetSpecificityScore("/a*b");

            // Assert
            score.Should().Be(3);
        }

        [Fact]
        public void GetLeadingPathSegment_ShouldReadFromAbsoluteAndRelativeUrls()
        {
            // Act / Assert
            RedirectRuleHelper.GetLeadingPathSegment("https://example.com/CH-DE/path?q=1").Should().Be("CH-DE");
            RedirectRuleHelper.GetLeadingPathSegment("/fr/some/path").Should().Be("fr");
            RedirectRuleHelper.GetLeadingPathSegment("de/some/path#anchor").Should().Be("de");
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("  ")]
        public void GetLeadingPathSegment_ShouldReturnEmpty_WhenInputIsBlank(string input)
        {
            // Act
            var segment = RedirectRuleHelper.GetLeadingPathSegment(input);

            // Assert
            segment.Should().BeEmpty();
        }

        [Fact]
        public void GetLeadingPathSegment_ShouldTrimRelativeQueryString()
        {
            // Act
            var segment = RedirectRuleHelper.GetLeadingPathSegment("de/path?x=1");

            // Assert
            segment.Should().Be("de");
        }

        [Theory]
        [InlineData("?x=1")]
        [InlineData("#anchor")]
        [InlineData(" ?x=1")]
        [InlineData(" #anchor")]
        public void GetLeadingPathSegment_ShouldReturnEmpty_WhenPathIsEmptyAfterQueryOrHashTrim(string input)
        {
            // Act
            var segment = RedirectRuleHelper.GetLeadingPathSegment(input);

            // Assert
            segment.Should().BeEmpty();
        }

        [Fact]
        public void ResolveLanguageFromUrl_ShouldUseLanguageMap()
        {
            // Act / Assert
            RedirectRuleHelper.ResolveLanguageFromUrl("/ch-fr/offers").Name.Should().Be("fr-CH");
            RedirectRuleHelper.ResolveLanguageFromUrl("https://example.com/DE/page").Name.Should().Be("de-DE");
        }

        [Fact]
        public void ResolveLanguageFromUrl_ShouldReturnNull_WhenSegmentNotMapped()
        {
            // Act
            var language = RedirectRuleHelper.ResolveLanguageFromUrl("/pl/page");

            // Assert
            language.Should().BeNull();
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ResolveLanguageFromUrl_ShouldReturnNull_WhenUrlIsBlank(string input)
        {
            // Act
            var language = RedirectRuleHelper.ResolveLanguageFromUrl(input);

            // Assert
            language.Should().BeNull();
        }

        [Fact]
        public void BuildLanguageMaps_ShouldBuildBothMaps_InSingleResult()
        {
            // Arrange
            using (var db = new Db())
            {
                var languagesRoot = new DbItem("Languages", ID.NewID)
                {
                    ParentID = Sitecore.ItemIDs.SystemRoot
                };
                db.Add(languagesRoot);

                var deItem = new DbItem("de-DE", ID.NewID)
                {
                    ParentID = languagesRoot.ID
                };
                deItem.Fields.Add(new DbField(Sitecore.FieldIDs.DisplayName) { Value = "German (Germany)" });
                db.Add(deItem);

                // Act
                var maps = RedirectRuleHelper.BuildLanguageMaps(db.Database);

                // Assert
                maps.NamesById.Keys.Should().Contain(deItem.ID);
                maps.NamesById[deItem.ID].Should().Be("de-DE");
                maps.IdsByName.Keys.Should().Contain("de-DE");
                maps.IdsByName["de-DE"].Should().Be(deItem.ID.ToString());
            }
        }

        [Fact]
        public void GetItemLanguages_ShouldResolveNamesToIds_FromMap()
        {
            // Arrange
            var map = new System.Collections.Generic.Dictionary<string, string>(System.StringComparer.OrdinalIgnoreCase)
            {
                ["de-DE"] = "{11111111-1111-1111-1111-111111111111}",
                ["fr-FR"] = "{22222222-2222-2222-2222-222222222222}"
            };

            // Act
            var value = RedirectRuleHelper.GetItemLanguages(" de-de, fr-fr, unknown ", map);

            // Assert
            value.Should().Be("{11111111-1111-1111-1111-111111111111}|{22222222-2222-2222-2222-222222222222}");
        }

        [Fact]
        public void GetRuleLanguages_ShouldResolveIdsToNames_FromMap()
        {
            // Arrange
            var id1 = ID.NewID;
            var id2 = ID.NewID;
            var ruleId = ID.NewID;
            var maps = new System.Collections.Generic.Dictionary<ID, string>
            {
                [id1] = "de-DE",
                [id2] = "fr-FR"
            };

            using (var db = new Db())
            {
                AddRuleTemplate(db);
                var rule = new DbItem("rule", ruleId, Templates.RedirectRule.ID)
                {
                    ParentID = Sitecore.ItemIDs.ContentRoot
                };
                rule.Add(Templates.RedirectRule.Fields.Languages, $"{id1}|{id2}|{ID.NewID}");
                db.Add(rule);

                // Act
                var result = RedirectRuleHelper.GetRuleLanguageNames(db.GetItem(ruleId), maps);

                // Assert
                result.Should().Contain("de-DE");
                result.Should().Contain("fr-FR");
                result.Count.Should().Be(2);
            }
        }

        private static void AddRuleTemplate(Db db)
        {
            var ruleTemplate = new DbTemplate("Redirect Rule", Templates.RedirectRule.ID);
            ruleTemplate.Add(Templates.RedirectRule.Fields.Languages, "Languages");
            db.Add(ruleTemplate);
        }

        [Fact]
        public void ToHotelRedirectRuleUrl_ShouldNormalizeAndStripParentPagesSegment()
        {
            var result = RedirectRuleHelper.ToHotelRedirectRuleUrl("/Spain/Hotel/");

            result.Should().Be("/spain/hotel");
        }
    }
}

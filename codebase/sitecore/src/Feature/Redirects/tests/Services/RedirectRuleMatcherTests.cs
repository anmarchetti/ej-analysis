using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using AutoFixture.Xunit2;
using easyJet.Feature.Redirects.Models;
using easyJet.Feature.Redirects.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.Redirects.Tests.Services
{
    [Collection("SitecoreSettings")]
    public class RedirectRuleMatcherTests
    {
        [Fact]
        public void FindMatch_ShouldReturnNull_WhenUrlMissing()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(0);
            var matcher = new RedirectRuleMatcher(repository, settings);

            // Act
            var result = matcher.FindMatch(string.Empty, null);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void FindMatch_ShouldReturnNull_WhenDatabaseMissing()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(0);
            var matcher = new RedirectRuleMatcher(repository, settings);

            // Act
            var result = matcher.FindMatch("/from", null);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void FindMatch_ShouldPreferExactMatch_OverWildcard()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            var rules = new List<RedirectRuleItem>
            {
                new RedirectRuleItem
                {
                    Id = ID.NewID,
                    FromUrl = "/l*ndon",
                    ToUrl = "/wildcard",
                    RedirectType = 302,
                    Priority = 50,
                    SortOrder = 0,
                    Created = DateTime.UtcNow.AddMinutes(-5)
                },
                new RedirectRuleItem
                {
                    Id = ID.NewID,
                    FromUrl = "/london",
                    ToUrl = "/exact",
                    RedirectType = 301,
                    Priority = 0,
                    SortOrder = 10,
                    Created = DateTime.UtcNow
                }
            };
            repository.GetRules(Arg.Any<Sitecore.Data.Database>()).Returns(rules);

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(0);
            var matcher = new RedirectRuleMatcher(repository, settings);

            var database = FakeUtil.FakeDatabase();

            // Act
            var result = matcher.FindMatch("/london", database);

            // Assert
            result.Should().NotBeNull();
            result.ToUrl.Should().Be("/exact");
            result.RedirectType.Should().Be(301);

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldUseHighestPriority_WhenMultiplePatternsMatch()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            var rules = new List<RedirectRuleItem>
            {
                new RedirectRuleItem
                {
                    Id = ID.NewID,
                    FromUrl = "/sale/*",
                    ToUrl = "/low",
                    RedirectType = 301,
                    Priority = 1,
                    SortOrder = 0,
                    Created = DateTime.UtcNow.AddMinutes(-10)
                },
                new RedirectRuleItem
                {
                    Id = ID.NewID,
                    FromUrl = "/sale/*",
                    ToUrl = "/high",
                    RedirectType = 302,
                    Priority = 10,
                    SortOrder = 0,
                    Created = DateTime.UtcNow.AddMinutes(-10)
                }
            };
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(rules);

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(0);
            var matcher = new RedirectRuleMatcher(repository, settings);

            var database = FakeUtil.FakeDatabase();

            // Act
            var result = matcher.FindMatch("/sale/item", database);

            // Assert
            result.Should().NotBeNull();
            result.ToUrl.Should().Be("/high");
            result.RedirectType.Should().Be(302);

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldMatchRegexAgainstFullUrl_WhenPatternIsAbsolute()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            var rules = new List<RedirectRuleItem>
            {
                new RedirectRuleItem
                {
                    Id = ID.NewID,
                    FromUrl = "^http://www.easyjet.com/en/holidays/luxembourg(.*)$",
                    ToUrl = "/city-breaks$1",
                    RedirectType = 301,
                    Priority = 5,
                    SortOrder = 0,
                    Created = DateTime.UtcNow
                }
            };
            repository.GetRules(Arg.Any<Sitecore.Data.Database>()).Returns(rules);

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(0);
            var matcher = new RedirectRuleMatcher(repository, settings);

            var database = FakeUtil.FakeDatabase();

            // Act
            var result = matcher.FindMatch("http://www.easyjet.com/en/holidays/luxembourg/test", database);

            // Assert
            result.Should().NotBeNull();
            result.ToUrl.Should().Be("/city-breaks/test");

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldMatchPathSuffix_WhenRuleStartsWithSlash()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/spain/costa-blanca/benidorm/palm-beach",
                        ToUrl = "/spain/costa-blanca/benidorm/hotel-benidorm-east",
                        RedirectType = 301,
                        Priority = 0
                    }
                });

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(0);
            var matcher = new RedirectRuleMatcher(repository, settings);

            var database = FakeUtil.FakeDatabase();

            // Act
            var result = matcher.FindMatch("https://www.easyjet.com/en/holidays/spain/costa-blanca/benidorm/palm-beach", database);

            // Assert
            result.Should().NotBeNull();
            result.ToUrl.Should().Be("/spain/costa-blanca/benidorm/hotel-benidorm-east");

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldSkipRule_WhenTemplateDoesNotMatchFilter()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            var templateId = ID.NewID;
            var rules = new List<RedirectRuleItem>
            {
                new RedirectRuleItem
                {
                    Id = ID.NewID,
                    FromUrl = "/page",
                    ToUrl = "/no-match",
                    RedirectType = 301,
                    Priority = 20,
                    FilterPageTypeIds = new HashSet<ID> { ID.NewID },
                    SortOrder = 0,
                    Created = DateTime.UtcNow.AddMinutes(-5)
                },
                new RedirectRuleItem
                {
                    Id = ID.NewID,
                    FromUrl = "/page",
                    ToUrl = "/match",
                    RedirectType = 302,
                    Priority = 1,
                    FilterPageTypeIds = new HashSet<ID> { templateId },
                    SortOrder = 0,
                    Created = DateTime.UtcNow.AddMinutes(-1)
                }
            };
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(rules);

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(0);
            var matcher = new RedirectRuleMatcher(repository, settings);

            var database = FakeUtil.FakeDatabase();

            // Act
            var result = matcher.FindMatch("/page", database, templateId);

            // Assert
            result.Should().NotBeNull();
            result.ToUrl.Should().Be("/match");
            result.RedirectType.Should().Be(302);

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldSkipInvalidRegexRules()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "^(invalid(",
                        ToUrl = "/target",
                        RedirectType = 301,
                        Priority = 0
                    }
                });

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(0);
            var matcher = new RedirectRuleMatcher(repository, settings);

            var database = FakeUtil.FakeDatabase();

            // Act
            var result = matcher.FindMatch("/from", database);

            // Assert
            result.Should().BeNull();

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldReturnOriginalTarget_WhenRegexReplacementInvalid()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "^/deal/(.*)$",
                        ToUrl = "$99",
                        RedirectType = 301,
                        Priority = 0
                    }
                });

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(0);
            var matcher = new RedirectRuleMatcher(repository, settings);

            var database = FakeUtil.FakeDatabase();

            // Act
            var result = matcher.FindMatch("/deal/item", database);

            // Assert
            result.Should().NotBeNull();
            result.ToUrl.Should().Be("$99");

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldUseCachedResult()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/cached",
                        ToUrl = "/target",
                        RedirectType = 301,
                        Priority = 0
                    }
                });

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(5);
            var matcher = new RedirectRuleMatcher(repository, settings);

            var database = FakeUtil.FakeDatabase();
            // Act
            var first = matcher.FindMatch("/cached", database);
            var second = matcher.FindMatch("/cached", database);

            // Assert
            first.Should().NotBeNull();
            second.Should().NotBeNull();
            second.ToUrl.Should().Be("/target");
            repository.Received(1).GetRules(Arg.Any<Sitecore.Data.Database>());

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldSkipRule_WhenLanguageNameDoesNotMatch()
        {
            // Arrange
            var repository = Substitute.For<IRedirectRuleRepository>();
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/offers",
                        ToUrl = "/de-only",
                        RedirectType = 301,
                        Languages = "de-DE",
                        LanguageNames = ImmutableHashSet.Create(StringComparer.OrdinalIgnoreCase, "de-DE")
                    },
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/offers",
                        ToUrl = "/fr-only",
                        RedirectType = 302,
                        Languages = "fr-FR",
                        LanguageNames = ImmutableHashSet.Create(StringComparer.OrdinalIgnoreCase, "fr-FR")
                    }
                });

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(0);
            var matcher = new RedirectRuleMatcher(repository, settings);

            using (var db = new Db())
            {
                // Act
                var result = matcher.FindMatch("/offers", db.Database, language: Language.Parse("fr-FR"));

                // Assert
                result.Should().NotBeNull();
                result.ToUrl.Should().Be("/fr-only");
                result.RedirectType.Should().Be(302);
            }

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldMatchExactRuleByLanguage_WhenSameUrlHasMultipleRules()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/offers",
                        ToUrl = "/de-only",
                        RedirectType = 301,
                        Priority = 10,
                        LanguageNames = ImmutableHashSet.Create(StringComparer.OrdinalIgnoreCase, "de-DE")
                    },
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/offers",
                        ToUrl = "/fr-only",
                        RedirectType = 302,
                        Priority = 20,
                        LanguageNames = ImmutableHashSet.Create(StringComparer.OrdinalIgnoreCase, "fr-FR")
                    }
                });

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(0);
            var matcher = new RedirectRuleMatcher(repository, settings);

            using (var db = new Db())
            {
                // Act
                var result = matcher.FindMatch("/offers", db.Database, language: Language.Parse("de-DE"));

                // Assert
                result.Should().NotBeNull();
                result.ToUrl.Should().Be("/de-only");
                result.RedirectType.Should().Be(301);
            }

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldCacheCorrectly_WithNullTemplateId()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/test",
                        ToUrl = "/target",
                        RedirectType = 301,
                        Priority = 0
                    }
                });

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(5);
            var matcher = new RedirectRuleMatcher(repository, settings);

            using (var db = new Db())
            {
                // Act - First call with null templateId
                var result1 = matcher.FindMatch("/test", db.Database, templateId: null);
                // Second call with null templateId should use cache
                var result2 = matcher.FindMatch("/test", db.Database, templateId: null);

                // Assert
                result1.Should().NotBeNull();
                result2.Should().NotBeNull();
                result1.ToUrl.Should().Be(result2.ToUrl);
                // Repository should only be called once (caching works)
                repository.Received(1).GetRules(Arg.Any<Sitecore.Data.Database>());
            }

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldCacheCorrectly_WithIDNull()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/test",
                        ToUrl = "/target",
                        RedirectType = 301,
                        Priority = 0
                    }
                });

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(5);
            var matcher = new RedirectRuleMatcher(repository, settings);

            using (var db = new Db())
            {
                // Act - First call with ID.Null
                var result1 = matcher.FindMatch("/test", db.Database, templateId: ID.Null);
                // Second call with ID.Null should use cache
                var result2 = matcher.FindMatch("/test", db.Database, templateId: ID.Null);

                // Assert
                result1.Should().NotBeNull();
                result2.Should().NotBeNull();
                result1.ToUrl.Should().Be(result2.ToUrl);
                // Repository should only be called once (caching works)
                repository.Received(1).GetRules(Arg.Any<Sitecore.Data.Database>());

                matcher.ClearCache();
            }
        }

        [Fact]
        public void FindMatch_ShouldCacheCorrectly_WithNullLanguage()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/test",
                        ToUrl = "/target",
                        RedirectType = 301,
                        Priority = 0
                    }
                });

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(5);
            var matcher = new RedirectRuleMatcher(repository, settings);

            using (var db = new Db())
            {
                // Act - First call with null language
                var result1 = matcher.FindMatch("/test", db.Database, language: null);
                // Second call with null language should use cache
                var result2 = matcher.FindMatch("/test", db.Database, language: null);

                // Assert
                result1.Should().NotBeNull();
                result2.Should().NotBeNull();
                result1.ToUrl.Should().Be(result2.ToUrl);
                // Repository should only be called once (caching works)
                repository.Received(1).GetRules(Arg.Any<Sitecore.Data.Database>());
            }

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldUseDifferentCache_ForDifferentTemplateIds()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var templateId1 = ID.NewID;
            var templateId2 = ID.NewID;
            var repository = Substitute.For<IRedirectRuleRepository>();
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/test",
                        ToUrl = "/target1",
                        RedirectType = 301,
                        Priority = 10,
                        FilterPageTypeIds = new HashSet<ID> { templateId1 }
                    },
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/test",
                        ToUrl = "/target2",
                        RedirectType = 302,
                        Priority = 5,
                        FilterPageTypeIds = new HashSet<ID> { templateId2 }
                    }
                });

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(5);
            var matcher = new RedirectRuleMatcher(repository, settings);

            using (var db = new Db())
            {
                // Act
                var result1 = matcher.FindMatch("/test", db.Database, templateId: templateId1);
                var result2 = matcher.FindMatch("/test", db.Database, templateId: templateId2);

                // Assert - Different template IDs should produce different results
                result1.Should().NotBeNull();
                result2.Should().NotBeNull();
                result1.ToUrl.Should().Be("/target1");
                result2.ToUrl.Should().Be("/target2");
                result1.RedirectType.Should().Be(301);
                result2.RedirectType.Should().Be(302);
            }

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldUseDifferentCache_ForDifferentLanguages()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/en-page",
                        ToUrl = "/en-target",
                        RedirectType = 301,
                        Priority = 0,
                        Languages = "en"
                    },
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/de-page",
                        ToUrl = "/de-target",
                        RedirectType = 302,
                        Priority = 0,
                        Languages = "de-DE"
                    }
                });

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(5);
            var matcher = new RedirectRuleMatcher(repository, settings);

            using (var db = new Db())
            {
                // Act - Each call with different URL and language should cache separately
                var result1 = matcher.FindMatch("/en-page", db.Database, language: Language.Parse("en"));
                var result2 = matcher.FindMatch("/de-page", db.Database, language: Language.Parse("de-DE"));

                // Call again to verify caching works for each combination
                var result1Cached = matcher.FindMatch("/en-page", db.Database, language: Language.Parse("en"));
                var result2Cached = matcher.FindMatch("/de-page", db.Database, language: Language.Parse("de-DE"));

                // Assert - Different languages should produce different cached results
                result1.Should().NotBeNull();
                result2.Should().NotBeNull();
                result1.ToUrl.Should().Be("/en-target");
                result2.ToUrl.Should().Be("/de-target");
                result1.RedirectType.Should().Be(301);
                result2.RedirectType.Should().Be(302);

                // Verify cached results match
                result1Cached.ToUrl.Should().Be(result1.ToUrl);
                result2Cached.ToUrl.Should().Be(result2.ToUrl);

                // Repository should only be called once (all subsequent calls use cache)
                repository.Received(1).GetRules(Arg.Any<Sitecore.Data.Database>());
            }

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldTreatNullAndIDNullAsSame_ForCaching()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/test",
                        ToUrl = "/target",
                        RedirectType = 301,
                        Priority = 0
                    }
                });

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(5);
            var matcher = new RedirectRuleMatcher(repository, settings);

            using (var db = new Db())
            {
                // Act - First call with null, second with ID.Null
                var result1 = matcher.FindMatch("/test", db.Database, templateId: null);
                var result2 = matcher.FindMatch("/test", db.Database, templateId: ID.Null);

                // Assert - Both should use the same cache (both resolve to empty string)
                result1.Should().NotBeNull();
                result2.Should().NotBeNull();
                result1.ToUrl.Should().Be(result2.ToUrl);
                // Since both produce the same cache key, the second call should be cached
                repository.Received(1).GetRules(Arg.Any<Sitecore.Data.Database>());
            }

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldCacheCorrectly_WithAllParametersNull()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var repository = Substitute.For<IRedirectRuleRepository>();
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/test",
                        ToUrl = "/target",
                        RedirectType = 301,
                        Priority = 0
                    }
                });

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(5);
            var matcher = new RedirectRuleMatcher(repository, settings);

            using (var db = new Db())
            {
                // Act - Both calls with null template and language
                var result1 = matcher.FindMatch("/test", db.Database, templateId: null, language: null);
                var result2 = matcher.FindMatch("/test", db.Database, templateId: null, language: null);

                // Assert
                result1.Should().NotBeNull();
                result2.Should().NotBeNull();
                result1.ToUrl.Should().Be("/target");
                result2.ToUrl.Should().Be("/target");
                // Repository should only be called once (caching works)
                repository.Received(1).GetRules(Arg.Any<Sitecore.Data.Database>());
            }

            matcher.ClearCache();
        }

        [Fact]
        public void FindMatch_ShouldCacheCorrectly_WithMixedValidAndNullParameters()
        {
            // Arrange
            RedirectRulesCache.ClearAll();
            var templateId = ID.NewID;
            var repository = Substitute.For<IRedirectRuleRepository>();
            repository.GetRules(Arg.Any<Sitecore.Data.Database>())
                .Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/test",
                        ToUrl = "/target",
                        RedirectType = 301,
                        Priority = 0
                    }
                });

            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(5);
            var matcher = new RedirectRuleMatcher(repository, settings);

            using (var db = new Db())
            {
                // Act - Different combinations should create different cache keys
                var result1 = matcher.FindMatch("/test", db.Database, templateId: templateId, language: null);
                var result2 = matcher.FindMatch("/test", db.Database, templateId: null, language: Language.Parse("en"));
                var result3 = matcher.FindMatch("/test", db.Database, templateId: templateId, language: Language.Parse("en"));

                // Assert - All should return valid results
                result1.Should().NotBeNull();
                result2.Should().NotBeNull();
                result3.Should().NotBeNull();

                // All three should have been resolved (different cache keys)
                result1.ToUrl.Should().Be("/target");
                result2.ToUrl.Should().Be("/target");
                result3.ToUrl.Should().Be("/target");
            }

            matcher.ClearCache();
        }
    }
}
using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Services;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Services;

public class AtcomRequestGeneratorTests
{
    private const string DefaultMarketCode = "UK";

    [Fact]
    public void DefaultAgentGroup_ShouldBeDefault()
    {
        AtcomRequestGenerator.DefaultAgentGroup.Should().Be("default");
    }

    [Fact]
    public void GetCurrentAtcomLanguage_ShouldMapFromLanguageService()
    {
        var sut = CreateSut(language: "fr-FR");

        var result = sut.GetCurrentAtcomLanguage();

        result.Should().Be("fr_FR");
    }

    [Fact]
    public void BuildCltInfo_WithNullPromotionKeys_ShouldUseDefaultGroup_WhenAgentIsNull()
    {
        var sut = CreateSut();

        var result = sut.BuildCltInfo(DefaultMarketCode, "en-GB", currentAgent: null, promotionAgentKey: null);

        result.Agt_No.Should().Be("DEFAULT-AGENT-UK");
        result.User_Name.Should().Be("DEFAULT-USER-UK");
        result.Exp_No.Should().BeEmpty();
        result.Locale.Should().Be("en_EN");
        result.TermCode.Should().Be("TERM");
        result.Chan.Should().Be("CHANNEL");
    }

    [Fact]
    public void BuildCltInfo_WithEmptyPromotionKeys_ShouldUseDefaultGroup()
    {
        var sut = CreateSut();

        var result = sut.BuildCltInfo(DefaultMarketCode, "en-GB", currentAgent: null, promotionAgentKey: new List<string>());

        result.Agt_No.Should().Be("DEFAULT-AGENT-UK");
        result.User_Name.Should().Be("DEFAULT-USER-UK");
    }

    [Fact]
    public void BuildCltInfo_WithMatchingPromotionAgentKeyAndMarket_ShouldUsePromotionGroup()
    {
        var sut = CreateSut();

        var result = sut.BuildCltInfo(DefaultMarketCode, "en-GB", currentAgent: null, promotionAgentKey: new List<string> { "promo" });

        result.Agt_No.Should().Be("PROMO-AGENT-UK");
        result.User_Name.Should().Be("PROMO-USER-UK");
    }

    [Fact]
    public void BuildCltInfo_WithPromotionAgentKeyWithoutMarketMapping_ShouldFallbackToDefault()
    {
        var sut = CreateSut();

        var result = sut.BuildCltInfo(DefaultMarketCode, "en-GB", currentAgent: null, promotionAgentKey: new List<string> { "promoNoMarket" });

        result.Agt_No.Should().Be("DEFAULT-AGENT-UK");
        result.User_Name.Should().Be("DEFAULT-USER-UK");
    }

    [Fact]
    public void BuildCltInfo_WithUnknownPromotionAgentKey_ShouldFallbackToDefault()
    {
        var sut = CreateSut();

        var result = sut.BuildCltInfo(DefaultMarketCode, "en-GB", currentAgent: null, promotionAgentKey: new List<string> { "unknown" });

        result.Agt_No.Should().Be("DEFAULT-AGENT-UK");
        result.User_Name.Should().Be("DEFAULT-USER-UK");
    }

    [Fact]
    public void BuildCltInfo_WithCurrentAgent_ShouldUseAgentAndTradePortalUsername()
    {
        var sut = CreateSut();
        var agent = new AgentDetails { Number = "12345", Name = "Agent Name" };

        var result = sut.BuildCltInfo(DefaultMarketCode, "de-DE", agent, isAgentRequired: true);

        result.Agt_No.Should().Be("12345");
        result.User_Name.Should().Be("TRADE-PORTAL-USER");
        result.Exp_No.Should().Be("Agent Name");
        result.Locale.Should().Be("de_DE");
    }

    [Fact]
    public void BuildCltInfo_WhenAgentNotRequired_ShouldClearAgentNumber()
    {
        var sut = CreateSut();
        var agent = new AgentDetails { Number = "12345", Name = "Agent Name" };

        var result = sut.BuildCltInfo(DefaultMarketCode, "en-GB", agent, isAgentRequired: false);

        result.Agt_No.Should().BeEmpty();
        result.User_Name.Should().Be("TRADE-PORTAL-USER");
    }

    [Fact]
    public void BuildCltInfo_WithServiceCurrentAgent_ShouldUseFirstOverloadAndAgentDetails()
    {
        var currentAgent = new AgentDetails { Number = "87654", Name = "Current Agent" };
        var sut = CreateSut(currentAgent: currentAgent);

        var result = sut.BuildCltInfo(DefaultMarketCode, "en-GB", isAgentRequired: true, promotionAgentKeys: null);

        result.Agt_No.Should().Be("87654");
        result.User_Name.Should().Be("TRADE-PORTAL-USER");
        result.Exp_No.Should().Be("Current Agent");
    }

    [Fact]
    public void BuildCurrentCltInfo_ShouldUseCurrentMarketAndLanguage()
    {
        var sut = CreateSut(language: "de-DE", currentMarketCode: DefaultMarketCode);

        var result = sut.BuildCurrentCltInfo();

        result.Locale.Should().Be("de_DE");
        result.Agt_No.Should().Be("DEFAULT-AGENT-UK");
        result.User_Name.Should().Be("DEFAULT-USER-UK");
    }

    [Fact]
    public void BuildCurrentCltInfo_WithNullCurrentMarket_ShouldUseEmptyMarketCodeWithoutThrowing()
    {
        var sut = CreateSut(language: "en-GB", currentMarketCode: null);

        var result = sut.BuildCurrentCltInfo();

        result.Locale.Should().Be("en_EN");
        result.Agt_No.Should().BeNull();
        result.User_Name.Should().BeNull();
    }

    [Fact]
    public void BuildCltInfo_WhenAtcomCltInfoIsNull_ShouldThrowArgumentNullException()
    {
        var atcomSettings = new AtcomSettings { CltInfo = null };
        var options = Options.Create(atcomSettings);
        var authServiceMock = new Mock<ITradeAgentAuthenticationService>();
        var marketServiceMock = new Mock<IMarketService>();
        var languageServiceMock = new Mock<ILanguageService>();
        var sut = new AtcomRequestGenerator(options, authServiceMock.Object, marketServiceMock.Object, languageServiceMock.Object);

        var act = () => sut.BuildCltInfo(DefaultMarketCode, "en-GB", currentAgent: null);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void UseSupplierId_WithNonEmptySupplierId_ShouldOverrideAgentNumber()
    {
        var sut = CreateSut();
        var cltInfo = sut.BuildCltInfo(DefaultMarketCode, "en-GB", currentAgent: null);

        var result = sut.UseSupplierId(cltInfo, "SUP-1");

        result.Agt_No.Should().Be("SUP-1");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void UseSupplierId_WithNullOrEmptySupplierId_ShouldNotChangeAgentNumber(string supplierId)
    {
        var sut = CreateSut();
        var cltInfo = sut.BuildCltInfo(DefaultMarketCode, "en-GB", currentAgent: null);

        var result = sut.UseSupplierId(cltInfo, supplierId);

        result.Agt_No.Should().Be("DEFAULT-AGENT-UK");
    }

    private static AtcomRequestGenerator CreateSut(string language = "en-GB", string currentMarketCode = DefaultMarketCode, AgentDetails currentAgent = null)
    {
        var options = Options.Create(CreateAtcomSettings());

        var authServiceMock = new Mock<ITradeAgentAuthenticationService>();
        authServiceMock.Setup(x => x.GetCurrentAgent()).Returns(currentAgent);

        var marketServiceMock = new Mock<IMarketService>();
        marketServiceMock.Setup(x => x.GetCurrentMarket()).Returns(currentMarketCode == null ? null! : new MarketSettings { Code = currentMarketCode });

        var languageServiceMock = new Mock<ILanguageService>();
        languageServiceMock.Setup(x => x.GetCurrentLanguage()).Returns(language);

        return new AtcomRequestGenerator(options, authServiceMock.Object, marketServiceMock.Object, languageServiceMock.Object);
    }

    private static AtcomSettings CreateAtcomSettings()
    {
        return new AtcomSettings
        {
            CltInfo = new AtcomCltInfoSettings
            {
                TermCode = "TERM",
                TradePortalUserName = "TRADE-PORTAL-USER",
                Channel = "CHANNEL",
                AgentGroups = new Dictionary<string, AtcomCltInfoAgentsSettings>
                {
                    [AtcomRequestGenerator.DefaultAgentGroup] = new AtcomCltInfoAgentsSettings
                    {
                        AgentsNames = new Dictionary<string, string>
                        {
                            [DefaultMarketCode] = "DEFAULT-AGENT-UK"
                        },
                        UserNames = new Dictionary<string, string>
                        {
                            [DefaultMarketCode] = "DEFAULT-USER-UK"
                        }
                    },
                    ["promo"] = new AtcomCltInfoAgentsSettings
                    {
                        AgentsNames = new Dictionary<string, string>
                        {
                            [DefaultMarketCode] = "PROMO-AGENT-UK"
                        },
                        UserNames = new Dictionary<string, string>
                        {
                            [DefaultMarketCode] = "PROMO-USER-UK"
                        }
                    },
                    ["promoNoMarket"] = new AtcomCltInfoAgentsSettings
                    {
                        AgentsNames = new Dictionary<string, string>
                        {
                            ["FR"] = "PROMO-AGENT-FR"
                        },
                        UserNames = new Dictionary<string, string>
                        {
                            ["FR"] = "PROMO-USER-FR"
                        }
                    }
                }
            }
        };
    }
}

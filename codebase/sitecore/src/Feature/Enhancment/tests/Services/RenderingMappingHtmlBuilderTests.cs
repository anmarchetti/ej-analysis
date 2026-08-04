using System.Collections.Generic;
using easyJet.Feature.SitecoreEnhancment;
using easyJet.Feature.SitecoreEnhancment.Services;
using FluentAssertions;
using NSubstitute;
using Scriban.Runtime;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Services
{
    public class RenderingMappingHtmlBuilderTests
    {
        private class TestableBuilder : RenderingMappingHtmlBuilder
        {
            private readonly Dictionary<string, string> templates;

            public TestableBuilder(IRenderingItemService itemSvc, IRenderingParameterService paramSvc, Dictionary<string, string> pTemplates)
                : base(itemSvc, paramSvc)
            {
                templates = pTemplates;
            }

            protected override string LoadTemplateFromFile(string resourceName)
            {
                return templates != null && templates.TryGetValue(resourceName, out var value) ? value : null;
            }
        }

        [Fact]
        public void BuildHeaderHtml_WhenLabelsProvided_ShouldRenderEncodedValues()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.HeaderTemplate, "{{ label_key }}={{ label_value }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildHeaderHtml("<div>", "\"quote", "Rendering Instance");

            // ASSERT
            html.Should().Contain("&lt;div&gt;=").And.Contain("&quot;quote");
        }

        [Fact]
        public void BuildRenderingDisplayHtml_WhenValuesProvided_ShouldRenderEncodedIconAndName()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            itemSvc.GetRenderingIconUrl("id1").Returns("/icon&x.png");
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.RenderingDisplayTemplate, "{{ icon_url }}|{{ display_name }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildRenderingDisplayHtml("id1", "<b>name");

            // ASSERT
            html.Should().Be("/icon&amp;x.png|&lt;b&gt;name");
        }

        [Fact]
        public void BuildRowHtml_WhenTemplateMissing_ShouldReturnFallbackJson()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>();
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);
            var ctx = new RenderingMappingRowContext
            {
                RowId = "row1",
                KeyId = string.Empty,
                ValueId = string.Empty,
                KeyDropdownHtml = string.Empty,
                ValueDropdownHtml = string.Empty,
                ClientEvent = string.Empty,
                Parameters = string.Empty,
                StandardParams = new List<KeyValuePair<string, string>>(),
                CustomParams = new List<KeyValuePair<string, string>>()
            };

            // ACT
            var html = sut.BuildRowHtml(ctx);

            // ASSERT
            html.Should().Contain("\"row_id\": \"row1\"");
            html.Should().Contain("\"summary_display\" : \"none\"");
        }

        [Fact]
        public void BuildRowContext_WithServices_ShouldPopulateFieldsAndDropdownIds()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            itemSvc.GetItemDisplayName("k").Returns("KName");
            itemSvc.GetItemDisplayName("v").Returns("VName");
            itemSvc.GetRenderingIconUrl(Arg.Any<string>()).Returns("/icon.png");
            itemSvc.GetRenderingComponentName("k").Returns("KC");
            itemSvc.GetRenderingComponentName("v").Returns("VC");
            itemSvc.GetRenderingTypeName("k").Returns("KT");
            itemSvc.GetRenderingTypeName("v").Returns("VT");
            itemSvc.GetSourceItemsFromCache(Arg.Any<string>()).Returns((IEnumerable<Sitecore.Data.Items.Item>)null);

            var paramSvc = Substitute.For<IRenderingParameterService>();
            paramSvc.ParseAndCategorizeParameters("A=1;B=;C=2", "v")
                .Returns((new Dictionary<string, string> { { "A", "1" }, { "C", "2" } }, new Dictionary<string, string>()))
                ;
            paramSvc.GetStandardFieldNames("v").Returns(new[] { "Placeholder", "Data Source" });

            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ control_id }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var context = sut.BuildRowContext("row1", "A=1;B=;C=2", "evt", new RenderingColumnConfig("k", "src-k"), new RenderingColumnConfig("v", "src-v"));

            // ASSERT
            context.RowId.Should().Be("row1");
            context.KeyName.Should().Be("KName");
            context.ValueName.Should().Be("VName");
            context.KeyComponentName.Should().Be("KC");
            context.ValueComponentName.Should().Be("VC");
            context.KeyTypeName.Should().Be("KT");
            context.ValueTypeName.Should().Be("VT");
            context.StandardParams.Should().Contain(kv => kv.Key == "A" && kv.Value == "1");
            context.StandardParams.Should().Contain(kv => kv.Key == "C" && kv.Value == "2");
            context.CustomParams.Should().BeEmpty();
            context.KeyDropdownHtml.Should().Be("row1_Key");
            context.ValueDropdownHtml.Should().Be("row1_Value");
        }

        [Fact]
        public void BuildGroupedDropdownHtml_WithNoSourcesAndNoSelected_ShouldRenderTemplateWithControlId()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ control_id }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildGroupedDropdownHtml("ctl1", null, null);

            // ASSERT
            html.Should().Be("ctl1");
        }

        [Fact]
        public void BuildRowHtml_WithTemplate_ShouldRenderComputedFlags()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.RowTemplate, "{{ has_delete_button }}|{{ has_parameters }}|{{ has_component_row }}|{{ has_type_row }}|{{ summary_display }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);
            var ctx = new RenderingMappingRowContext
            {
                RowId = "r1",
                KeyId = "k",
                ValueId = string.Empty,
                StandardParams = new List<KeyValuePair<string, string>> { new KeyValuePair<string, string>("A", "1") },
                CustomParams = new List<KeyValuePair<string, string>> { new KeyValuePair<string, string>("X", "y") }
            };

            // ACT
            var html = sut.BuildRowHtml(ctx);

            // ASSERT
            html.Should().Be("true|true|false|false|block");
        }

        [Fact]
        public void BuildGroupedDropdownHtml_SelectedNotFound_ShouldAddNotInListGroup()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ option_groups.size }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildGroupedDropdownHtml("ctl", "missing-id", new Sitecore.Data.Items.Item[0]);

            // ASSERT
            html.Should().Be("1");
        }

        [Fact]
        public void BuildGroupedDropdownHtml_WithParentAndChild_ShouldMarkSelected()
        {
            // ARRANGE
            var parentFake = new Sitecore.NSubstituteUtils.FakeItem().WithName("Group1");
            var childFake = new Sitecore.NSubstituteUtils.FakeItem().WithName("Child").WithParent(parentFake);
            var parent = parentFake.ToSitecoreItem();
            var child = childFake.ToSitecoreItem();

            var itemSvc = Substitute.For<IRenderingItemService>();
            itemSvc.GetRenderingIconUrl(Arg.Any<string>()).Returns("/icon");
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ option_groups.size }}|{{ option_groups[0].options.size }}|{{ option_groups[0].options[0].selected }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildGroupedDropdownHtml("ctl", child.ID.ToString(), new[] { parent });

            // ASSERT
            html.Should().Be("1|1|true");
        }

        [Fact]
        public void BuildRowHtml_WhenContextIsNull_ShouldReturnEmpty()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>();
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildRowHtml(null);

            // ASSERT
            html.Should().BeEmpty();
        }

        [Fact]
        public void BuildRowHtml_WithValueAndNoKey_ShouldShowSummaryAsBlock()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>();
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);
            var ctx = new RenderingMappingRowContext
            {
                RowId = "row1",
                KeyId = string.Empty,
                ValueId = "someValue",
                KeyDropdownHtml = string.Empty,
                ValueDropdownHtml = string.Empty,
                ClientEvent = string.Empty,
                Parameters = string.Empty,
                StandardParams = new List<KeyValuePair<string, string>>(),
                CustomParams = new List<KeyValuePair<string, string>>()
            };

            // ACT
            var html = sut.BuildRowHtml(ctx);

            // ASSERT
            html.Should().Contain("\"summary_display\" : \"block\"");
        }

        [Fact]
        public void BuildRowHtml_WithTemplate_ShouldRenderAllFields()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            itemSvc.GetRenderingIconUrl(Arg.Any<string>()).Returns("/icon.png");
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.RowTemplate, "{{ row_id }}|{{ key_id }}|{{ value_id }}|{{ has_value }}" },
                { Constants.RenderingMappingEditor.TemplateNames.RenderingDisplayTemplate, "display" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);
            var ctx = new RenderingMappingRowContext
            {
                RowId = "r1",
                KeyId = "k1",
                ValueId = "v1",
                KeyIconUrl = "/key.png",
                ValueIconUrl = "/val.png",
                KeyDropdownHtml = "<select>key</select>",
                ValueDropdownHtml = "<select>val</select>",
                Parameters = "a=b",
                ClientEvent = "onchange",
                StandardParams = new List<KeyValuePair<string, string>>(),
                CustomParams = new List<KeyValuePair<string, string>>(),
                StandardFieldNames = new List<string> { "Placeholder" }
            };

            // ACT
            var html = sut.BuildRowHtml(ctx);

            // ASSERT
            html.Should().Be("r1|k1|v1|true");
        }

        [Fact]
        public void BuildRowContext_WithEmptyParameters_ShouldNotThrow()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            itemSvc.GetItemDisplayName(Arg.Any<string>()).Returns("Name");
            itemSvc.GetRenderingIconUrl(Arg.Any<string>()).Returns("/icon.png");
            itemSvc.GetRenderingComponentName(Arg.Any<string>()).Returns((string)null);
            itemSvc.GetRenderingTypeName(Arg.Any<string>()).Returns((string)null);
            itemSvc.GetSourceItemsFromCache(Arg.Any<string>()).Returns((IEnumerable<Sitecore.Data.Items.Item>)null);

            var paramSvc = Substitute.For<IRenderingParameterService>();
            paramSvc.ParseAndCategorizeParameters(string.Empty, Arg.Any<string>())
                .Returns((new Dictionary<string, string>(), new Dictionary<string, string>()));
            paramSvc.GetStandardFieldNames(Arg.Any<string>()).Returns(new[] { "Placeholder" });

            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ control_id }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var context = sut.BuildRowContext("row1", string.Empty, "evt", new RenderingColumnConfig("k", "src-k"), new RenderingColumnConfig("v", "src-v"));

            // ASSERT
            context.Should().NotBeNull();
            context.Parameters.Should().BeEmpty();
        }

        [Fact]
        public void BuildGroupedDropdownHtml_WithNullSourceItems_ShouldNotThrow()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ control_id }}|{{ option_groups.size }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildGroupedDropdownHtml("ctl", null, null);

            // ASSERT
            html.Should().Be("ctl|0");
        }

        [Fact]
        public void BuildRenderingDisplayHtml_WithNullValues_ShouldReturnEncodedEmpty()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            itemSvc.GetRenderingIconUrl(Arg.Any<string>()).Returns((string)null);
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.RenderingDisplayTemplate, "[{{ icon_url }}][{{ display_name }}]" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildRenderingDisplayHtml(null, null);

            // ASSERT
            html.Should().Be("[][]");
        }

        [Fact]
        public void BuildRowContext_WithCustomParams_ShouldPopulateCustomParamsList()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            itemSvc.GetItemDisplayName(Arg.Any<string>()).Returns("Name");
            itemSvc.GetRenderingIconUrl(Arg.Any<string>()).Returns("/icon.png");
            itemSvc.GetRenderingComponentName(Arg.Any<string>()).Returns((string)null);
            itemSvc.GetRenderingTypeName(Arg.Any<string>()).Returns((string)null);
            itemSvc.GetSourceItemsFromCache(Arg.Any<string>()).Returns((IEnumerable<Sitecore.Data.Items.Item>)null);

            var paramSvc = Substitute.For<IRenderingParameterService>();
            paramSvc.ParseAndCategorizeParameters("Custom=value", "v")
                .Returns((new Dictionary<string, string>(), new Dictionary<string, string> { { "Custom", "value" } }));
            paramSvc.GetStandardFieldNames("v").Returns(new[] { "Placeholder" });

            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ control_id }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var context = sut.BuildRowContext("row1", "Custom=value", "evt", new RenderingColumnConfig("k", "src-k"), new RenderingColumnConfig("v", "src-v"));

            // ASSERT
            context.CustomParams.Should().Contain(kv => kv.Key == "Custom" && kv.Value == "value");
        }

        [Fact]
        public void BuildRowHtml_WithCustomParams_ShouldIncludeInOutput()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.RowTemplate, "{{ custom_params.size }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);
            var ctx = new RenderingMappingRowContext
            {
                RowId = "r1",
                KeyId = "k",
                ValueId = "v",
                StandardParams = new List<KeyValuePair<string, string>>(),
                CustomParams = new List<KeyValuePair<string, string>>
                {
                    new KeyValuePair<string, string>("Custom1", "val1"),
                    new KeyValuePair<string, string>("Custom2", "val2")
                }
            };

            // ACT
            var html = sut.BuildRowHtml(ctx);

            // ASSERT
            html.Should().Be("2");
        }

        [Fact]
        public void BuildRowHtml_WithStandardFieldNames_ShouldOutputLowercaseJoinedNames()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.RowTemplate, "{{ standard_field_names }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);
            var ctx = new RenderingMappingRowContext
            {
                RowId = "r1",
                KeyId = "k",
                ValueId = "v",
                StandardParams = new List<KeyValuePair<string, string>>(),
                CustomParams = new List<KeyValuePair<string, string>>(),
                StandardFieldNames = new List<string> { "Placeholder", "Data Source" }
            };

            // ACT
            var html = sut.BuildRowHtml(ctx);

            // ASSERT
            html.Should().Contain("placeholder");
            html.Should().Contain("data source");
        }

        [Fact]
        public void BuildRowHtml_WithUidDropdownAndValue_ShouldRenderBoth()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.RowTemplate, "{{ uid_dropdown_html }}|{{ uid_value }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);
            var ctx = new RenderingMappingRowContext
            {
                RowId = "r1",
                KeyId = "k",
                ValueId = "v",
                UidDropdownHtml = "<select><option>uid</option></select>",
                Uid = "{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}",
                StandardParams = new List<KeyValuePair<string, string>>(),
                CustomParams = new List<KeyValuePair<string, string>>()
            };

            // ACT
            var html = sut.BuildRowHtml(ctx);

            // ASSERT
            html.Should().Contain("<select><option>uid</option></select>");
            html.Should().Contain("{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}");
        }

        [Fact]
        public void BuildRowHtml_WithNullStandardFieldNames_ShouldNotThrow()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.RowTemplate, "{{ standard_field_names }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);
            var ctx = new RenderingMappingRowContext
            {
                RowId = "r1",
                KeyId = "k",
                ValueId = "v",
                StandardParams = new List<KeyValuePair<string, string>>(),
                CustomParams = new List<KeyValuePair<string, string>>(),
                StandardFieldNames = null
            };

            // ACT
            var html = sut.BuildRowHtml(ctx);

            // ASSERT
            html.Should().NotBeNull();
        }

        [Fact]
        public void BuildRowContext_ShouldFilterEmptyStandardParamValues()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            itemSvc.GetItemDisplayName(Arg.Any<string>()).Returns("Name");
            itemSvc.GetRenderingIconUrl(Arg.Any<string>()).Returns("/icon.png");
            itemSvc.GetRenderingComponentName(Arg.Any<string>()).Returns((string)null);
            itemSvc.GetRenderingTypeName(Arg.Any<string>()).Returns((string)null);
            itemSvc.GetSourceItemsFromCache(Arg.Any<string>()).Returns((IEnumerable<Sitecore.Data.Items.Item>)null);

            var paramSvc = Substitute.For<IRenderingParameterService>();
            paramSvc.ParseAndCategorizeParameters("A=1;B=;C=2", "v")
                .Returns((new Dictionary<string, string> { { "A", "1" }, { "B", string.Empty }, { "C", "2" } }, new Dictionary<string, string>()));
            paramSvc.GetStandardFieldNames("v").Returns(new[] { "Placeholder" });

            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ control_id }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var context = sut.BuildRowContext("row1", "A=1;B=;C=2", "evt", new RenderingColumnConfig("k", "src-k"), new RenderingColumnConfig("v", "src-v"));

            // ASSERT
            context.StandardParams.Should().HaveCount(2);
            context.StandardParams.Should().Contain(kv => kv.Key == "A" && kv.Value == "1");
            context.StandardParams.Should().Contain(kv => kv.Key == "C" && kv.Value == "2");
            context.StandardParams.Should().NotContain(kv => kv.Key == "B");
        }

        [Fact]
        public void BuildRowContext_ShouldFilterEmptyCustomParamValues()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            itemSvc.GetItemDisplayName(Arg.Any<string>()).Returns("Name");
            itemSvc.GetRenderingIconUrl(Arg.Any<string>()).Returns("/icon.png");
            itemSvc.GetRenderingComponentName(Arg.Any<string>()).Returns((string)null);
            itemSvc.GetRenderingTypeName(Arg.Any<string>()).Returns((string)null);
            itemSvc.GetSourceItemsFromCache(Arg.Any<string>()).Returns((IEnumerable<Sitecore.Data.Items.Item>)null);

            var paramSvc = Substitute.For<IRenderingParameterService>();
            paramSvc.ParseAndCategorizeParameters("Custom=value;Empty=", "v")
                .Returns((new Dictionary<string, string>(), new Dictionary<string, string> { { "Custom", "value" }, { "Empty", string.Empty } }));
            paramSvc.GetStandardFieldNames("v").Returns(new[] { "Placeholder" });

            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ control_id }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var context = sut.BuildRowContext("row1", "Custom=value;Empty=", "evt", new RenderingColumnConfig("k", "src-k"), new RenderingColumnConfig("v", "src-v"));

            // ASSERT
            context.CustomParams.Should().HaveCount(1);
            context.CustomParams.Should().Contain(kv => kv.Key == "Custom" && kv.Value == "value");
            context.CustomParams.Should().NotContain(kv => kv.Key == "Empty");
        }

        [Fact]
        public void BuildRowHtml_WithNullIconUrls_ShouldEncodeAsEmpty()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            itemSvc.GetRenderingIconUrl(Arg.Any<string>()).Returns((string)null);
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.RowTemplate, "[{{ key_icon_url }}][{{ value_icon_url }}]" },
                { Constants.RenderingMappingEditor.TemplateNames.RenderingDisplayTemplate, "display" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);
            var ctx = new RenderingMappingRowContext
            {
                RowId = "r1",
                KeyId = "k1",
                ValueId = "v1",
                KeyIconUrl = null,
                ValueIconUrl = null,
                StandardParams = new List<KeyValuePair<string, string>>(),
                CustomParams = new List<KeyValuePair<string, string>>()
            };

            // ACT
            var html = sut.BuildRowHtml(ctx);

            // ASSERT
            html.Should().Be("[][]");
        }

        [Fact]
        public void BuildRowHtml_WithComponentNames_ShouldSetHasComponentRowTrue()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            itemSvc.GetRenderingIconUrl(Arg.Any<string>()).Returns("/icon.png");
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.RowTemplate, "{{ has_component_row }}|{{ key_component_name }}|{{ value_component_name }}" },
                { Constants.RenderingMappingEditor.TemplateNames.RenderingDisplayTemplate, "display" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);
            var ctx = new RenderingMappingRowContext
            {
                RowId = "r1",
                KeyId = "k1",
                ValueId = "v1",
                KeyComponentName = "CompA",
                ValueComponentName = null,
                StandardParams = new List<KeyValuePair<string, string>>(),
                CustomParams = new List<KeyValuePair<string, string>>()
            };

            // ACT
            var html = sut.BuildRowHtml(ctx);

            // ASSERT
            html.Should().Be("true|CompA|");
        }

        [Fact]
        public void BuildRowHtml_WithTypeNames_ShouldSetHasTypeRowTrue()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            itemSvc.GetRenderingIconUrl(Arg.Any<string>()).Returns("/icon.png");
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.RowTemplate, "{{ has_type_row }}|{{ key_type_name }}|{{ value_type_name }}" },
                { Constants.RenderingMappingEditor.TemplateNames.RenderingDisplayTemplate, "display" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);
            var ctx = new RenderingMappingRowContext
            {
                RowId = "r1",
                KeyId = "k1",
                ValueId = "v1",
                KeyTypeName = "TypeA",
                ValueTypeName = "TypeB",
                StandardParams = new List<KeyValuePair<string, string>>(),
                CustomParams = new List<KeyValuePair<string, string>>()
            };

            // ACT
            var html = sut.BuildRowHtml(ctx);

            // ASSERT
            html.Should().Be("true|TypeA|TypeB");
        }

        [Fact]
        public void BuildRowHtml_WithSpecialCharsInParams_ShouldHtmlEncode()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.RowTemplate, "{{ standard_params[0].key }}={{ standard_params[0].display_value }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);
            var ctx = new RenderingMappingRowContext
            {
                RowId = "r1",
                KeyId = "k",
                ValueId = "v",
                StandardParams = new List<KeyValuePair<string, string>>
                {
                    new KeyValuePair<string, string>("<script>", "value&value")
                },
                CustomParams = new List<KeyValuePair<string, string>>()
            };

            // ACT
            var html = sut.BuildRowHtml(ctx);

            // ASSERT
            html.Should().Contain("&lt;script&gt;");
            html.Should().Contain("value&amp;value");
        }

        [Fact]
        public void Constructor_WithSingleParameter_ShouldUseDefaultRenderingParameterService()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();

            // ACT
            var sut = new RenderingMappingHtmlBuilder(itemSvc);

            // ASSERT
            sut.Should().NotBeNull();
        }

        [Fact]
        public void Constructor_DefaultConstructor_ShouldCreateInstance()
        {
            // ACT
            var sut = new RenderingMappingHtmlBuilder();

            // ASSERT
            sut.Should().NotBeNull();
        }

        // ============================================================
        // BuildHeaderHtml — labelUid parameter
        // ============================================================
        [Fact]
        public void BuildHeaderHtml_WhenLabelUidProvided_ShouldRenderEncodedUid()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.HeaderTemplate, "{{ label_uid }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildHeaderHtml("Key", "Value", "<uid>");

            // ASSERT
            html.Should().Be("&lt;uid&gt;");
        }

        // ============================================================
        // BuildGroupedDropdownHtml — allowedRenderingIds filtering
        // ============================================================
        [Fact]
        public void BuildGroupedDropdownHtml_WithAllowedIds_ShouldExcludeNonAllowedChildren()
        {
            // ARRANGE
            var parentFake = new Sitecore.NSubstituteUtils.FakeItem().WithName("Group1");
            var allowedChild = new Sitecore.NSubstituteUtils.FakeItem().WithName("Allowed").WithParent(parentFake);
            var excludedChild = new Sitecore.NSubstituteUtils.FakeItem().WithName("Excluded").WithParent(parentFake);
            var parent = parentFake.ToSitecoreItem();
            var allowedItem = allowedChild.ToSitecoreItem();
            _ = excludedChild.ToSitecoreItem();

            var allowed = new System.Collections.Generic.HashSet<Sitecore.Data.ID> { allowedItem.ID };
            var itemSvc = Substitute.For<IRenderingItemService>();
            itemSvc.GetRenderingIconUrl(Arg.Any<string>()).Returns("/icon");
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ option_groups.size }}|{{ option_groups[0].options.size }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildGroupedDropdownHtml("ctl", null, new[] { parent }, allowed);

            // ASSERT
            html.Should().Be("1|1");
        }

        [Fact]
        public void BuildGroupedDropdownHtml_WithAllowedIds_WhenNoChildrenMatch_ShouldSkipGroup()
        {
            // ARRANGE
            var parentFake = new Sitecore.NSubstituteUtils.FakeItem().WithName("Group1");
            _ = new Sitecore.NSubstituteUtils.FakeItem().WithName("Child").WithParent(parentFake).ToSitecoreItem();
            var parent = parentFake.ToSitecoreItem();

            var allowed = new System.Collections.Generic.HashSet<Sitecore.Data.ID> { Sitecore.Data.ID.NewID };
            var itemSvc = Substitute.For<IRenderingItemService>();
            itemSvc.GetRenderingIconUrl(Arg.Any<string>()).Returns("/icon");
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ option_groups.size }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildGroupedDropdownHtml("ctl", null, new[] { parent }, allowed);

            // ASSERT
            html.Should().Be("0");
        }

        [Fact]
        public void BuildGroupedDropdownHtml_WithNullAllowedIds_ShouldIncludeAllChildren()
        {
            // ARRANGE
            var parentFake = new Sitecore.NSubstituteUtils.FakeItem().WithName("Group1");
            _ = new Sitecore.NSubstituteUtils.FakeItem().WithName("Child1").WithParent(parentFake).ToSitecoreItem();
            _ = new Sitecore.NSubstituteUtils.FakeItem().WithName("Child2").WithParent(parentFake).ToSitecoreItem();
            var parent = parentFake.ToSitecoreItem();

            var itemSvc = Substitute.For<IRenderingItemService>();
            itemSvc.GetRenderingIconUrl(Arg.Any<string>()).Returns("/icon");
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ option_groups[0].options.size }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildGroupedDropdownHtml("ctl", null, new[] { parent }, null);

            // ASSERT
            html.Should().Be("2");
        }

        [Fact]
        public void BuildGroupedDropdownHtml_WithAddJustRemoveTrue_ShouldIncludeJustRemoveAsFirstOption()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ first_options.size }}|{{ first_options[0].value }}|{{ first_options[0].text }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildGroupedDropdownHtml("ctl", null, null, null, addJustRemoveOption: true);

            // ASSERT
            html.Should().Be("1|JUST_REMOVE|Just Remove");
        }

        [Fact]
        public void BuildGroupedDropdownHtml_WithAddJustRemoveFalse_ShouldNotIncludeJustRemoveOption()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ first_options.size }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildGroupedDropdownHtml("ctl", null, null, null, addJustRemoveOption: false);

            // ASSERT
            html.Should().Be("0");
        }

        [Fact]
        public void BuildGroupedDropdownHtml_WhenJustRemoveIsSelectedValue_ShouldMarkJustRemoveSelected()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ first_options[0].selected }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildGroupedDropdownHtml("ctl", Constants.RenderingMappingEditor.JustRemoveValue, null, null, addJustRemoveOption: true);

            // ASSERT
            html.Should().Be("true");
        }

        [Fact]
        public void BuildGroupedDropdownHtml_WhenJustRemoveIsSelectedAndItemExists_ShouldNotAddNotInListGroup()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate, "{{ option_groups.size }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);

            // ACT
            var html = sut.BuildGroupedDropdownHtml("ctl", Constants.RenderingMappingEditor.JustRemoveValue, null, null, addJustRemoveOption: true);

            // ASSERT
            html.Should().Be("0");
        }

        [Fact]
        public void BuildRowHtml_WhenValueIsJustRemove_ShouldRenderHasValueFalse()
        {
            // ARRANGE
            var itemSvc = Substitute.For<IRenderingItemService>();
            var paramSvc = Substitute.For<IRenderingParameterService>();
            var templates = new Dictionary<string, string>
            {
                { Constants.RenderingMappingEditor.TemplateNames.RowTemplate, "{{ has_value }}" }
            };
            var sut = new TestableBuilder(itemSvc, paramSvc, templates);
            var ctx = new RenderingMappingRowContext
            {
                RowId = "r1",
                KeyId = "{11111111-1111-1111-1111-111111111111}",
                ValueId = Constants.RenderingMappingEditor.JustRemoveValue,
                StandardParams = new List<KeyValuePair<string, string>>(),
                CustomParams = new List<KeyValuePair<string, string>>()
            };

            // ACT
            var html = sut.BuildRowHtml(ctx);

            // ASSERT
            html.Should().Be("false");
        }
    }
}

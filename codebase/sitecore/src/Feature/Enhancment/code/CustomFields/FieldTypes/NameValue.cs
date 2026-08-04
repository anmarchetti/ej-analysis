using System;
using System.Collections.Specialized;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Web;
using System.Web.UI;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Diagnostics;
using Sitecore.Text;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Feature.SitecoreEnhancment.CustomFields.FieldTypes
{
    [ExcludeFromCodeCoverage]
    public class NameValue : Sitecore.Shell.Applications.ContentEditor.NameValue
    {
        protected override string NameStyle => "width:300px";

        protected override void OnLoad(EventArgs e)
        {
            Assert.ArgumentNotNull((object)e, nameof(e));
            if (Sitecore.Context.ClientPage.IsEvent)
            {
                LoadValue();
            }
            else
            {
                BuildControl();
            }
        }

        protected virtual void LoadValue()
        {
            if (ReadOnly || Disabled)
            {
                return;
            }

            var current = new HttpContextAccessor().GetCurrent();
            NameValueCollection nameValueCollection = current?.Handler is Page handler ? handler.Request.Form : new NameValueCollection();
            UrlString urlString = new UrlString();
            foreach (string key1 in nameValueCollection.Keys)
            {
                if (!string.IsNullOrEmpty(key1) && key1.StartsWith(ID + "_Param", StringComparison.InvariantCulture) && !key1.EndsWith("_value", StringComparison.InvariantCulture))
                {
                    string key2 = nameValueCollection[key1];
                    string str = nameValueCollection[key1 + "_value"];
                    if (!string.IsNullOrEmpty(key2))
                    {
                        urlString[key2] = str ?? string.Empty;
                    }
                }
            }

            string second = urlString.ToString();
            if (string.Equals(Value, second, StringComparison.Ordinal))
            {
                return;
            }

            Value = second;
            SetModified();
        }

        protected virtual void BuildControl()
        {
            UrlString urlString = new UrlString()
            {
                Query = Value
            };
            foreach (string key in urlString.Parameters.Keys)
            {
                if (key.Length > 0)
                {
                    Controls.Add(new LiteralControl(BuildParameterKeyValue(key, urlString.Parameters[key])));
                }
            }

            Controls.Add(new LiteralControl(BuildParameterKeyValue(string.Empty, string.Empty)));
        }

        protected new void ParameterChange()
        {
            ClientPage clientPage = Sitecore.Context.ClientPage;
            if (string.Equals(clientPage.ClientRequest.Source, StringUtil.GetString(clientPage.ServerProperties[ID + "_LastParameterID"]), StringComparison.Ordinal) && !string.IsNullOrEmpty(clientPage.ClientRequest.Form[clientPage.ClientRequest.Source]))
            {
                string str = BuildParameterKeyValue(string.Empty, string.Empty);
                clientPage.ClientResponse.Insert(ID, "beforeEnd", str);
            }

            clientPage.ClientResponse.SetReturnValue(true);
        }

        protected virtual string BuildParameterKeyValue(string key, string value)
        {
            Assert.ArgumentNotNull(key, nameof(key));
            Assert.ArgumentNotNull(value, nameof(value));
            string uniqueId = GetUniqueID(ID + "_Param");
            Sitecore.Context.ClientPage.ServerProperties[ID + "_LastParameterID"] = uniqueId;
            string clientEvent = Sitecore.Context.ClientPage.GetClientEvent(ID + ".ParameterChange");
            string str1 = ReadOnly ? " readonly=\"readonly\"" : string.Empty;
            string str2 = Disabled ? " disabled=\"disabled\"" : string.Empty;
            string str3 = IsVertical ? "</tr><tr>" : string.Empty;
            return string.Format(CultureInfo.InvariantCulture, "<table width=\"100%\" class='scAdditionalParameters'><tr><td>{0}</td>{2}<td width=\"100%\">{1}</td></tr></table>", string.Format(CultureInfo.InvariantCulture, "<input id=\"{0}\" name=\"{1}\" type=\"text\"{2}{3} style=\"{6}\" value=\"{4}\" onchange=\"{5}\"/>", uniqueId, uniqueId, str1, str2, StringUtil.EscapeQuote(key), clientEvent, NameStyle), GetValueHtmlControl(uniqueId, StringUtil.EscapeQuote(HttpUtility.UrlDecode(value))), str3);
        }
    }
}
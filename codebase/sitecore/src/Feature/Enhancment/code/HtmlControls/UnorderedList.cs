using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using Sitecore.Configuration;
using Sitecore.Web.UI.HtmlControls;

namespace easyJet.Feature.SitecoreEnhancment.HtmlControls
{
    [ExcludeFromCodeCoverage]
    public class UnorderedList : Control
    {
        private readonly int numberOfItemsToShowFromStart;

        public List<string> ListItems { get; set; }

        public UnorderedList()
        {
            numberOfItemsToShowFromStart = Settings.GetIntSetting("UnorderedListControl.NumberOfItemsToShowFromStart", 3);
        }

        protected override void DoRender(System.Web.UI.HtmlTextWriter output)
        {
            var numberOfListItems = ListItems.Count;

            output.Write("<div class=\"unordered-list-container\">");
            output.Write("<ul class=\"unordered-list\">");

            for (var index = 0; index < numberOfListItems; index++)
            {
                if (index < numberOfItemsToShowFromStart)
                {
                    output.Write($"<li>{ListItems[index]}</li>");
                }
                else
                {
                    output.Write($"<li class=\"unordered-hidden-item\">{ListItems[index]}</li>");
                }
            }

            output.Write("</ul>");

            if (numberOfItemsToShowFromStart < numberOfListItems)
            {
                output.Write("<span class=\"unordered-list-show-more-btn\" onclick='onShowMoreButton(this);'>Show More</span>");
                output.Write("<span class=\"unordered-list-show-less-btn hide\" onclick='onShowLessButton(this);'>Show Less</span>");
            }

            output.Write("</div>");
        }
    }
}
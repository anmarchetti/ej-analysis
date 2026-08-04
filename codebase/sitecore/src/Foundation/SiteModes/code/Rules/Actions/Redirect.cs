using System.Net;
using Sitecore;
using Sitecore.Diagnostics;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;
using Sitecore.Rules;
using Sitecore.Rules.Actions;

namespace easyJet.Foundation.SiteModes.Rules.Actions
{
    public class Redirect<T> : RuleAction<T>
    where T : RuleContext
    {
        public string Page { get; set; }

        /// <summary>
        /// Change Context Item to one which was set in 'Page'.
        /// </summary>
        /// <param name="ruleContext">Rule Context.</param>
        public override void Apply(T ruleContext)
        {
            Assert.IsNotNullOrEmpty(Page, "Redirect needs a page to redirect to");
            var pageItem = Context.Database.GetItem(Page);

            // Changing context item for JSS is like a redirect to another page
            Context.Item = pageItem;

            if (ruleContext.Parameters.TryGetValue(Constants.RequestBeginArgsKey, out object result))
            {
                var args = result as RequestBeginArgs;
                args.RequestContext.HttpContext.Response.StatusCode = (int)HttpStatusCode.Redirect;
            }
        }
    }
}
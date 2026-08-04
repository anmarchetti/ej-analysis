using System.Linq;
using Sitecore;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Text;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Feature.SitecoreEnhancment.Commands
{
    public class ShowVersionsGalleryCommand : Command
    {
        public override CommandState QueryState(CommandContext context)
        {
            return GetContextItem(context) == null ? CommandState.Hidden : base.QueryState(context);
        }

        public override void Execute(CommandContext context)
        {
            var item = GetContextItem(context);
            if (item == null)
            {
                return;
            }

            var url = new UrlString("/sitecore/shell/default.aspx");
            url["xmlcontrol"] = "easyJet.Gallery.Versions";
            url["id"] = item.ID.ToString();
            url["la"] = item.Language.Name;
            url["vs"] = item.Version.Number.ToString();
            url["db"] = item.Database.Name;

            ShowModalDialog(url.ToString());
        }

        protected virtual void ShowModalDialog(string url)
        {
            SheerResponse.ShowModalDialog(url, "500", "560", string.Empty, true);
        }

        private static Sitecore.Data.Items.Item GetContextItem(CommandContext context)
        {
            return context?.Items?.FirstOrDefault() ?? Context.Item;
        }
    }
}

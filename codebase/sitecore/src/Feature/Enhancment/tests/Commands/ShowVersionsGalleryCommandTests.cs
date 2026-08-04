using System.Reflection;
using System.Web;
using easyJet.Feature.SitecoreEnhancment.Commands;
using easyJet.Foundation.Testing.Switchers;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Text;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Commands
{
    public class ShowVersionsGalleryCommandTests
    {
        [Fact]
        public void QueryState_ReturnsHidden_WhenNoContextItem()
        {
            var sut = new ShowVersionsGalleryCommand();

            using (new SafeContextItemSwitcher(null))
            {
                var result = sut.QueryState(new CommandContext());
                Assert.Equal(CommandState.Hidden, result);
            }
        }

        [Fact]
        public void QueryState_ReturnsEnabled_WhenCommandContextContainsItem()
        {
            var sut = new ShowVersionsGalleryCommand();
            var dbItem = new DbItem("Home");

            using (var db = new Db { dbItem })
            {
                var item = db.GetItem(dbItem.ID);
                var result = sut.QueryState(new CommandContext(item));

                Assert.Equal(CommandState.Enabled, result);
            }
        }

        [Fact]
        public void Execute_DoesNotThrow_WhenNoContextItem()
        {
            var sut = new ShowVersionsGalleryCommand();

            using (new SafeContextItemSwitcher(null))
            {
                var exception = Record.Exception(() => sut.Execute(new CommandContext()));
                Assert.Null(exception);
            }
        }

        [Fact]
        public void Execute_BuildsExpectedGalleryUrl_WhenContextItemExists()
        {
            var dbItem = new DbItem("Home");

            using (var db = new Db { dbItem })
            {
                var item = db.GetItem(dbItem.ID);
                var sut = new TestableShowVersionsGalleryCommand();

                sut.Execute(new CommandContext(item));

                Assert.NotNull(sut.LastShownUrl);
                var url = new UrlString(sut.LastShownUrl);
                Assert.Equal("/sitecore/shell/default.aspx", url.Path);
                Assert.Equal("easyJet.Gallery.Versions", url["xmlcontrol"]);
                Assert.Equal(item.ID.ToString(), HttpUtility.UrlDecode(url["id"]));
                Assert.Equal(item.Language.Name, url["la"]);
                Assert.Equal(item.Version.Number.ToString(), url["vs"]);
                Assert.Equal(item.Database.Name, url["db"]);
            }
        }

        [Fact]
        public void GetContextItem_ReturnsContextItem_WhenCommandContextIsNull()
        {
            var dbItem = new DbItem("Home");

            using (var db = new Db { dbItem })
            {
                var contextItem = db.GetItem(dbItem.ID);
                using (new SafeContextItemSwitcher(contextItem))
                {
                    var method = typeof(ShowVersionsGalleryCommand).GetMethod("GetContextItem", BindingFlags.NonPublic | BindingFlags.Static);
                    var result = (Item)method.Invoke(null, new object[] { null });

                    Assert.Same(contextItem, result);
                }
            }
        }

        private sealed class TestableShowVersionsGalleryCommand : ShowVersionsGalleryCommand
        {
            public string LastShownUrl { get; private set; }

            protected override void ShowModalDialog(string url)
            {
                LastShownUrl = url;
            }
        }
    }
}

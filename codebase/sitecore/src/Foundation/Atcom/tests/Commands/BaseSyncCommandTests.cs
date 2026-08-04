using AutoFixture;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Services.Sync;
using NSubstitute;
using Sitecore.FakeDb;

namespace easyJet.Foundation.Atcom.Tests.Commands
{
    public abstract class BaseSyncCommandTests
    {
        protected ISyncDataService Service { get; private set; }

        protected IAtcomLogger Logger { get; private set; }

        protected Fixture Fixture { get; private set; }

        protected Db Db { get; private set; }

        public BaseSyncCommandTests()
        {
            Fixture = new Fixture();
            Db = Fixture.Freeze<Db>();
            Service = Substitute.For<ISyncDataService>();
            Logger = Substitute.For<IAtcomLogger>();
        }
    }
}

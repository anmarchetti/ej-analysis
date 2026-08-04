using AutoFixture;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services.Sync;
using NSubstitute;
using Sitecore.FakeDb;
using Sitecore.FakeDb.AutoFixture;

namespace easyJet.Foundation.HotelBeds.Tests.Commands
{
    public abstract class BaseSyncCommandTests
    {
        protected ISyncDataService Service { get; private set; }

        protected IHotelBedsLogger Logger { get; private set; }

        protected IFixture Fixture { get; private set; }

        protected Db Db { get; private set; }

        public BaseSyncCommandTests()
        {
            Fixture = new Fixture().Customize(new AutoDbCustomization()).Customize(new AutoContentItemCustomization());
            Db = Fixture.Freeze<Db>();
            Service = Substitute.For<ISyncDataService>();
            Logger = Substitute.For<IHotelBedsLogger>();
        }
    }
}

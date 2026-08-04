using AutoFixture;
using AutoFixture.AutoMoq;

namespace easyJet.Holidays.Tests.Domain
{
    public class FixtureUtils
    {
        public static IFixture AutoMoqFixture()
        {
            return new Fixture().Customize(new AutoMoqCustomization());
        }
    }
}

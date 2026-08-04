using AutoFixture;
using AutoFixture.AutoMoq;
using AutoFixture.Xunit3;

namespace easyJet.Holidays.Tests.Domain
{
    public class AutoMoqDataAttribute : AutoDataAttribute
    {
        public AutoMoqDataAttribute()
            : base(() => new Fixture().Customize(new AutoMoqCustomization()))
        { }
    }
}

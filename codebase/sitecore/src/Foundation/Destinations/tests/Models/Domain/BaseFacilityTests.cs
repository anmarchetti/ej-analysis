using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Models.Domain
{
    public class BaseFacilityTests
    {
        [Fact]
        public void GetFacilityCode_NoGroupFacilityCode_Success()
        {
            var facility = new BaseFacility()
            {
                FacilityCode = "test",
            };

            var res = facility.GetFacilityTypeCode();

            res.Should().Be(facility.FacilityCode);
        }

        [Fact]
        public void GetFacilityCode_Success()
        {
            var facility = new BaseFacility()
            {
                FacilityCode = "test",
                FacilityGroupCode = "test",
            };

            var res = facility.GetFacilityTypeCode();

            res.Should().Be($"{facility.FacilityGroupCode}-{facility.FacilityCode}");
        }

        [Fact]
        public void GetFacilityCode_NoCode_CodeEmpty()
        {
            var facility = new BaseFacility()
            {
                FacilityGroupCode = "test",
            };

            var res = facility.GetFacilityTypeCode();

            res.Should().BeEmpty();
        }
    }
}

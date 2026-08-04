using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class VirtualFacilityGroupingServiceData
    {
        public static List<HotelFacility> HotelFacility
        {
            get
            {
                return new List<HotelFacility>()
                {
                    new HotelFacility()
                    {
                        FacilityGroupCode = "70",
                        FacilityCode = "30",
                        Name = "1"
                    },
                    new HotelFacility()
                    {
                        FacilityGroupCode = "70",
                        FacilityCode = "520",
                        Name = "2"
                    },
                    new HotelFacility()
                    {
                        FacilityGroupCode = "70",
                        FacilityCode = "55",
                        Name = "3"
                    },
                    new HotelFacility()
                    {
                        FacilityGroupCode = "30",
                        FacilityCode = "125",
                        Name = "Food"
                    },
                    new HotelFacility()
                    {
                        FacilityGroupCode = "70",
                        FacilityCode = "31",
                        Name = "5"
                    },
                    new HotelFacility()
                    {
                        FacilityGroupCode = "70",
                        FacilityCode = "30",
                        Name = "7"
                    },
                    new HotelFacility()
                    {
                        FacilityGroupCode = "30",
                        FacilityCode = "20",
                        Name = "EC"
                    },
                    new HotelFacility()
                    {
                        FacilityGroupCode = "30",
                        FacilityCode = "115",
                        Name = "Euro 6000"
                    },
                    new HotelFacility()
                    {
                        FacilityGroupCode = "30",
                        FacilityCode = "31",
                        Name = "JCB"
                    },
                    new HotelFacility()
                    {
                        FacilityGroupCode = "70",
                        FacilityCode = "80",
                        Name = "Maestro"
                    }
                };
            }
        }

        public static List<Facility> AccommodationFacilities
        {
            get
            {
                return new List<Facility>()
                {
                    new Facility()
                    {
                        GroupCode = "30",
                        Code = "20",
                        Name = "Accommodation 1"
                    },
                    new Facility()
                    {
                        GroupCode = "30",
                        Code = "115",
                        Name = "Accommodation 2"
                    },
                    new Facility()
                    {
                        GroupCode = "30",
                        Code = "30",
                        Name = "Accommodation 3"
                    },
                };
            }
        }

        public static List<Facility> FoodFacilities
        {
            get
            {
                return new List<Facility>()
                {
                    new Facility()
                    {
                        GroupCode = "15",
                        Code = "20",
                        Name = "Food 1"
                    },
                    new Facility()
                    {
                        GroupCode = "30",
                        Code = "125",
                        Name = "Food 2"
                    },
                };
            }
        }

        public static List<VirtualFacilityGroup> VirtualGroups
        {
            get
            {
                return new List<VirtualFacilityGroup>()
                {
                    new VirtualFacilityGroup()
                    {
                        TemplateId = Constants.TemplateIds.OverviewFacilityVirtualGrouping,
                        Name = "Accommodation",
                        Facilities = AccommodationFacilities,
                    },
                    new VirtualFacilityGroup()
                    {
                        TemplateId = Constants.TemplateIds.FoodAndDrinkFacilityVirtualGrouping,
                        Name = "Food",
                        Facilities = FoodFacilities,
                    },
                };
            }
        }
    }
}

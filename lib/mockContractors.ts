/**
 * Homepage-only mock data. Lives here so the homepage stays static/fast and
 * doesn't hit Supabase for a browsing preview. Shape is compatible with
 * the real Contractor type plus a small number of display-only fields used
 * by the License Card (issue year, neighborhood label, trade slug).
 *
 * These are fictional. Real contractor data comes from CSLB via Supabase.
 */

export type LicenseStatus = "active" | "expired" | "suspended";

export type TradeSlug =
  | "plumbing"
  | "electrical"
  | "roofing"
  | "hvac"
  | "painting"
  | "general"
  | "landscaping"
  | "other";

export interface MockContractor {
  /** CSLB license number (string to preserve leading zeros). */
  licenseNumber: string;
  companyName: string;
  city: string;
  neighborhood?: string;
  trade: TradeSlug;
  /** Short classification label shown in the "CLASS" slot, e.g. "C-36 Plumbing". */
  classificationCode: string;
  classificationLabel: string;
  yearsInBusiness: number;
  issueYear: number;
  status: LicenseStatus;
  bonded: boolean;
  workersComp: boolean;
  /** Any additional compliance chips (e.g. "CFL on file"). */
  extraTags?: string[];
}

export const MOCK_CONTRACTORS: MockContractor[] = [
  {
    licenseNumber: "1045287",
    companyName: "Reliable Plumbing Co.",
    city: "Los Angeles",
    neighborhood: "Downtown",
    trade: "plumbing",
    classificationCode: "C-36",
    classificationLabel: "C-36 Plumbing",
    yearsInBusiness: 15,
    issueYear: 2009,
    status: "active",
    bonded: true,
    workersComp: true,
  },
  {
    licenseNumber: "894221",
    companyName: "Bay Voltage Electric",
    city: "San Francisco",
    neighborhood: "Mission",
    trade: "electrical",
    classificationCode: "C-10",
    classificationLabel: "C-10 Electrical",
    yearsInBusiness: 22,
    issueYear: 2002,
    status: "active",
    bonded: true,
    workersComp: true,
    extraTags: ["CFL on file"],
  },
  {
    licenseNumber: "1128946",
    companyName: "Summit Roofing Works",
    city: "San Diego",
    neighborhood: "North Park",
    trade: "roofing",
    classificationCode: "C-39",
    classificationLabel: "C-39 Roofing",
    yearsInBusiness: 11,
    issueYear: 2013,
    status: "active",
    bonded: true,
    workersComp: true,
  },
  {
    licenseNumber: "786542",
    companyName: "Coastline HVAC Services",
    city: "Long Beach",
    trade: "hvac",
    classificationCode: "C-20",
    classificationLabel: "C-20 HVAC",
    yearsInBusiness: 28,
    issueYear: 1996,
    status: "active",
    bonded: true,
    workersComp: true,
  },
  {
    licenseNumber: "1210994",
    companyName: "Fresh Coat Painters",
    city: "Oakland",
    neighborhood: "Rockridge",
    trade: "painting",
    classificationCode: "C-33",
    classificationLabel: "C-33 Painting",
    yearsInBusiness: 8,
    issueYear: 2016,
    status: "active",
    bonded: true,
    workersComp: false,
  },
  {
    licenseNumber: "623481",
    companyName: "Ironside General Builders",
    city: "Sacramento",
    neighborhood: "Midtown",
    trade: "general",
    classificationCode: "B",
    classificationLabel: "B General Building",
    yearsInBusiness: 33,
    issueYear: 1991,
    status: "active",
    bonded: true,
    workersComp: true,
    extraTags: ["CFL on file"],
  },
  {
    licenseNumber: "1077812",
    companyName: "Verde Landscape Design",
    city: "Palo Alto",
    trade: "landscaping",
    classificationCode: "C-27",
    classificationLabel: "C-27 Landscaping",
    yearsInBusiness: 13,
    issueYear: 2011,
    status: "active",
    bonded: true,
    workersComp: true,
  },
  {
    licenseNumber: "1153320",
    companyName: "Hillcrest Home Services",
    city: "San Jose",
    neighborhood: "Willow Glen",
    trade: "general",
    classificationCode: "B",
    classificationLabel: "B General Building",
    yearsInBusiness: 9,
    issueYear: 2015,
    status: "active",
    bonded: false,
    workersComp: true,
  },
  {
    licenseNumber: "552108",
    companyName: "Pacific Pipe & Drain",
    city: "Fresno",
    trade: "plumbing",
    classificationCode: "C-36",
    classificationLabel: "C-36 Plumbing",
    yearsInBusiness: 41,
    issueYear: 1983,
    status: "expired",
    bonded: true,
    workersComp: false,
  },
  {
    licenseNumber: "978345",
    companyName: "Cascade Electric & Solar",
    city: "Berkeley",
    trade: "electrical",
    classificationCode: "C-10",
    classificationLabel: "C-10 Electrical",
    yearsInBusiness: 17,
    issueYear: 2007,
    status: "active",
    bonded: true,
    workersComp: true,
  },
  {
    licenseNumber: "431267",
    companyName: "Old Oak Roofing",
    city: "Pasadena",
    trade: "roofing",
    classificationCode: "C-39",
    classificationLabel: "C-39 Roofing",
    yearsInBusiness: 44,
    issueYear: 1980,
    status: "suspended",
    bonded: true,
    workersComp: true,
  },
  {
    licenseNumber: "1184567",
    companyName: "Meridian Climate Control",
    city: "Irvine",
    neighborhood: "Woodbridge",
    trade: "hvac",
    classificationCode: "C-20",
    classificationLabel: "C-20 HVAC",
    yearsInBusiness: 10,
    issueYear: 2014,
    status: "active",
    bonded: true,
    workersComp: true,
  },
];

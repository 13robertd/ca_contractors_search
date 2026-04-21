/**
 * Homepage mock data. Lives here so the homepage stays fast and doesn't
 * hit Supabase for a browsing preview. Shape is compatible with the real
 * Contractor table plus a few display-only fields. These are fictional
 * — real contractor data comes from CSLB via Supabase.
 *
 * Each entry's `type` and `primaryTrade` are derived at import time from
 * `classifications` so we have a single source of truth.
 *
 * All mocks are in "San Mateo" because the current homepage hardcodes
 * that city per the spec.
 */

import {
  deriveType,
  primaryTradeFor,
  type ContractorType,
  type TradeSlug,
} from "./trades";

export type LicenseStatus = "active" | "expired" | "suspended";

export interface MockContractor {
  licenseNumber: string;
  companyName: string;
  city: string;
  neighborhood?: string;
  /** CSLB classification codes in priority order. First non-B is "primary". */
  classifications: string[];
  /** Derived at import time — don't set this manually. */
  type: ContractorType;
  /** Derived at import time — don't set this manually. */
  primaryTrade: TradeSlug;
  yearsInBusiness: number;
  /** ISO "YYYY-MM-DD" for date comparisons (newly-licensed section). */
  issueDate: string;
  status: LicenseStatus;
  bonded: boolean;
  workersComp: boolean;
  /** Any additional compliance chips ("CFL" etc.). */
  extraTags?: string[];
}

interface RawContractor {
  licenseNumber: string;
  companyName: string;
  neighborhood?: string;
  classifications: string[];
  yearsInBusiness: number;
  issueDate: string;
  status?: LicenseStatus;
  bonded?: boolean;
  workersComp?: boolean;
  extraTags?: string[];
}

const RAW: RawContractor[] = [
  // ─── Plumbing (primary) ──────────────────────────────────────────────
  { licenseNumber: "1045287", companyName: "Peninsula Plumbing",
    neighborhood: "Downtown", classifications: ["C-36"],
    yearsInBusiness: 37, issueDate: "1988-05-14",
    bonded: true, workersComp: true },
  { licenseNumber: "894221",  companyName: "Bayside Pipe & Drain",
    neighborhood: "Baywood",  classifications: ["C-36"],
    yearsInBusiness: 22, issueDate: "2003-02-19",
    bonded: true, workersComp: true },
  { licenseNumber: "723118",  companyName: "San Mateo Plumbing Works",
    classifications: ["C-36"],
    yearsInBusiness: 29, issueDate: "1996-09-02",
    bonded: true, workersComp: true },
  { licenseNumber: "912334",  companyName: "Reliable Plumbing Co.",
    neighborhood: "Hillsdale", classifications: ["C-36", "C-20"],
    yearsInBusiness: 15, issueDate: "2010-04-11",
    bonded: true, workersComp: true },
  { licenseNumber: "1158811", companyName: "Shoreview Plumbing",
    neighborhood: "Shoreview", classifications: ["C-36"],
    yearsInBusiness: 8,  issueDate: "2017-06-22",
    bonded: true, workersComp: false },
  { licenseNumber: "1280456", companyName: "Coastside Plumbing & Rooter",
    classifications: ["C-36"],
    yearsInBusiness: 3,  issueDate: "2022-11-03",
    bonded: true, workersComp: true },
  { licenseNumber: "1301299", companyName: "Edgewater Plumbing Group",
    neighborhood: "Downtown", classifications: ["C-36", "C-20"],
    yearsInBusiness: 1,  issueDate: "2024-08-29",
    bonded: true, workersComp: true },
  { licenseNumber: "552108",  companyName: "Pacific Pipe & Drain",
    classifications: ["C-36"],
    yearsInBusiness: 41, issueDate: "1984-01-17", status: "expired",
    bonded: true, workersComp: false },
  { licenseNumber: "668420",  companyName: "Fairmont Plumbing Services",
    neighborhood: "Hillsdale", classifications: ["C-36"],
    yearsInBusiness: 33, issueDate: "1992-03-08",
    bonded: true, workersComp: true },
  { licenseNumber: "1167902", companyName: "Crestmoor Plumbing",
    classifications: ["C-36", "C-15"],
    yearsInBusiness: 10, issueDate: "2015-05-20",
    bonded: false, workersComp: true },

  // ─── Electrical (primary) ────────────────────────────────────────────
  { licenseNumber: "984112",  companyName: "Bay Voltage Electric",
    neighborhood: "Downtown", classifications: ["C-10"],
    yearsInBusiness: 27, issueDate: "1998-07-11",
    bonded: true, workersComp: true, extraTags: ["CFL"] },
  { licenseNumber: "1031207", companyName: "Peninsula Power Works",
    classifications: ["C-10"],
    yearsInBusiness: 19, issueDate: "2006-10-03",
    bonded: true, workersComp: true },
  { licenseNumber: "873509",  companyName: "Aurora Electrical",
    neighborhood: "Baywood",  classifications: ["C-10", "C-20"],
    yearsInBusiness: 24, issueDate: "2001-05-27",
    bonded: true, workersComp: true },
  { licenseNumber: "1189334", companyName: "Bright Spark Electric",
    classifications: ["C-10", "C-20"],
    yearsInBusiness: 7,  issueDate: "2018-02-14",
    bonded: true, workersComp: true },
  { licenseNumber: "1234118", companyName: "Cascade Electric & Solar",
    neighborhood: "Shoreview", classifications: ["C-10"],
    yearsInBusiness: 4,  issueDate: "2021-09-02",
    bonded: true, workersComp: true, extraTags: ["CFL"] },
  { licenseNumber: "1295617", companyName: "Silverline Electric",
    classifications: ["C-10"],
    yearsInBusiness: 2,  issueDate: "2023-06-15",
    bonded: true, workersComp: true },
  { licenseNumber: "1311820", companyName: "Meridian Electric Co.",
    neighborhood: "Hillsdale", classifications: ["C-10"],
    yearsInBusiness: 1,  issueDate: "2024-11-08",
    bonded: true, workersComp: true },
  { licenseNumber: "741220",  companyName: "Coast Power Systems",
    classifications: ["C-10"],
    yearsInBusiness: 32, issueDate: "1993-02-01",
    bonded: true, workersComp: true },
  { licenseNumber: "1055721", companyName: "Voltaic Electric Works",
    classifications: ["C-10", "C-36"],
    yearsInBusiness: 17, issueDate: "2008-04-18",
    bonded: false, workersComp: true },
  { licenseNumber: "1322507", companyName: "Eastridge Electric",
    neighborhood: "Downtown", classifications: ["C-10"],
    yearsInBusiness: 0,  issueDate: "2025-03-12",
    bonded: true, workersComp: true },

  // ─── HVAC (primary) ──────────────────────────────────────────────────
  { licenseNumber: "786542",  companyName: "Coastline HVAC Services",
    classifications: ["C-20"],
    yearsInBusiness: 28, issueDate: "1997-08-22",
    bonded: true, workersComp: true },
  { licenseNumber: "1184567", companyName: "Meridian Climate Control",
    neighborhood: "Baywood", classifications: ["C-20"],
    yearsInBusiness: 10, issueDate: "2015-01-07",
    bonded: true, workersComp: true },
  { licenseNumber: "1259018", companyName: "Bayview Heating & Air",
    classifications: ["C-20", "C-36"],
    yearsInBusiness: 6,  issueDate: "2019-07-11",
    bonded: true, workersComp: true },
  { licenseNumber: "1307991", companyName: "Summit Climate Works",
    classifications: ["C-20"],
    yearsInBusiness: 1,  issueDate: "2024-10-19",
    bonded: true, workersComp: true },
  { licenseNumber: "1088210", companyName: "Cascade Mechanical",
    classifications: ["C-20"],
    yearsInBusiness: 13, issueDate: "2012-03-30",
    bonded: true, workersComp: false },

  // ─── Roofing (primary) ───────────────────────────────────────────────
  { licenseNumber: "1128946", companyName: "Summit Roofing Works",
    classifications: ["C-39"],
    yearsInBusiness: 11, issueDate: "2014-02-09",
    bonded: true, workersComp: true },
  { licenseNumber: "431267",  companyName: "Old Oak Roofing",
    classifications: ["C-39"],
    yearsInBusiness: 44, issueDate: "1981-05-02", status: "suspended",
    bonded: true, workersComp: true },
  { licenseNumber: "1217603", companyName: "Peninsula Ridge Roofing",
    neighborhood: "Hillsdale", classifications: ["C-39"],
    yearsInBusiness: 5,  issueDate: "2020-08-17",
    bonded: true, workersComp: true },

  // ─── Painting (primary) ──────────────────────────────────────────────
  { licenseNumber: "1210994", companyName: "Fresh Coat Painters",
    classifications: ["C-33"],
    yearsInBusiness: 8,  issueDate: "2017-04-22",
    bonded: true, workersComp: false },
  { licenseNumber: "1288711", companyName: "True North Painting",
    neighborhood: "Shoreview", classifications: ["C-33"],
    yearsInBusiness: 3,  issueDate: "2022-06-14",
    bonded: true, workersComp: true },

  // ─── General (Generalist) ────────────────────────────────────────────
  { licenseNumber: "623481",  companyName: "Ironside General Builders",
    classifications: ["B", "C-36", "C-10"],
    yearsInBusiness: 33, issueDate: "1992-01-18",
    bonded: true, workersComp: true, extraTags: ["CFL"] },
  { licenseNumber: "1153320", companyName: "Bay Area Trades Co.",
    neighborhood: "Downtown", classifications: ["B", "C-36", "C-10"],
    yearsInBusiness: 9,  issueDate: "2016-09-02",
    bonded: false, workersComp: true },
  { licenseNumber: "1301044", companyName: "Hillcrest Home Services",
    classifications: ["B", "C-33"],
    yearsInBusiness: 1,  issueDate: "2024-07-12",
    bonded: true, workersComp: true },
  { licenseNumber: "498233",  companyName: "Redwood Coast Builders",
    neighborhood: "Baywood", classifications: ["B", "C-39", "C-33"],
    yearsInBusiness: 38, issueDate: "1987-06-02",
    bonded: true, workersComp: true, extraTags: ["CFL"] },
  { licenseNumber: "712904",  companyName: "Cordillera General Contracting",
    classifications: ["B", "C-20", "C-10"],
    yearsInBusiness: 30, issueDate: "1995-09-18",
    bonded: true, workersComp: true },
  { licenseNumber: "889117",  companyName: "Blue Ridge Home Builders",
    neighborhood: "Hillsdale", classifications: ["B", "C-15"],
    yearsInBusiness: 24, issueDate: "2001-03-11",
    bonded: true, workersComp: true },
  { licenseNumber: "1091552", companyName: "Foothill Craft Builders",
    classifications: ["B", "C-33", "C-15", "C-27"],
    yearsInBusiness: 16, issueDate: "2009-11-04",
    bonded: true, workersComp: true, extraTags: ["CFL"] },
  { licenseNumber: "1278809", companyName: "Coastal Edge Remodeling",
    neighborhood: "Shoreview", classifications: ["B", "C-36"],
    yearsInBusiness: 4,  issueDate: "2021-05-23",
    bonded: true, workersComp: true },

  // ─── Landscape (primary) ─────────────────────────────────────────────
  { licenseNumber: "1077812", companyName: "Verde Landscape Design",
    classifications: ["C-27"],
    yearsInBusiness: 14, issueDate: "2011-05-16",
    bonded: true, workersComp: true },
  { licenseNumber: "1299102", companyName: "Baywood Green Landscape",
    neighborhood: "Baywood", classifications: ["C-27"],
    yearsInBusiness: 2,  issueDate: "2023-04-07",
    bonded: true, workersComp: true },

  // ─── Flooring (primary) ──────────────────────────────────────────────
  { licenseNumber: "1201488", companyName: "Keystone Flooring",
    classifications: ["C-15"],
    yearsInBusiness: 11, issueDate: "2014-11-20",
    bonded: true, workersComp: true },
];

export const MOCK_CONTRACTORS: MockContractor[] = RAW.map((r) => ({
  licenseNumber: r.licenseNumber,
  companyName: r.companyName,
  city: "San Mateo",
  neighborhood: r.neighborhood,
  classifications: r.classifications,
  type: deriveType(r.classifications),
  primaryTrade: primaryTradeFor(r.classifications),
  yearsInBusiness: r.yearsInBusiness,
  issueDate: r.issueDate,
  status: r.status ?? "active",
  bonded: r.bonded ?? false,
  workersComp: r.workersComp ?? false,
  extraTags: r.extraTags,
}));

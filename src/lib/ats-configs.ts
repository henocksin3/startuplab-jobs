import type { AtsConfigMap } from "./sync";

export const atsConfigs: AtsConfigMap = {
  // Teamtailor (RSS feed)
  spoor: { atsType: "teamtailor", atsConfig: { subdomain: "spoor" } },
  "no-isolation": { atsType: "teamtailor", atsConfig: { subdomain: "noisolation" } },
  plaace: { atsType: "teamtailor", atsConfig: { subdomain: "plaace" } },
  sloyd: { atsType: "teamtailor", atsConfig: { subdomain: "sloyd" } },
  "heimdall-power": { atsType: "teamtailor", atsConfig: { subdomain: "heimdallpower" } },
  nomono: { atsType: "teamtailor", atsConfig: { subdomain: "nomono" } },
  surplusmap: { atsType: "teamtailor", atsConfig: { subdomain: "surplusmap" } },
  attensi: { atsType: "teamtailor", atsConfig: { subdomain: "attensi" } },
  "over-easy": { atsType: "teamtailor", atsConfig: { subdomain: "overeasy" } },
  reprice: { atsType: "teamtailor", atsConfig: { subdomain: "reprice" } },
  gire: { atsType: "teamtailor", atsConfig: { subdomain: "gire" } },
  remarkable: { atsType: "teamtailor", atsConfig: { subdomain: "remarkable" } },
  "maritime-optima": { atsType: "teamtailor", atsConfig: { subdomain: "maritimeoptima" } },
  marketer: { atsType: "teamtailor", atsConfig: { subdomain: "marketer" } },
  aviant: { atsType: "teamtailor", atsConfig: { subdomain: "aviant" } },
  naer: { atsType: "teamtailor", atsConfig: { subdomain: "naer" } },
  cloudgeni: { atsType: "teamtailor", atsConfig: { subdomain: "cloudgeni" } },
  spond: { atsType: "teamtailor", atsConfig: { subdomain: "spond" } },
  photoncycle: { atsType: "teamtailor", atsConfig: { subdomain: "photoncycle" } },
  ardoq: { atsType: "teamtailor", atsConfig: { subdomain: "ardoq" } },
  nofence: { atsType: "teamtailor", atsConfig: { subdomain: "nofence" } },
  goscore: { atsType: "teamtailor", atsConfig: { subdomain: "goscore" } },
  hjemmelegene: { atsType: "teamtailor", atsConfig: { subdomain: "hjemmelegene" } },
  bruce: { atsType: "teamtailor", atsConfig: { subdomain: "bruce" } },
  antagonist: { atsType: "teamtailor", atsConfig: { subdomain: "antagonist" } },

  "glint-solar": { atsType: "teamtailor", atsConfig: { customDomain: "careers.glintsolar.com" } },

  // Workable
  kahoot: { atsType: "workable", atsConfig: { account: "kahoot" } },
  strise: { atsType: "workable", atsConfig: { account: "strise" } },
  mainteny: { atsType: "workable", atsConfig: { account: "mainteny-gmbh" } },

  // BambooHR
  zivid: { atsType: "bamboohr", atsConfig: { subdomain: "zivid" } },
  muybridge: { atsType: "bamboohr", atsConfig: { subdomain: "muybridge" } },
  joymo: { atsType: "bamboohr", atsConfig: { subdomain: "joymo" } },
  huddly: { atsType: "bamboohr", atsConfig: { subdomain: "huddly" } },
  favrit: { atsType: "bamboohr", atsConfig: { subdomain: "favrit" } },
  alfred: { atsType: "bamboohr", atsConfig: { subdomain: "alfred" } },
  intelecy: { atsType: "bamboohr", atsConfig: { subdomain: "intelecy" } },

  // Greenhouse
  decisions: { atsType: "greenhouse", atsConfig: { board: "decisions" } },
  current: { atsType: "greenhouse", atsConfig: { board: "current" } },
  grin: { atsType: "greenhouse", atsConfig: { board: "grin" } },
  manifold: { atsType: "greenhouse", atsConfig: { board: "manifoldai" } },

  // Ashby
  sanity: { atsType: "ashby", atsConfig: { board: "sanity" } },
  letta: { atsType: "ashby", atsConfig: { board: "letta" } },
  adapt: { atsType: "ashby", atsConfig: { board: "adapt" } },
  rewind: { atsType: "ashby", atsConfig: { board: "rewind" } },

  // Tally form
  sokkel: { atsType: "tally", atsConfig: { formId: "wvKvxA" } },

  // Scrape careers page (Jobylon)
  "dintero-as": {
    atsType: "scrape-careers",
    atsConfig: {
      url: "https://www.dintero.com/careers",
      linkPattern: "https://emp\\.jobylon\\.com/jobs/",
      stripPrefix: "Dintero ",
      enrichJsonLd: true,
    },
  },

  // Tally form (form builder used by some companies that lack a dedicated career page)
  otee: {
    atsType: "tally",
    atsConfig: { formId: "3jddl1", location: "Oslo, Norway (or remote, CET/CEST)" },
  },
};

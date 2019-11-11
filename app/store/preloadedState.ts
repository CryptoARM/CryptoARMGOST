import * as fs from "fs";
import { OrderedMap, Record } from "immutable";
import { CA_CERTREGUESTS_JSON, CA_CERTTEMPLATE_JSON, CA_CSR_JSON, CA_REGREGUESTS_JSON, CERTIFICATES_DSS_JSON,
  DSS_TOKENS_JSON, DSS_USERS_JSON, POLICY_DSS_JSON, SERVICES_JSON, SETTINGS_JSON, TEMPLATES_PATH } from "../constants";
import { CertificateDSSModel, DefaultReducerState as DefaultCertificatesDSSState } from "../reducer/certificatesDSS";
import { CertificateRequestCAModel, DefaultReducerState as DefaultRequestsReducerState } from "../reducer/certrequests";
import { CertTemplateModel, DefaultReducerState as DefaultCertTemplateReducerState } from "../reducer/certtemplate";
import { DefaultReducerState as DefaultPolicyDSSState, PolicyDSSModel } from "../reducer/policyDSS";
import { DefaultReducerState as DefaultRegrequestsReducerState, RegRequestModel } from "../reducer/regrequests";
import { DefaultReducerState as DefaultServicesReducerState, ServiceModel,
  SettingsModel as ServiceSettingsModel } from "../reducer/services";
import {
  DefaultReducerState as DefaultSettingsState, EncryptModel,
  RecipientModel, SettingsModel as GlobalSettingsModel, SignModel,
} from "../reducer/settings";
import { DefaultReducerState as DefaultTemplatesReducerState, TemplateModel } from "../reducer/templates";
import { DefaultReducerState as DefaultTokenReducerState, TokenDSSModel } from "../reducer/tokens";
import { DefaultReducerState as DefaultUsersDSSReducerState, UsersDSSModel } from "../reducer/users";
import { fileExists, mapToArr } from "../utils";

let odata = {};

if (fileExists(SETTINGS_JSON)) {
  const data = fs.readFileSync(SETTINGS_JSON, "utf8");

  if (data) {
    try {
      odata = JSON.parse(data);

      let settingsMap = new DefaultSettingsState();

      for (const setting of odata.settings) {
        let encrypt = new EncryptModel(setting.encrypt);
        encrypt = encrypt.setIn(["recipients"], OrderedMap({}));

        settingsMap = settingsMap.setIn(["entities", setting.id], new GlobalSettingsModel({
          ...setting,
          encrypt,
          id: setting.id,
          outfolder: setting.outfolder,
          saveToDocuments: setting.saveToDocuments,
          sign: new SignModel(setting.sign),
        }));

        for (const recipient of setting.encrypt.recipients) {
          settingsMap = settingsMap.setIn(["entities", setting.id, "encrypt", "recipients", recipient.certId], new RecipientModel({
            certId: recipient.certId,
          }));
        }
      }

      if (odata.default && settingsMap) {
        settingsMap = settingsMap.set("default", odata.default);
      }

      odata.settings = settingsMap;

      if (odata.settings && !odata.settings.cloudCSP) {
        odata.settings.cloudCSP = {
          authURL: "https://dss.cryptopro.ru/STS/oauth",
          restURL: "https://dss.cryptopro.ru/SignServer/rest",
        };
      }
    } catch (e) {
      console.log("error", e);
      odata = {};
    }
  }
}

if (fileExists(SERVICES_JSON)) {
  const services = fs.readFileSync(SERVICES_JSON, "utf8");

  if (services) {
    try {
      let servicesMap = new DefaultServicesReducerState();

      const data = JSON.parse(services);

      for (const service of data.services) {
        let mservice = new ServiceModel({ ...service });
        mservice = mservice.setIn(["settings"], new ServiceSettingsModel({ ...service.settings }));
        servicesMap = servicesMap.setIn(["entities", service.id], mservice);
      }

      odata.services = servicesMap;
    } catch (e) {
      console.log(e)
      odata.services = {};
    }
  }
}

if (fileExists(CA_REGREGUESTS_JSON)) {
  const regRequests = fs.readFileSync(CA_REGREGUESTS_JSON, "utf8");

  if (regRequests) {
    try {
      let regrequestsMap = new DefaultRegrequestsReducerState();

      const data = JSON.parse(regRequests);

      for (const regrequest of data.regrequests) {
        const mreg = new RegRequestModel({ ...regrequest });
        regrequestsMap = regrequestsMap.setIn(["entities", regrequest.id], mreg);
      }

      odata.regrequests = regrequestsMap;
    } catch (e) {
      //
    }
  }
}

if (fileExists(CA_CERTREGUESTS_JSON)) {
  const requests = fs.readFileSync(CA_CERTREGUESTS_JSON, "utf8");

  if (requests) {
    try {
      let requestsMap = new DefaultRequestsReducerState();

      const data = JSON.parse(requests);

      for (const request of data.certrequests) {
        const mreg = new CertificateRequestCAModel({ ...request });
        requestsMap = requestsMap.setIn(["entities", request.id], mreg);
      }

      odata.certrequests = requestsMap;
    } catch (e) {
      //
    }
  }
}

if (fileExists(CA_CERTTEMPLATE_JSON)) {
  const certtemplate = fs.readFileSync(CA_CERTTEMPLATE_JSON, "utf8");

  if (certtemplate) {
    try {
      let certtemplateMap = new DefaultCertTemplateReducerState();

      const data = JSON.parse(certtemplate);

      for (const template of data.certtemplate) {
        const mreg = new CertTemplateModel({ ...template });
        certtemplateMap = certtemplateMap.setIn(["entities", template.id], mreg);
      }

      odata.certtemplate = certtemplateMap;
    } catch (e) {
      //
    }
  }
}

if (fileExists(DSS_USERS_JSON)) {
  const users = fs.readFileSync(DSS_USERS_JSON, "utf8");

  if (users) {
    try {
      let userMap = new DefaultUsersDSSReducerState();

      const data = JSON.parse(users);

      for (const user of data.users) {
        const mtoken = new UsersDSSModel({ ...user });
        userMap = userMap.setIn(["entities", user.id], mtoken);
      }

      odata.users = userMap;
    } catch (e) {
      //
    }
  }
}

if (fileExists(CERTIFICATES_DSS_JSON)) {
  const certificatesDSS = fs.readFileSync(CERTIFICATES_DSS_JSON, "utf8");

  if (certificatesDSS) {
    try {
      let certificateMap = new DefaultCertificatesDSSState();

      const data = JSON.parse(certificatesDSS);

      for (const cert of data.certificatesDSS) {
        const mcert = new CertificateDSSModel({ ...cert });
        certificateMap = certificateMap.setIn(["entities", cert.id], mcert);
      }

      odata.certificatesDSS = certificateMap;
    } catch (e) {
      //
    }
  }
}

if (fileExists(POLICY_DSS_JSON)) {
  const policyDSS = fs.readFileSync(POLICY_DSS_JSON, "utf8");

  if (policyDSS) {
    try {
      let policyMap = new DefaultPolicyDSSState();

      const data = JSON.parse(policyDSS);

      for (const policy of data.policyDSS) {
        const mpolicy = new PolicyDSSModel({ ...policy });
        policyMap = policyMap.setIn(["entities", policy.id], mpolicy);
      }

      odata.policyDSS = policyMap;
    } catch (e) {
      //
    }
  }
}

if (fileExists(TEMPLATES_PATH)) {
  const templates = fs.readFileSync(TEMPLATES_PATH, "utf8");

  if (templates) {
    try {
      let templatesMap = new DefaultTemplatesReducerState();

      const data = JSON.parse(templates);

      for (const template of data.TEMPLATES) {
        const mtemplate = new TemplateModel({ ...template });
        templatesMap = templatesMap.update("entities", (entities) => entities.add(mtemplate));
      }

      odata.templates = templatesMap;
    } catch (e) {
      //
    }
  }

}

export default odata;

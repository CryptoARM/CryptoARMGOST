import { Record } from "immutable";
import {
  FAIL, LOAD_LICENSE,
  START, SUCCESS, VERIFY_LICENSE,
} from "../constants";

const LicenseModel = Record({
  aud: "-",
  exp: null,
  iat: null,
  iss: "-",
  jti: "-",
  sub: "-",
});

const DefaultReducerState = Record({
  data: null,
  info: new LicenseModel(),
  lic_error: null,
  lic_format: null,
  loaded: false,
  loading: false,
  status: false,
  verified: false,
});

export default (license = new DefaultReducerState(), action) => {
  const { type, payload } = action;

  switch (type) {
    case LOAD_LICENSE + START:
      return license
        .set("loading", true)
        .set("loaded", false);

    case LOAD_LICENSE + SUCCESS:
      return license
        .set("info", new LicenseModel(payload.lic))
        .set("data", payload.data)
        .set("loading", false)
        .set("loaded", true)
        .set("verified", true)
        .set("lic_format", payload.lic_format)
        .set("lic_error", payload.lic_error)
        .set("status", payload.licenseStatus);

    case LOAD_LICENSE + FAIL:
      return license
        .set("loading", false)
        .set("loaded", false)
        .set("status", false)
        .set("verified", true)
        .set("lic_error", payload.lic_error)
        .set("lic_format", payload.lic_format)
        .set("data", payload.data);

    case VERIFY_LICENSE:
      return license
        .set("status", payload.licenseStatus)
        .set("verified", true)
        .set("lic_format", payload.lic_format);
  }

  return license;
};

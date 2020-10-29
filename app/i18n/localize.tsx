import PropTypes from "prop-types";
import {
  EN, GOSR3411_94_WITH_GOSTR3410_94, GOST2001, GOST3410_12_256,
  GOST3410_12_512, GOST89, GOST94, GOSTR3411_94_WITH_GOSTR3410_2001, MD_GOST12_256,
} from "../constants";
import {
  MD_GOST12_512, MD_GOST94, RU, SIGNWITHDIGEST_GOST3410_12_256, SIGNWITHDIGEST_GOST3410_12_512,
} from "../constants";
import en from "./EN";
import ru from "./RU";

export default function localize(message: string, locale = RU) {
  const category: string = message.substring(0, message.indexOf("."));
  const field: string = message.substring(message.indexOf(".") + 1, message.length);

  switch (locale) {
    case RU:
      return ru[category][field];
    case EN:
      return en[category][field];
  }
}

localize.contextTypes = {
  locale: PropTypes.string.isRequired,
};

export function localizeAlgorithm(algorithm: string, locale: string) {
  let msg;

  switch (algorithm) {
    case SIGNWITHDIGEST_GOST3410_12_256:
      msg = "Algorithm.id_tc26_signwithdigest_gost3410_12_256";
      break;
    case SIGNWITHDIGEST_GOST3410_12_512:
      msg = "Algorithm.id_tc26_signwithdigest_gost3410_12_512";
      break;
    case GOSTR3411_94_WITH_GOSTR3410_2001:
      msg = "Algorithm.id_GostR3411_94_with_GostR3410_2001";
      break;
    case GOSR3411_94_WITH_GOSTR3410_94:
      msg = "Algorithm.id_GostR3411_94_with_GostR3410_94";
      break;
    case MD_GOST94:
      msg = "Algorithm.id_GostR3411_94";
      break;
    case MD_GOST12_256:
      msg = "Algorithm.id_tc26_gost3411_12_256";
      break;
    case MD_GOST12_512:
      msg = "Algorithm.id_tc26_gost3411_12_512";
      break;
    case GOST3410_12_256:
      msg = "Algorithm.id_tc26_gost3410_12_256";
      break;
    case GOST3410_12_512:
      msg = "Algorithm.id_tc26_gost3410_12_512";
      break;
    case GOST2001:
      msg = "Algorithm.id_GostR3410_2001";
      break;
    case GOST94:
      msg = "Algorithm.id_GostR3410_94";
      break;
    case GOST89:
      msg = "Algorithm.id_Gost28147_89";
      break;
    default:
      return algorithm;
  }

  return localize(msg, locale);
}

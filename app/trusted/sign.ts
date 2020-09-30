import * as fs from "fs";
import * as path from "path";
import {
  DEFAULT_DOCUMENTS_PATH, DEFAULT_PATH, SIGNATURE_STANDARD, TSP_OCSP_ENABLED,
  USER_NAME,
} from "../constants";
import localize from "../i18n/localize";
import { ISignParams } from "../reducer/settings";
import { IOcsp } from "../reducer/signatures";
import { fileCoding, fileExists } from "../utils";
import logger from "../winstonLogger";

const dialog = window.electron.remote.dialog;

export function loadSign(uri: string): trusted.cms.SignedData {
  try {
    let format: trusted.DataFormat;
    let cms: trusted.cms.SignedData;

    format = fileCoding(uri);
    cms = new trusted.cms.SignedData();
    cms.policies = ["noSignerCertificateVerify"];
    cms.load(uri, format);

    return cms;
  } catch (e) {
    $(".toast-load_sign_failed").remove();
    Materialize.toast(localize("Sign.load_sign_failed", window.locale), 2000, "toast-load_sign_failed");

    return undefined;
  }
}

export function setDetachedContent(cms: trusted.cms.SignedData, uri: string, showDialog: boolean = true): trusted.cms.SignedData {
  try {
    if (cms.isDetached()) {
      let tempURI: string;
      tempURI = uri.substring(0, uri.lastIndexOf("."));
      if (!fileExists(tempURI)) {
        if (showDialog) {
          tempURI = dialog.showOpenDialogSync(null, { title: localize("Sign.sign_content_file", window.locale) + path.basename(uri), properties: ["openFile"] });

          if (tempURI) {
            tempURI = tempURI[0];
          }

          if (!tempURI || !fileExists(tempURI)) {
            $(".toast-verify_get_content_failed").remove();
            Materialize.toast(localize("Sign.verify_get_content_failed", window.locale), 2000, "toast-verify_get_content_failed");

            return undefined;
          }
        } else {
          return undefined;
        }
      }

      cms.content = {
        type: trusted.cms.SignedDataContentType.url,
        data: tempURI,
      };
    }

    return cms;
  } catch (e) {
    $(".toast-set_content_failed").remove();
    Materialize.toast(localize("Sign.set_content_failed", window.locale), 2000, "toast-set_content_failed");

    return undefined;
  }
}

export function signFile(
  uri: string,
  cert: trusted.pki.Certificate,
  policies: any,
  params: ISignParams | null = null,
  format: trusted.DataFormat,
  folderOut: string,
) {
  let outURI: string;

  if (folderOut.length > 0) {
    outURI = path.join(folderOut, path.basename(uri) + ".sig");
  } else {
    outURI = uri + ".sig";
  }

  let indexFile: number = 1;
  let newOutUri: string = outURI;
  const fileUri = outURI.substring(0, outURI.lastIndexOf("."));

  while (fileExists(newOutUri)) {
    const parsed = path.parse(fileUri);
    newOutUri = path.join(parsed.dir, parsed.name + "_(" + indexFile + ")" + parsed.ext + ".sig");
    indexFile++;
  }

  outURI = newOutUri;
  const newFileUri = outURI.substring(0, outURI.lastIndexOf("."));

  try {
    const sd: trusted.cms.SignedData = new trusted.cms.SignedData();

    if (TSP_OCSP_ENABLED && params) {
      if (params && params.signModel && params.signModel.standard === SIGNATURE_STANDARD.CADES) {
        const connSettings = new trusted.utils.ConnectionSettings();

        if (params.tspModel && params.tspModel.use_proxy) {
          connSettings.ProxyAddress = params.tspModel.proxy_url;

          if (params.tspModel.proxy_login) {
            connSettings.ProxyUserName = params.tspModel.proxy_login;
          }

          if (params.tspModel.proxy_password) {
            connSettings.ProxyPassword = params.tspModel.proxy_password;
          }

          if (params.tspModel.proxy_login && params.tspModel.proxy_password) {
            connSettings.AuthType = 1;
          }
        }
        if (params.tspModel && params.tspModel.url) {
          connSettings.Address = params.tspModel.url;
        }

        const ocspSettings = new trusted.utils.ConnectionSettings();

        if (params.ocspModel && params.ocspModel.use_proxy) {
          ocspSettings.ProxyAddress = params.ocspModel.proxy_url;

          if (params.ocspModel.proxy_login) {
            ocspSettings.ProxyUserName = params.ocspModel.proxy_login;
          }

          if (params.ocspModel.proxy_password) {
            ocspSettings.ProxyPassword = params.ocspModel.proxy_password;
          }

          if (params.ocspModel.proxy_login && params.ocspModel.proxy_password) {
            ocspSettings.AuthType = 1;
          }
        }
        if (params.ocspModel && params.ocspModel.url) {
          ocspSettings.Address = params.ocspModel.url;
        }

        const cadesParams = new trusted.cms.CadesParams();
        cadesParams.cadesType = trusted.cms.CadesType.ctCadesXLT1;
        cadesParams.connSettings = connSettings;

        if (ocspSettings.ProxyAddress || ocspSettings.Address) {
          cadesParams.ocspSettings = ocspSettings;
        }

        sd.signParams = cadesParams;
      } else if (params.tspModel && params.signModel && (params.signModel.timestamp_on_data || params.signModel.timestamp_on_sign)) {
        const connSettings = new trusted.utils.ConnectionSettings();

        if (params.tspModel.use_proxy) {
          connSettings.ProxyAddress = params.tspModel.proxy_url;

          if (params.tspModel.proxy_login) {
            connSettings.ProxyUserName = params.tspModel.proxy_login;
          }

          if (params.tspModel.proxy_password) {
            connSettings.ProxyPassword = params.tspModel.proxy_password;
          }

          if (params.tspModel.proxy_login && params.tspModel.proxy_password) {
            connSettings.AuthType = 1;
            connSettings.ProxyAuthType = 1;
          }
        }
        if (params.tspModel && params.tspModel.url) {
          connSettings.Address = params.tspModel.url;
        }

        const tspParams = new trusted.cms.TimestampParams();
        tspParams.connSettings = connSettings;

        let stampType;

        if (params.signModel.timestamp_on_data && !params.signModel.timestamp_on_sign) {
          stampType = trusted.cms.StampType.stContent;
        } else if (!params.signModel.timestamp_on_data && params.signModel.timestamp_on_sign) {
          stampType = trusted.cms.StampType.stSignature;
        } else if (params.signModel.timestamp_on_data && params.signModel.timestamp_on_sign) {
          // tslint:disable-next-line: no-bitwise
          stampType = trusted.cms.StampType.stContent | trusted.cms.StampType.stSignature;
        }

        if (stampType) {
          tspParams.stampType = stampType;
          sd.signParams = tspParams;
        }
      }
    }

    sd.policies = policies;
    sd.content = {
      type: trusted.cms.SignedDataContentType.url,
      data: uri,
    };
    sd.sign(cert);
    sd.save(outURI, format);

    sd.freeContent();
  } catch (err) {
    logger.log({
      certificate: cert.subjectName,
      level: "error",
      message: err.message ? err.message : err,
      operation: "Подпись",
      operationObject: {
        in: path.basename(uri),
        out: "Null",
      },
      userName: USER_NAME,
    });

    return "";
  }

  logger.log({
    certificate: cert.subjectName,
    level: "info",
    message: "",
    operation: "Подпись",
    operationObject: {
      in: path.basename(uri),
      out: path.basename(outURI),
    },
    userName: USER_NAME,
  });

  if (folderOut === DEFAULT_DOCUMENTS_PATH && policies.includes("detached") && !fileExists(newFileUri)) {
    fs.writeFileSync(newFileUri, fs.readFileSync(uri));
  }

  return outURI;
}

export function resignFile(
  uri: string,
  cert: trusted.pki.Certificate,
  policies: any,
  params: ISignParams | null = null,
  format: trusted.DataFormat,
  folderOut: string) {
  let outURI: string;

  if (folderOut.length > 0) {
    outURI = path.join(folderOut, path.basename(uri));

    if (path.dirname(uri) !== folderOut) {
      let indexFile: number = 1;
      let newOutUri: string = outURI;
      const fileUri = outURI.substring(0, outURI.lastIndexOf("."));

      while (fileExists(newOutUri)) {
        const parsed = path.parse(fileUri);
        newOutUri = path.join(parsed.dir, parsed.name + "_(" + indexFile + ")" + parsed.ext + ".sig");
        indexFile++;
      }

      outURI = newOutUri;
    }
  } else {
    outURI = uri;
  }

  try {
    let sd: trusted.cms.SignedData = loadSign(uri);

    const certs: trusted.pki.CertificateCollection = sd.certificates();
    let tempCert: trusted.pki.Certificate;
    for (let i = 0; i < certs.length; i++) {
      tempCert = certs.items(i);
      if (tempCert.equals(cert)) {
        policies.push("noCertificates");
        break;
      }
    }

    if (sd.isDetached()) {
      policies.push("detached");

      // tslint:disable-next-line: no-conditional-assignment
      if (!(sd = setDetachedContent(sd, uri))) {
        return;
      }

      sd.policies = ["noSignerCertificateVerify"];

      if (!(verifySign(sd))) {
        return;
      }
    }

    if (TSP_OCSP_ENABLED && params) {
      if (params && params.signModel && params.signModel.standard === SIGNATURE_STANDARD.CADES) {
        const connSettings = new trusted.utils.ConnectionSettings();

        if (params.tspModel && params.tspModel.use_proxy) {
          connSettings.ProxyAddress = params.tspModel.proxy_url;

          if (params.tspModel.proxy_login) {
            connSettings.ProxyUserName = params.tspModel.proxy_login;
          }

          if (params.tspModel.proxy_password) {
            connSettings.ProxyPassword = params.tspModel.proxy_password;
          }

          if (params.tspModel.proxy_login && params.tspModel.proxy_password) {
            connSettings.AuthType = 1;
            connSettings.ProxyAuthType = 1;
          }
        }

        if (params.tspModel && params.tspModel.url) {
          connSettings.Address = params.tspModel.url;
        }

        const ocspSettings = new trusted.utils.ConnectionSettings();

        if (params.ocspModel && params.ocspModel.use_proxy) {
          ocspSettings.ProxyAddress = params.ocspModel.proxy_url;

          if (params.ocspModel.proxy_login) {
            ocspSettings.ProxyUserName = params.ocspModel.proxy_login;
          }

          if (params.ocspModel.proxy_password) {
            ocspSettings.ProxyPassword = params.ocspModel.proxy_password;
          }

          if (params.ocspModel.proxy_login && params.ocspModel.proxy_password) {
            ocspSettings.AuthType = 1;
            connSettings.ProxyAuthType = 1;
          }
        }

        if (params.ocspModel && params.ocspModel.url) {
          ocspSettings.Address = params.ocspModel.url;
        }

        const cadesParams = new trusted.cms.CadesParams();
        cadesParams.cadesType = trusted.cms.CadesType.ctCadesXLT1;
        cadesParams.connSettings = connSettings;

        if (ocspSettings.ProxyAddress || ocspSettings.Address) {
          cadesParams.ocspSettings = ocspSettings;
        }

        sd.signParams = cadesParams;
      } else if (params.tspModel && params.signModel && (params.signModel.timestamp_on_data || params.signModel.timestamp_on_sign)) {
        const connSettings = new trusted.utils.ConnectionSettings();

        if (params.tspModel.use_proxy) {
          connSettings.ProxyAddress = params.tspModel.proxy_url;

          if (params.tspModel.proxy_login) {
            connSettings.ProxyUserName = params.tspModel.proxy_login;
          }

          if (params.tspModel.proxy_password) {
            connSettings.ProxyPassword = params.tspModel.proxy_password;
          }

          if (params.tspModel.proxy_login && params.tspModel.proxy_password) {
            connSettings.AuthType = 1;
          }
        }
        if (params.tspModel && params.tspModel.url) {
          connSettings.Address = params.tspModel.url;
        }

        const tspParams = new trusted.cms.TimestampParams();
        tspParams.connSettings = connSettings;

        let stampType;

        if (params.signModel.timestamp_on_data && !params.signModel.timestamp_on_sign) {
          stampType = trusted.cms.StampType.stContent;
        } else if (!params.signModel.timestamp_on_data && params.signModel.timestamp_on_sign) {
          stampType = trusted.cms.StampType.stSignature;
        } else if (params.signModel.timestamp_on_data && params.signModel.timestamp_on_sign) {
          // tslint:disable-next-line: no-bitwise
          stampType = trusted.cms.StampType.stContent | trusted.cms.StampType.stSignature;
        }

        if (stampType) {
          tspParams.stampType = stampType;
          sd.signParams = tspParams;
        }
      }
    }

    format = fileCoding(uri);

    sd.policies = policies;
    sd.sign(cert);
    sd.save(outURI, format);
  } catch (err) {
    logger.log({
      certificate: cert.subjectName,
      level: "error",
      message: err.message ? err.message : err,
      operation: "Подпись",
      operationObject: {
        in: path.basename(uri),
        out: "Null",
      },
      userName: USER_NAME,
    });

    return "";
  }

  logger.log({
    certificate: cert.subjectName,
    level: "info",
    message: "Добавление подписи",
    operation: "Подпись",
    operationObject: {
      in: path.basename(uri),
      out: path.basename(outURI),
    },
    userName: USER_NAME,
  });

  return outURI;
}

export function unSign(uri: string, folderOut: string, logOperation = true): any {
  let outURI: string;
  let content: trusted.cms.ISignedDataContent;

  if (folderOut && folderOut.length > 0) {
    outURI = path.join(folderOut, path.basename(uri));
    outURI = outURI.substring(0, outURI.lastIndexOf("."));
  } else {
    outURI = uri.substring(0, uri.lastIndexOf("."));
  }

  let indexFile: number = 1;
  let newOutUri: string = outURI;
  while (fileExists(newOutUri)) {
    const parsed = path.parse(outURI);

    newOutUri = path.join(parsed.dir, parsed.name + "_(" + indexFile + ")" + parsed.ext);
    indexFile++;
  }

  outURI = newOutUri;

  try {
    let cms: trusted.cms.SignedData = loadSign(uri);

    if (!cms.isDetached()) {
      content = cms.content;
      try {
        fs.writeFileSync(outURI, content.data);

        if (logOperation) {
          logger.log({
            level: "info",
            message: "",
            operation: "Снятие подписи",
            operationObject: {
              in: path.basename(uri),
              out: path.basename(outURI),
            },
            userName: USER_NAME,
          });
        }
      } catch (err) {
        if (logOperation) {
          logger.log({
            certificate: "",
            level: "error",
            message: err.message ? err.message : err,
            operation: "Снятие подписи",
            operationObject: {
              in: path.basename(uri),
              out: "Null",
            },
            userName: USER_NAME,
          });
        }

        return "";
      }
    } else {
      $(".toast-files_unsigned_detached").remove();
      Materialize.toast(localize("Sign.files_unsigned_detached", window.locale), 2000, "toast-files_unsigned_detached");
      return "undeatached";
    }
  } catch (err) {
    if (logOperation) {
      logger.log({
        certificate: "",
        level: "error",
        message: err.message ? err.message : err,
        operation: "Снятие подписи",
        operationObject: {
          in: path.basename(uri),
          out: "Null",
        },
        userName: USER_NAME,
      });
    }

    return "";
  }

  return outURI;
}

/**
 * @param  {string} uri
 */
export function verifySign(cms: trusted.cms.SignedData): boolean {
  let res: boolean = false;

  try {
    /*let signers: trusted.cms.SignerCollection;
    let signerCert: trusted.pki.Certificate;
    let signer: trusted.cms.Signer;
    let signerCertItems: trusted.pkistore.PkiItem[];
    let certs: trusted.pki.CertificateCollection = new trusted.pki.CertificateCollection();

    signers = cms.signers();
    certs = cms.certificates();

    for (let i = 0; i < signers.length; i++) {
      signer = signers.items(i);
      signerCertItems = window.PKISTORE.find({
        issuerName: signer.issuerName,
        serial: signer.serialNumber,
      });

      for (let j = 0; j < signerCertItems.length; j++) {
        signerCert = window.PKISTORE.getPkiObject(signerCertItems[j]);
        if (signerCert) {
          certs.push(signerCert);
          break;
        }
      }
    }*/

    res = cms.verify();
    return res;
  } catch (e) {
    $(".toast-verify_sign_failed").remove();
    Materialize.toast(localize("Sign.verify_sign_failed", window.locale), 2000, "toast-verify_sign_failed");
    return res;
  }
}

export function verifySignerCert(cert: trusted.pki.Certificate): boolean {
  try {
    return trusted.utils.Csp.verifyCertificateChain(cert);
  } catch (e) {
    return false;
  }
}

export function getSignPropertys(cms: trusted.cms.SignedData) {
  try {
    let signers: trusted.cms.SignerCollection;
    let signerCert: trusted.pki.Certificate;
    let signer: trusted.cms.Signer;
    // let signerId: trusted.cms.SignerId;
    let signerCertItems: trusted.pkistore.PkiItem[];
    let certificates: trusted.pki.CertificateCollection;
    let ch: trusted.pki.CertificateCollection;
    // let chain: trusted.pki.Chain;
    let cert: trusted.pki.Certificate;
    let certificatesSignStatus: boolean;
    let certSignStatus: boolean;
    let signerStatus: boolean = false;
    let result: any = [];
    let certSign: any = [];

    // chain = new trusted.pki.Chain();

    signers = cms.signers();
    certificates = cms.certificates();

    for (let i = 0; i < signers.length; i++) {
      signer = signers.items(i);
      // signerId = signer.signerId;

      if (!signer.certificate) {
        for (let j = 0; j < certificates.length; j++) {
          let tmpCert: trusted.pki.Certificate = certificates.items(j);
          if ((tmpCert.issuerName === signer.issuerName) && (tmpCert.serialNumber === signer.serialNumber)) {
            signer.certificate = tmpCert;
            break;
          }
        }
      }

      if (!signer.certificate) {
        signerCertItems = window.PKISTORE.find({
          issuerName: signer.issuerName,
          serial: signer.serialNumber,
        });

        for (let j = 0; j < signerCertItems.length; j++) {
          signerCert = window.PKISTORE.getPkiObject(signerCertItems[j]);
          if (signerCert) {
            signer.certificate = signerCert;
            break;
          }
        }
      }

      if (!signer.certificate) {
        $(".toast-signercert_not_found").remove();
        Materialize.toast(localize("Sign.signercert_not_found", window.locale), 2000, "toast-signercert_not_found");
      }
    }

    let curRes: any;
    for (let i: number = 0; i < signers.length; i++) {
      certificatesSignStatus = true;
      signer = signers.items(i);
      cert = signer.certificate;

      const timestamps = [];
      let ocsp: IOcsp = {};

      try {
        ch = trusted.utils.Csp.buildChain(cert);
      } catch (e) {
        ch = undefined;
      }

      curRes = {
        alg: undefined,
        certs: undefined,
        digestAlgorithm: undefined,
        status_verify: undefined,
        subject: undefined,
        timestamps: [],
      };

      try {
        if (TSP_OCSP_ENABLED && signer.isCades) {
          const ocspResp = signer.ocspResp;

          ocsp.Certificates = ocspResp.Certificates;
          ocsp.NextUpdate = ocspResp.NextUpdate();
          ocsp.OCSP = ocspResp;
          ocsp.OcspCert = ocspResp.OcspCert;
          ocsp.ProducedAt = ocspResp.ProducedAt;
          ocsp.RespNumber = ocspResp.RespNumber;
          ocsp.RespStatus = ocspResp.RespStatus;
          ocsp.RespStatus = ocspResp.RespStatus;
          ocsp.RevReason = ocspResp.RevReason();
          ocsp.RevTime = ocspResp.RevTime();
          ocsp.SignatureAlgorithmOid = ocspResp.SignatureAlgorithmOid;
          ocsp.Status = ocspResp.Status();
          ocsp.ThisUpdate = ocspResp.ThisUpdate();
        }
      } catch (e) {
        console.log("------ ERRROR GET OCSP PROPS ------");
        console.log(e);
      }

      try {
        if (TSP_OCSP_ENABLED) {
          for (const stType in trusted.cms.StampType) {
            if (Number(stType)) {
              const timestamp = signer.timestamp(parseInt(stType, 10));
              if (timestamp) {
                timestamps.push({
                  Accuracy: timestamp.Accuracy,
                  Certificates: timestamp.Certificates,
                  DataHash: timestamp.DataHash,
                  DataHashAlgOID: timestamp.DataHashAlgOID,
                  HasNonce: timestamp.HasNonce,
                  Ordering: timestamp.Ordering,
                  PolicyID: timestamp.PolicyID,
                  SerialNumber: timestamp.SerialNumber,
                  TSACertificate: timestamp.TSACertificate,
                  TSP: timestamp,
                  Time: timestamp.Time,
                  TsaName: timestamp.TsaName,
                  Type: stType,
                });
              }
            }
          }
        }
      } catch (e) {
        console.log("------ ERRROR GET TSP PROPS ------");
        console.log(e);
      }

      if (!ch || !ch.length || ch.length === 0) {
        certificatesSignStatus = false;
        $(".toast-build_chain_failed").remove();
        Materialize.toast(localize("Sign.build_chain_failed", window.locale), 2000, "toast-build_chain_failed");
        certSign.push({
          active: false,
          serial: cert.serialNumber,
          subjectFriendlyName: cert.subjectFriendlyName,
          subjectName: cert.subjectName,
          organizationName: cert.organizationName,
          issuerFriendlyName: cert.issuerFriendlyName,
          issuerName: cert.issuerName,
          notBefore: cert.notBefore,
          notAfter: cert.notAfter,
          signatureAlgorithm: cert.signatureAlgorithm,
          signatureDigestAlgorithm: cert.signatureDigestAlgorithm,
          publicKeyAlgorithm: cert.publicKeyAlgorithm,
          hash: cert.thumbprint,
          key: false,
          object: cert,
        });
      } else {
        for (let j: number = ch.length - 1; j >= 0; j--) {
          const it: trusted.pki.Certificate = ch.items(j);
          certSignStatus = verifySignerCert(it);
          if (!(certSignStatus)) {
            certificatesSignStatus = false;
          }
          certSign.push({
            active: false,
            serial: it.serialNumber,
            subjectFriendlyName: it.subjectFriendlyName,
            subjectName: it.subjectName,
            organizationName: it.organizationName,
            issuerFriendlyName: it.issuerFriendlyName,
            issuerName: it.issuerName,
            notAfter: it.notAfter,
            notBefore: it.notBefore,
            signatureAlgorithm: it.signatureAlgorithm,
            signatureDigestAlgorithm: it.signatureDigestAlgorithm,
            publicKeyAlgorithm: it.publicKeyAlgorithm,
            hash: it.thumbprint,
            key: false,
            status: certSignStatus,
            object: cert,
          });
        }
      }

      curRes = {
        alg: cert.signatureAlgorithm,
        certs: certSign,
        digestAlgorithm: cert.signatureDigestAlgorithm,
        ocsp,
        signingTime: signer.signingTime,
        status_verify: false,
        subject: cert.subjectFriendlyName,
        timestamps,
      };
      certSign = [];

      try {
        signerStatus = cms.verify(signer);
      } catch (e) {
        $(".toast-verify_signercontent_founds_errors").remove();
        Materialize.toast(localize("Sign.verify_signercontent_founds_errors", window.locale), 2000, "toast-verify_signercontent_founds_errors");
      }

      if (TSP_OCSP_ENABLED && signer.isCades) {
        curRes.status_verify = signerStatus;
      } else {
        curRes.status_verify = certificatesSignStatus && signerStatus;
      }

      result.push(curRes);
    }

    return result;
  } catch (e) {
    $(".toast-verify_signers_failed").remove();
    Materialize.toast(localize("Sign.verify_signers_failed", window.locale), 2000, "toast-verify_signers_failed");

    return undefined;
  }
}

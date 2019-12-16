import * as os from "os";
import * as path from "path";
import {
  ADDRESS_BOOK, CA, MY,
  PROVIDER_CRYPTOPRO, PROVIDER_SYSTEM,
  REQUEST, ROOT,
} from "../constants";
import { DEFAULT_CERTSTORE_PATH, TMP_DIR, USER_NAME } from "../constants";
import logger from "../winstonLogger";

const OS_TYPE = os.type();

export class Store {
  // tslint:disable:variable-name
  _items: any[];
  _providerCryptopro: trusted.pkistore.ProviderCryptopro | undefined;
  _store: trusted.pkistore.PkiStore;

  constructor() {
    this._store = new trusted.pkistore.PkiStore(DEFAULT_CERTSTORE_PATH + "/cash.json");

    try {
      this._providerCryptopro = new trusted.pkistore.ProviderCryptopro();
      this._store.addProvider(this._providerCryptopro.handle);
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.log(`Error init CryptoPro \n ${e}`);
    }

    this._items = [];

    this._items = this._items.concat(this._store.find({
      provider: ["CRYPTOPRO"],
      type: ["CERTIFICATE", "CRL"],
    }));
  }

  get items(): trusted.pkistore.PkiItem[] {
    return this._items;
  }

  get trustedCerts(): trusted.pki.CertificateCollection {
    const RESULT: trusted.pki.CertificateCollection = new trusted.pki.CertificateCollection();
    const ITEMS = this._store.find({
      category: ["ROOT", "CA"],
      type: ["CERTIFICATE"],
    });

    for (const item of ITEMS) {
      RESULT.push(this.getPkiObject(item));
    }

    return RESULT;
  }

  // tslint:disable-next-line:adjacent-overload-signatures
  set items(pkiItems: trusted.pkistore.PkiItem[]) {
    this._items = pkiItems;
  }

  find(filter: JSON) {
    return this._store.find(filter);
  }

  importCertificate(certificate: trusted.pki.Certificate, providerType: string = PROVIDER_SYSTEM, done = (err?: Error) => { return; }, category?: string, contName?: string): void {
    let provider;

    switch (providerType) {
      case PROVIDER_CRYPTOPRO:
        provider = this._providerCryptopro;
        break;
      default:
        Materialize.toast("Unsupported provider name", 2000, "toast-unsupported_provider_name");
    }

    if (!provider) {
      Materialize.toast(`Provider ${providerType} not init`, 2000, "toast-not_init_provider");
    }

    this.handleImportCertificate(certificate, this._store, provider, function (err: Error) {
      if (err) {
        done(err);
      } else {
        done();
      }
    }, category, contName);
  }

  handleImportCertificate(certificate: trusted.pki.Certificate | Buffer, store: trusted.pkistore.PkiStore, provider: any, callback: any, category?: string, contName?: string) {
    const cert = certificate instanceof trusted.pki.Certificate ? certificate : trusted.pki.Certificate.import(certificate);

    const bCA = cert.isCA;
    const selfSigned = cert.isSelfSigned;
    const hasKey = provider.hasPrivateKey(cert);

    try {
      if (category) {
        store.addCert(provider.handle, category, cert, contName, 75);
      } else {
        if (hasKey) {
          store.addCert(provider.handle, MY, cert, contName, 75);
        } else if (!hasKey && !bCA) {
          store.addCert(provider.handle, ADDRESS_BOOK, cert, contName, 75);
        } else if (bCA) {
          if (OS_TYPE === "Windows_NT") {
            selfSigned ? store.addCert(provider.handle, ROOT, cert, contName, 75) : store.addCert(provider.handle, CA, cert, contName, 75);
          }
        }
      }
    } catch (e) {
      return callback(e);
    }

    return callback();
  }

  importCrl(crl: trusted.pki.CRL, providerType: string = PROVIDER_SYSTEM, done = (err?: Error) => { return; }): void {
    let provider;

    switch (providerType) {
      case PROVIDER_CRYPTOPRO:
        provider = this._providerCryptopro;
        break;
      default:
        Materialize.toast("Unsupported provider name", 2000, "toast-unsupported_provider_name");
    }

    if (!provider) {
      Materialize.toast(`Provider ${providerType} not init`, 2000, "toast-not_init_provider");
    }

    this.handleImportCrl(crl, this._store, provider, function (err: Error) {
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  }

  handleImportCrl(crl: trusted.pki.CRL, store: trusted.pkistore.PkiStore, provider: any, callback: any) {
    if (OS_TYPE === "Windows_NT") {
      store.addCrl(provider.handle, CA, crl);
    }

    return callback();
  }

  deleteCertificate(certificate: trusted.pkistore.PkiItem): boolean {
    let provider;

    switch (certificate.provider) {
      case "CRYPTOPRO":
        provider = this._providerCryptopro;
        break;
      default:
        Materialize.toast("Unsupported provider name", 2000, "toast-unsupported_provider_name");
    }

    if (!provider) {
      Materialize.toast(`Provider ${certificate.provider} not init`, 2000, "toast-not_init_provider");
      return false;
    }

    const certX509 = this.getPkiObject(certificate);

    try {
      this._store.deleteCert(provider.handle, certificate.category, certX509);

      logger.log({
        certificate: certificate.subjectName,
        level: "info",
        message: "",
        operation: "Удаление сертификата",
        operationObject: {
          in: "CN=" + certificate.subjectFriendlyName,
          out: "Null",
        },
        userName: USER_NAME,
      });
    } catch (err) {
      logger.log({
        certificate: certificate.subjectName,
        level: "error",
        message: err.message ? err.message : err,
        operation: "Удаление сертификата",
        operationObject: {
          in: "CN=" + certificate.subjectFriendlyName,
          out: "Null",
        },
        userName: USER_NAME,
      });

      return false;
    }

    return true;
  }

  deleteCrl(crl: trusted.pkistore.PkiItem): boolean {
    let provider;

    switch (crl.provider) {
      case "CRYPTOPRO":
        provider = this._providerCryptopro;
        break;
      default:
        Materialize.toast("Unsupported provider name", 2000, "toast-unsupported_provider_name");
    }

    if (!provider) {
      Materialize.toast(`Provider ${crl.provider} not init`, 2000, "toast-not_init_provider");
      return false;
    }

    const crlX509 = this.getPkiObject(crl);

    try {
      this._store.deleteCrl(provider.handle, crl.category, crlX509);

      logger.log({
        certificate: crl.subjectName,
        level: "info",
        message: "",
        operation: "Удаление сертификата",
        operationObject: {
          in: "CN=" + crl.subjectFriendlyName,
          out: "Null",
        },
        userName: USER_NAME,
      });
    } catch (err) {
      logger.log({
        certificate: crl.subjectName,
        level: "error",
        message: err.message ? err.message : err,
        operation: "Удаление сертификата",
        operationObject: {
          in: "CN=" + crl.subjectFriendlyName,
          out: "Null",
        },
        userName: USER_NAME,
      });

      return false;
    }

    return true;
  }

  addCrlToStore(provider: any, category: any, crl: any, flag: any): void {
    let uri: string;
    let newItem: any;

    uri = this._store.addCrl(provider.handle, category, crl);

    newItem = provider.objectToPkiItem(uri);

    this._items.push(newItem);
  }

  /**
   * Return pki objects for PkiItem
   * @param  {native.PKISTORE.PkiItem} item
   * @return {PkiObject} Certificate | Key | CRL | CSR
   */
  getPkiObject(item: any): any {
    let tcert: trusted.pki.Certificate | undefined;

    if (item.x509 && item.dssUserID) {
      try {
        tcert = new trusted.pki.Certificate();
        tcert.import(Buffer.from(item.x509), trusted.DataFormat.PEM);

        return tcert;
      } catch (e) {
        //
      }
    }

    return this._store.getItem(item);
  }
}

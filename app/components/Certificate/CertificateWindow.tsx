import store from "../../store";
import { execFile } from "child_process";
import fs from "fs";
import * as os from "os";
import * as path_module from "path";
import PropTypes from "prop-types";
import React from "react";
import Media from "react-media";
import { connect } from "react-redux";
import { loadAllCertificates, loadAllContainers, removeAllCertificates, removeAllContainers } from "../../AC";
import { deleteRequestCA } from "../../AC/caActions";
import { resetCloudCSP } from "../../AC/cloudCspActions";
import { changeSearchValue } from "../../AC/searchActions";
import { urlCmdCertImportFail, urlCmdCertImportSuccess } from "../../AC/urlCmdCertificates";
import { certInfoFail, sendCertificateInfo } from "../../AC/urlCmdCertInfo";
import {
  ADDRESS_BOOK, CA, CERTIFICATE, CRL,
  DEFAULT_CSR_PATH, FAIL, MODAL_ADD_CERTIFICATE, MODAL_ADD_SERVICE_CA,
  MODAL_BEST_STORE, MODAL_CERTIFICATE_IMPORT_DSS, MODAL_CERTIFICATE_REQUEST, MODAL_CERTIFICATE_REQUEST_CA,
  MODAL_CLOUD_CSP, MODAL_DELETE_CERTIFICATE, MODAL_DELETE_CRL, MODAL_DELETE_REQUEST_CA,
  MODAL_EXPORT_CERTIFICATE, MODAL_EXPORT_REQUEST_CA, MY, PFX, PROVIDER_CRYPTOPRO, REQUEST,
  ROOT, URL_CMD_CERTIFICATES_IMPORT, USER_NAME, RESET_DSS_CERTIFICATES_VERIFIED,
} from "../../constants";
import { filteredCertificatesSelector } from "../../selectors";
import { filteredCrlsSelector } from "../../selectors/crlsSelectors";
import { filteredRequestCASelector } from "../../selectors/requestCASelector";
import { fileCoding, fileExists } from "../../utils";
import logger from "../../winstonLogger";
import BlockNotElements from "../BlockNotElements";
import CloudCSP from "../CloudCSP/CloudCSP";
import CRLDelete from "../CRL/CRLDelete";
import CRLInfo from "../CRL/CRLInfo";
import Dialog from "../Dialog";
import DSSConnection from "../DSS/DSSConnection";
import Modal from "../Modal";
import PasswordDialog from "../PasswordDialog";
import ProgressBars from "../ProgressBars";
import CertificateRequest from "../Request/CertificateRequest";
import CertificateRequestCA from "../Request/CertificateRequestCA";
import RequestCADelete from "../Request/RequestCADelete";
import RequestCAExport from "../Request/RequestCAExport";
import RequestCAInfo from "../Request/RequestCAInfo";
import AddService from "../Services/AddService";
import AddCertificate from "./AddCertificate";
import BestStore from "./BestStore";
import CertificateChainInfo from "./CertificateChainInfo";
import CertificateDelete from "./CertificateDelete";
import CertificateExport from "./CertificateExport";
import CertificateInfo from "./CertificateInfo";
import CertificateInfoTabs from "./CertificateInfoTabs";
import CertificateList from "./CertificateList";

const OS_TYPE = os.type();
const dialog = window.electron.remote.dialog;

class CertWindow extends React.Component<any, any> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);

    this.state = ({
      activeCertInfoTab: true,
      certificate: null,
      crl: null,
      importingCertificate: null,
      importingCertificatePath: null,
      password: "",
      requestCA: null,
      showDialogInstallRootCertificate: false,
      showModalAddCertificate: false,
      showModalAddService: false,
      showModalBestStore: false,
      showModalCertificateImportDSS: false,
      showModalCertificateRequest: false,
      showModalCertificateRequestCA: false,
      showModalCloudCSP: false,
      showModalDeleteCRL: false,
      showModalDeleteCertifiacte: false,
      showModalDeleteRequestCA: false,
      showModalExportCertifiacte: false,
      showModalExportRequestCA: false,
    });
  }

  componentDidMount() {
    const { isCertInfoMode, urlCmdProps, urlCmdCertInfo } = this.props;
    $(".btn-floated").dropdown();
    if (urlCmdProps && !urlCmdProps.done) {
      if (urlCmdProps.operation === URL_CMD_CERTIFICATES_IMPORT) {
        this.setState({ showModalBestStore: true });
      }
    }

    if (isCertInfoMode && urlCmdCertInfo.certToProcessPkiItemInfo) {
      this.handleActiveCert(urlCmdCertInfo.certToProcessPkiItemInfo);
    }
  }

  handleShowModalByType = (typeOfModal: string) => {
    switch (typeOfModal) {
      case MODAL_ADD_CERTIFICATE:
        this.setState({ showModalAddCertificate: true });
        break;
      case MODAL_ADD_SERVICE_CA:
        this.setState({ showModalAddService: true });
        break;
      case MODAL_DELETE_CERTIFICATE:
        this.setState({ showModalDeleteCertifiacte: true });
        break;
      case MODAL_EXPORT_CERTIFICATE:
        this.setState({ showModalExportCertifiacte: true });
        break;
      case MODAL_DELETE_CRL:
        this.setState({ showModalDeleteCRL: true });
        break;
      case MODAL_EXPORT_REQUEST_CA:
        this.setState({ showModalExportRequestCA: true });
        break;
      case MODAL_DELETE_REQUEST_CA:
        this.setState({ showModalDeleteRequestCA: true });
        break;
      case MODAL_CERTIFICATE_IMPORT_DSS:
        this.setState({ showModalCertificateImportDSS: true });
        break;
      case MODAL_CERTIFICATE_REQUEST:
        this.setState({ showModalCertificateRequest: true });
        break;
      case MODAL_CERTIFICATE_REQUEST_CA:
        this.setState({ showModalCertificateRequestCA: true });
        break;
      case MODAL_CLOUD_CSP:
        this.setState({ showModalCloudCSP: true });
        break;
      case MODAL_BEST_STORE:
        this.setState({ showModalBestStore: true });
        break;
      default:
        return;
    }
  }

  handleCloseModalByType = (typeOfModal: string): void => {
    switch (typeOfModal) {
      case MODAL_ADD_CERTIFICATE:
        this.setState({ showModalAddCertificate: false });
        break;
      case MODAL_ADD_SERVICE_CA:
        this.setState({ showModalAddService: false });
        break;
      case MODAL_DELETE_CERTIFICATE:
        this.setState({ showModalDeleteCertifiacte: false });
        break;
      case MODAL_EXPORT_CERTIFICATE:
        this.setState({ showModalExportCertifiacte: false });
        break;
      case MODAL_DELETE_CRL:
        this.setState({ showModalDeleteCRL: false });
        break;
      case MODAL_CERTIFICATE_IMPORT_DSS:
        this.setState({ showModalCertificateImportDSS: false });
        break;
      case MODAL_CERTIFICATE_REQUEST:
        this.setState({ showModalCertificateRequest: false });
        break;
      case MODAL_EXPORT_REQUEST_CA:
        this.setState({ showModalExportRequestCA: false });
        break;
      case MODAL_DELETE_REQUEST_CA:
        this.setState({ showModalDeleteRequestCA: false });
        break;
      case MODAL_CERTIFICATE_REQUEST_CA:
        this.setState({ showModalCertificateRequestCA: false });
        break;
      case MODAL_CLOUD_CSP:
        this.setState({ showModalCloudCSP: false });
        break;
      case MODAL_BEST_STORE:
        this.setState({ showModalBestStore: false });
        break;
      default:
        return;
    }
  }

  handleCloseModals = () => {
    this.setState({
      showModalCertificateImportDSS: false,
      showModalCertificateRequest: false,
      showModalCertificateRequestCA: false,
      showModalCloudCSP: false,
      showModalDeleteCRL: false,
      showModalDeleteCertifiacte: false,
      showModalExportCertifiacte: false,
      showModalBestStore: false,
      showModalAddService: false,
    });
  }

  handleCloseDialogInstallRootCertificate = () => {
    this.setState({ showDialogInstallRootCertificate: false });
  }

  handleShowDialogInstallRootCertificate = (path: string, certificate: trusted.pki.Certificate) => {
    this.setState({
      importingCertificate: certificate,
      importingCertificatePath: path,
      showDialogInstallRootCertificate: true,
    });
  }

  handlePasswordChange = (password: string) => {
    this.setState({ password });
  }

  handleChangeActiveTab = (certInfoTab: boolean) => {
    this.setState({
      activeCertInfoTab: certInfoTab,
    });
  }

  handleActiveCert = (certificate: any) => {
    this.setState({ certificate, crl: null, requestCA: null });
  }

  handleActiveCRL = (crl: any) => {
    this.setState({ certificate: null, requestCA: null, crl });
  }

  handleActiveRequestCA = (requestCA: any) => {
    this.setState({ certificate: null, crl: null, requestCA });
  }

  handleReloadCertificates = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { isLoading, loadAllCertificates, removeAllCertificates } = this.props;

    this.setState({ certificate: null, crl: null, requestCA: null });

    removeAllCertificates();

    if (!isLoading) {
      loadAllCertificates();
    }

    this.handleCloseModals();
  }

  handleReloadContainers = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { isLoading, loadAllContainers, removeAllContainers } = this.props;

    this.setState({
      container: null,
      deleteContainer: false,
    });

    removeAllContainers();

    if (!isLoading) {
      loadAllContainers();
    }

    this.handleCloseModals();
  }

  getFileType = (filePath: string) => {
    let pkiItem;
    const format: trusted.DataFormat = fileCoding(filePath);

    try {
      pkiItem = trusted.pki.Certificate.load(filePath, format);
      return CERTIFICATE;
    } catch (e) {
      try {
        pkiItem = trusted.pki.CRL.load(filePath, format);
        return CRL;
      } catch (e) {
        try {
          pkiItem = trusted.pki.PKCS12.load(filePath);
          return PFX;
        } catch (e) {
          //
        }
      }

      return;
    }
  }

  handleImportPkiItem = (path: string) => {
    const { localize, locale } = this.context;

    this.setState({ pathOfImportedPkiItem: path });

    const itemType = this.getFileType(path);

    switch (itemType) {
      case CERTIFICATE:
        this.handleCertificateImport(path);
        return;

      case CRL:
        const format: trusted.DataFormat = fileCoding(path);
        const crl = trusted.pki.CRL.load(path, format);
        this.crlImport(crl, path);
        return;

      case PFX:
        this.p12Import(path);
        return;
      default:
        $(".toast-cert_import_failed").remove();
        Materialize.toast(localize("Certificate.cert_import_failed", locale), 2000, "toast-cert_import_failed");
    }
  }

  handleCertificateImport = (path: string, auto: boolean = false) => {
    const { localize, locale } = this.context;
    // tslint:disable-next-line:no-shadowed-variable
    const { isLoading, loadAllCertificates, location, removeAllCertificates } = this.props;
    const format: trusted.DataFormat = fileCoding(path);
    let container = "";

    let certificate: trusted.pki.Certificate;
    let providerType: string;

    try {
      certificate = trusted.pki.Certificate.load(path, format);
    } catch (e) {
      return;
    }

    const bCA = certificate.isCA;
    const selfSigned = certificate.isSelfSigned;

    providerType = PROVIDER_CRYPTOPRO;

    try {
      container = trusted.utils.Csp.getContainerNameByCertificate(certificate);
    } catch (e) {
      //
    }

    let bestStore;

    if (container) {
      bestStore = MY;
    } else if (!bCA) {
      bestStore = ADDRESS_BOOK;
    } else {
      bestStore = selfSigned ? ROOT : CA;
    }

    this.setState({ bestStore });

    if (bestStore === location.state.store || auto) {
      if (container) {
        try {
          trusted.utils.Csp.installCertificateToContainer(certificate, container, 75);
          trusted.utils.Csp.installCertificateFromContainer(container, 75, "Crypto-Pro GOST R 34.10-2001 Cryptographic Service Provider");

          Materialize.toast(localize("Certificate.cert_import_ok", locale), 2000, "toast-cert_imported");

          logger.log({
            certificate: certificate.subjectName,
            level: "info",
            message: "",
            operation: "Импорт сертификата",
            operationObject: {
              in: "CN=" + certificate.subjectFriendlyName,
              out: "Null",
            },
            userName: USER_NAME,
          });
        } catch (err) {
          Materialize.toast(localize("Certificate.cert_import_failed", locale), 2000, "toast-cert_import_error");

          logger.log({
            certificate: certificate.subjectName,
            level: "error",
            message: err.message ? err.message : err,
            operation: "Импорт сертификата",
            operationObject: {
              in: "CN=" + certificate.subjectFriendlyName,
              out: "Null",
            },
            userName: USER_NAME,
          });

          return;
        }
      } else if (!bCA) {
        window.PKISTORE.importCertificate(certificate, providerType, (err: Error) => {
          if (err) {
            Materialize.toast(localize("Certificate.cert_import_failed", locale), 2000, "toast-cert_import_error");
          }
        }, ADDRESS_BOOK);

        Materialize.toast(localize("Certificate.cert_import_ok", locale), 2000, "toast-cert_imported");

        logger.log({
          certificate: certificate.subjectName,
          level: "info",
          message: "",
          operation: "Импорт сертификата",
          operationObject: {
            in: "CN=" + certificate.subjectFriendlyName,
            out: "Null",
          },
          userName: USER_NAME,
        });
      }

      if (selfSigned || bCA) {
        this.handleShowDialogInstallRootCertificate(path, certificate);
      } else {
        removeAllCertificates();

        if (!isLoading) {
          loadAllCertificates();
        }
      }
    } else {
      this.handleShowModalByType(MODAL_BEST_STORE);
    }
  }

  handleAddCertToStore = (store: string, path: string) => {
    const { localize, locale } = this.context;
    const { removeAllCertificates, isLoading, loadAllCertificates, urlCmdProps } = this.props;

    const isImportFromCommand = urlCmdProps && !urlCmdProps.done
      && (urlCmdProps.operation === URL_CMD_CERTIFICATES_IMPORT);

    const format: trusted.DataFormat = fileCoding(path);

    let certificate: trusted.pki.Certificate;

    try {
      certificate = trusted.pki.Certificate.load(path, format);
    } catch (e) {
      try {
        const certToImport = fs.readFileSync(path);
        certificate = trusted.pki.Certificate.import(Buffer.from(certToImport), format);
      } catch (e2) {
        if (isImportFromCommand) {
          urlCmdCertImportFail();
        }
        return;
      }
    }

    if (store === MY) {
      let container = "";

      try {
        container = trusted.utils.Csp.getContainerNameByCertificate(certificate);
      } catch (e) {
        //
      }

      if (container) {
        try {
          trusted.utils.Csp.installCertificateToContainer(certificate, container, 75);
          trusted.utils.Csp.installCertificateFromContainer(container, 75, "Crypto-Pro GOST R 34.10-2001 Cryptographic Service Provider");

          Materialize.toast(localize("Certificate.cert_import_ok", locale), 2000, "toast-cert_imported");

          logger.log({
            certificate: certificate.subjectName,
            level: "info",
            message: "",
            operation: "Импорт сертификата",
            operationObject: {
              in: "CN=" + certificate.subjectFriendlyName,
              out: "Null",
            },
            userName: USER_NAME,
          });

          if (isImportFromCommand) {
            urlCmdCertImportSuccess();
          }

          removeAllCertificates();

          if (!isLoading) {
            loadAllCertificates();
          }
        } catch (err) {
          Materialize.toast(localize("Certificate.cert_import_failed", locale), 2000, "toast-cert_import_error");

          logger.log({
            certificate: certificate.subjectName,
            level: "error",
            message: err.message ? err.message : err,
            operation: "Импорт сертификата",
            operationObject: {
              in: "CN=" + certificate.subjectFriendlyName,
              out: "Null",
            },
            userName: USER_NAME,
          });

          if (isImportFromCommand) {
            urlCmdCertImportFail();
          }

          return;
        }
      } else {
        window.PKISTORE.importCertificate(certificate, PROVIDER_CRYPTOPRO, (err: Error) => {
          if (err) {
            Materialize.toast(localize("Certificate.cert_import_failed", locale), 2000, "toast-cert_import_error");
          }
        }, store);

        Materialize.toast(localize("Certificate.cert_import_ok", locale), 2000, "toast-cert_imported");

        logger.log({
          certificate: certificate.subjectName,
          level: "info",
          message: "",
          operation: "Импорт сертификата",
          operationObject: {
            in: "CN=" + certificate.subjectFriendlyName,
            out: "Null",
          },
          userName: USER_NAME,
        });

        if (isImportFromCommand) {
          urlCmdCertImportSuccess();
        }

        removeAllCertificates();

        if (!isLoading) {
          loadAllCertificates();
        }
      }
    } else if (store === ADDRESS_BOOK) {
      window.PKISTORE.importCertificate(certificate, PROVIDER_CRYPTOPRO, (err: Error) => {
        if (err) {
          Materialize.toast(localize("Certificate.cert_import_failed", locale), 2000, "toast-cert_import_error");
        }
      }, store);

      Materialize.toast(localize("Certificate.cert_import_ok", locale), 2000, "toast-cert_imported");

      logger.log({
        certificate: certificate.subjectName,
        level: "info",
        message: "",
        operation: "Импорт сертификата",
        operationObject: {
          in: "CN=" + certificate.subjectFriendlyName,
          out: "Null",
        },
        userName: USER_NAME,
      });

      if (isImportFromCommand) {
        urlCmdCertImportSuccess();
      }

      removeAllCertificates();

      if (!isLoading) {
        loadAllCertificates();
      }
    } else {
      this.handleShowDialogInstallRootCertificate(path, certificate);
    }
  }

  handleInstallTrustedCertificate = () => {
    const { localize, locale } = this.context;
    // tslint:disable-next-line:no-shadowed-variable
    const { isLoading, loadAllCertificates, removeAllCertificates, urlCmdProps } = this.props;
    const { importingCertificate, importingCertificatePath } = this.state;

    const isImportFromCommand = urlCmdProps && !urlCmdProps.done
      && (urlCmdProps.operation === URL_CMD_CERTIFICATES_IMPORT);

    this.handleCloseDialogInstallRootCertificate();

    const isSelfSigned = importingCertificate.isSelfSigned;

    if (OS_TYPE === "Windows_NT") {
      const storeName = isSelfSigned ? ROOT : CA;

      window.PKISTORE.importCertificate(importingCertificate, PROVIDER_CRYPTOPRO, (err: Error) => {
        if (err) {

          logger.log({
            certificate: importingCertificate.subjectName,
            level: "error",
            message: err.message ? err.message : "",
            operation: "Импорт сертификата",
            operationObject: {
              in: "CN=" + importingCertificate.subjectFriendlyName,
              out: "Null",
            },
            userName: USER_NAME,
          });

          if (isImportFromCommand) {
            urlCmdCertImportFail();
          }

          Materialize.toast(localize("Certificate.cert_import_failed", locale), 2000, "toast-cert_import_error");
        } else {
          removeAllCertificates();
          this.resetCertVerified();
          if (!isLoading) {
            loadAllCertificates();
          }

          logger.log({
            certificate: importingCertificate.subjectName,
            level: "info",
            message: "",
            operation: "Импорт сертификата",
            operationObject: {
              in: "CN=" + importingCertificate.subjectFriendlyName,
              out: "Null",
            },
            userName: USER_NAME,
          });

          if (isImportFromCommand) {
            urlCmdCertImportSuccess();
          }

          Materialize.toast(localize("Certificate.cert_trusted_import_ok", locale), 2000, "toast-cert_trusted_import_ok");
        }
      }, storeName);
    } else if (importingCertificatePath) {
      let certmgrPath = "";

      if (OS_TYPE === "Darwin") {
        certmgrPath = "/opt/cprocsp/bin/certmgr";
      } else {
        certmgrPath = os.arch() === "ia32" ? "/opt/cprocsp/bin/ia32/certmgr" : "/opt/cprocsp/bin/amd64/certmgr";
      }

      const storeName = isSelfSigned ? "mROOT" : "mCA";

      // tslint:disable-next-line:quotemark
      const cmd = "sh -c " + "\"" + certmgrPath + ' -install -store ' + "'" + storeName + "'" + ' -file ' + "'" + importingCertificatePath + "'" + "\"";

      const options = {
        name: "CryptoARM GOST",
      };

      window.sudo.exec(cmd, options, function (err: Error) {
        if (err) {

          logger.log({
            certificate: importingCertificate.subjectName,
            level: "error",
            message: err.message ? err.message : "",
            operation: "Импорт сертификата",
            operationObject: {
              in: "CN=" + importingCertificate.subjectFriendlyName,
              out: "Null",
            },
            userName: USER_NAME,
          });

          Materialize.toast(localize("Certificate.cert_trusted_import_failed", locale), 2000, "toast-cert_trusted_import_failed");
        } else {
          removeAllCertificates();

          if (!isLoading) {
            loadAllCertificates();
          }

          logger.log({
            certificate: importingCertificate.subjectName,
            level: "info",
            message: "",
            operation: "Импорт сертификата",
            operationObject: {
              in: "CN=" + importingCertificate.subjectFriendlyName,
              out: "Null",
            },
            userName: USER_NAME,
          });

          Materialize.toast(localize("Certificate.cert_trusted_import_ok", locale), 2000, "toast-cert_trusted_import_ok");
        }
      });
    }
  }

  resetCertVerified = () => {
    const { certificatesMap } = this.props

    const dssCert = certificatesMap.filter((i: any) => i.dssUserID !== null)
    dssCert.map((k: any) => {
      store.dispatch({
        payload: k.id,
        type: RESET_DSS_CERTIFICATES_VERIFIED,
      })
    })
  }

  crlImport = (crl: trusted.pki.CRL, crlFilePath?: string) => {
    const { localize, locale } = this.context;
    // tslint:disable-next-line:no-shadowed-variable
    const { isLoading, loadAllCertificates, removeAllCertificates } = this.props;

    if (!crl) {
      $(".toast-cert_load_failed").remove();
      Materialize.toast(localize("Certificate.cert_load_failed", locale), 2000, "toast-cert_load_failed");

      return;
    }

    if (OS_TYPE === "Windows_NT") {
      window.PKISTORE.importCrl(crl, PROVIDER_CRYPTOPRO, (err: Error) => {
        if (err) {
          logger.log({
            certificate: crl.issuerFriendlyName,
            level: "error",
            message: err.message ? err.message : "",
            operation: "Импорт CRL",
            operationObject: {
              in: "CN=" + crl.issuerFriendlyName,
              out: "Null",
            },
            userName: USER_NAME,
          });

          Materialize.toast(localize("CRL.crl_import_failed", locale), 2000, "toast-crl_import_failed");
        } else {
          removeAllCertificates();

          if (!isLoading) {
            loadAllCertificates();
          }

          logger.log({
            certificate: crl.issuerFriendlyName,
            level: "info",
            message: "",
            operation: "Импорт CRL",
            operationObject: {
              in: "CN=" + crl.issuerFriendlyName,
              out: "Null",
            },
            userName: USER_NAME,
          });

          Materialize.toast(localize("CRL.crl_import_ok", locale), 2000, "toast-crl_import_ok");
        }
      }, CA);
    } else if (crlFilePath) {
      let certmgrPath = "";

      if (OS_TYPE === "Darwin") {
        certmgrPath = "/opt/cprocsp/bin/certmgr";
      } else {
        certmgrPath = os.arch() === "ia32" ? "/opt/cprocsp/bin/ia32/certmgr" : "/opt/cprocsp/bin/amd64/certmgr";
      }

      const storeName = "mCA";

      // tslint:disable-next-line:quotemark
      const cmd = "sh -c " + "\"" + certmgrPath + ' -install -store ' + "'" + storeName + "'" + ' -crl -file ' + "'" + crlFilePath + "'" + "\"";

      const options = {
        name: "CryptoARM GOST",
      };

      window.sudo.exec(cmd, options, function (err: Error) {
        if (err) {

          logger.log({
            certificate: crl.issuerFriendlyName,
            level: "error",
            message: err.message ? err.message : "",
            operation: "Импорт CRL",
            operationObject: {
              in: "CN=" + crl.issuerFriendlyName,
              out: "Null",
            },
            userName: USER_NAME,
          });

          Materialize.toast(localize("CRL.crl_import_failed", locale), 2000, "toast-crl_import_failed");
        } else {
          removeAllCertificates();

          if (!isLoading) {
            loadAllCertificates();
          }

          logger.log({
            certificate: crl.issuerFriendlyName,
            level: "info",
            message: "",
            operation: "Импорт CRL",
            operationObject: {
              in: "CN=" + crl.issuerFriendlyName,
              out: "Null",
            },
            userName: USER_NAME,
          });

          Materialize.toast(localize("CRL.crl_import_ok", locale), 2000, "toast-crl_import_ok");
        }
      });
    }
  }

  p12Import = (fpath: string) => {
    const { localize, locale } = this.context;
    const self = this;

    const P12_PATH = fpath;
    let p12: trusted.pki.PKCS12 | undefined;

    try {
      p12 = trusted.pki.PKCS12.load(P12_PATH);
    } catch (e) {
      p12 = undefined;
    }

    if (!p12) {
      $(".toast-cert_load_failed").remove();
      Materialize.toast(localize("Certificate.cert_load_failed", locale), 2000, "toast-cert_load_failed");

      return;
    }

    $("#get-password").openModal({
      complete() {
        try {
          if (p12) {
            trusted.utils.Csp.importPkcs12(p12, self.state.password);
          }

          self.handlePasswordChange("");

          self.props.removeAllCertificates();

          if (!self.props.isLoading) {
            self.props.loadAllCertificates();
          }

          $(".toast-cert_import_ok").remove();
          Materialize.toast(localize("Certificate.cert_import_ok", locale), 2000, ".toast-cert_import_ok");

          logger.log({
            certificate: "",
            level: "info",
            message: "",
            operation: "Импорт PKCS12",
            operationObject: {
              in: path_module.basename(P12_PATH),
              out: "Null",
            },
            userName: USER_NAME,
          });
        } catch (err) {
          self.handlePasswordChange("");

          $(".toast-cert_import_failed").remove();
          Materialize.toast(localize("Certificate.cert_import_failed", locale), 2000, "toast-cert_import_failed");

          logger.log({
            certificate: "",
            level: "error",
            message: err.message ? err.message : err,
            operation: "Импорт PKCS12",
            operationObject: {
              in: path_module.basename(P12_PATH),
              out: "Null",
            },
            userName: USER_NAME,
          });
        }
      },
      dismissible: false,
    });
  }

  getCertificateOrCRLInfo() {
    const { certificate, crl, requestCA } = this.state;
    const { localize, locale } = this.context;

    if (certificate) {
      return this.getCertificateInfoBody();
    } else if (crl) {
      return this.getCRLInfoBody();
    } else if (requestCA) {
      return this.getRequestCAInfoBody();
    } else {
      return <BlockNotElements name={"active"} title={localize("Certificate.cert_not_select", locale)} />;
    }
  }

  getCertificateInfoBody() {
    const { activeCertInfoTab, certificate } = this.state;
    const { localize, locale } = this.context;

    let cert: any = null;

    if (certificate && activeCertInfoTab) {
      cert = <CertificateInfo certificate={certificate} />;
    } else if (certificate) {
      cert = (
        <React.Fragment>
          <a className="collection-info chain-info-blue">{localize("Certificate.cert_chain_status", locale)}</a>
          <div className="collection-info chain-status">{certificate.status ? localize("Certificate.cert_chain_status_true", locale) : localize("Certificate.cert_chain_status_false", locale)}</div>
          <a className="collection-info chain-info-blue">{localize("Certificate.cert_chain_info", locale)}</a>
          <CertificateChainInfo certificate={certificate} key={"chain_" + certificate.id} style="" onClick={() => { return; }} />
        </React.Fragment>
      );
    }

    return (
      <div>
        <Media query="(max-height: 870px)">
          {(matches) =>
            matches ? (
              <React.Fragment>
                <CertificateInfoTabs activeCertInfoTab={this.handleChangeActiveTab} />
                <div style={{ height: "calc(100vh - 150px)" }}>
                  <div className="add-certs">
                    {cert}
                  </div>
                </div>
              </ React.Fragment>
            ) :
              <React.Fragment>
                <div className="col s12">
                  <div className="primary-text">Сведения о сертификате:</div>
                  <hr />
                </div>
                <div className="col s12" style={{ padding: 0 }}>
                  <div style={{ height: "calc(100vh - 150px)" }}>
                    <div className="add-certs">
                      <CertificateInfo certificate={certificate} />
                      <a className="collection-info chain-info-blue">{localize("Certificate.cert_chain_info", locale)}</a>
                      <CertificateChainInfo certificate={certificate} key={"chain_" + certificate.id} style="" onClick={() => { return; }} />
                    </div>
                  </div>
                </div>
              </React.Fragment>
          }
        </Media>
      </div>
    );
  }

  getCRLInfoBody() {
    const { crl } = this.state;

    return (
      <div className="add-certs">
        <CRLInfo crl={crl} />
      </div>
    );
  }

  getRequestCAInfoBody() {
    const { requestCA } = this.state;

    return (
      <div className="add-certs">
        <RequestCAInfo requestCA={requestCA} handleReloadCertificates={this.handleReloadCertificates} />
      </div>
    );
  }

  getTitle() {
    const { certificate, crl } = this.state;
    const { localize, locale } = this.context;

    let title: any = null;

    if (certificate) {
      title = <div className="cert-title-main">
        <div className="collection-title cert-title">{certificate.subjectFriendlyName}</div>
        <div className="collection-info cert-title">{certificate.issuerFriendlyName}</div>
      </div>;
    } else if (crl) {
      title = (
        <div className="cert-title-main">
          <div className="collection-title cert-title">{crl.issuerFriendlyName}</div>
        </div>);
    } else {
      title = <span>{localize("Certificate.cert_info", locale)}</span>;
    }

    return title;
  }

  showModalAddCertificate = () => {
    const { localize, locale } = this.context;
    const { location } = this.props;
    const { showModalAddCertificate } = this.state;

    if (!showModalAddCertificate) {
      return;
    }

    return (
      <Modal
        isOpen={showModalAddCertificate}
        header={localize("Certificate.cert_import", locale)}
        onClose={() => this.handleCloseModalByType(MODAL_ADD_CERTIFICATE)}
        style={{ width: "350px" }}>

        <AddCertificate
          certImport={this.certImport}
          crlDialog={this.crlDialog}
          handleShowModalByType={this.handleShowModalByType}
          location={location}
          onCancel={() => this.handleCloseModalByType(MODAL_ADD_CERTIFICATE)} />
      </Modal>
    );
  }

  showModalDeleteCertificate = () => {
    const { localize, locale } = this.context;
    const { certificate, showModalDeleteCertifiacte } = this.state;

    if (!certificate || !showModalDeleteCertifiacte) {
      return;
    }

    return (
      <Modal
        isOpen={showModalDeleteCertifiacte}
        header={localize("Certificate.delete_certificate", locale)}
        onClose={() => this.handleCloseModalByType(MODAL_DELETE_CERTIFICATE)}
        style={{ width: "600px" }}>

        <CertificateDelete
          certificate={certificate}
          onCancel={() => this.handleCloseModalByType(MODAL_DELETE_CERTIFICATE)}
          reloadCertificates={this.handleReloadCertificates}
          reloadContainers={this.handleReloadContainers}
          resetCertVerified={this.resetCertVerified}/>
      </Modal>
    );
  }

  showModalExportCertificate = () => {
    const { localize, locale } = this.context;
    const { certificate, showModalExportCertifiacte } = this.state;

    if (!certificate || !showModalExportCertifiacte) {
      return;
    }

    return (
      <Modal
        isOpen={showModalExportCertifiacte}
        header={localize("Export.export_certificate", locale)}
        onClose={() => this.handleCloseModalByType(MODAL_EXPORT_CERTIFICATE)}
        style={{ width: "600px" }}>

        <CertificateExport
          certificate={certificate}
          onSuccess={() => this.handleCloseModalByType(MODAL_EXPORT_CERTIFICATE)}
          onCancel={() => this.handleCloseModalByType(MODAL_EXPORT_CERTIFICATE)}
          onFail={() => this.handleCloseModalByType(MODAL_EXPORT_CERTIFICATE)} />
      </Modal>
    );
  }

  showModalDeleteCrl = () => {
    const { localize, locale } = this.context;
    const { crl, showModalDeleteCRL } = this.state;

    if (!crl || !showModalDeleteCRL) {
      return;
    }

    return (
      <Modal
        isOpen={showModalDeleteCRL}
        header={localize("CRL.delete_crl", locale)}
        onClose={() => this.handleCloseModalByType(MODAL_DELETE_CRL)}
        style={{ width: "600px" }}>

        <CRLDelete
          crl={crl}
          onCancel={() => this.handleCloseModalByType(MODAL_DELETE_CRL)}
          reloadCertificates={this.handleReloadCertificates} />
      </Modal>
    );
  }

  showModalAddService = () => {
    const { localize, locale } = this.context;
    const { showModalAddService } = this.state;

    if (!showModalAddService) {
      return;
    }

    return (
      <Modal
        isOpen={showModalAddService}
        header={localize("Services.add_new_service", locale)}
        onClose={() => this.handleCloseModalByType(MODAL_ADD_SERVICE_CA)}
        style={{ width: "600px" }}>

        <AddService onCancel={() => this.handleCloseModalByType(MODAL_ADD_SERVICE_CA)} />
      </Modal>
    );
  }

  showModalExportRequestCA = () => {
    const { localize, locale } = this.context;
    const { requestCA, showModalExportRequestCA } = this.state;

    if (!requestCA || !showModalExportRequestCA) {
      return;
    }

    return (
      <Modal
        isOpen={showModalExportRequestCA}
        header={localize("Request.export_request", locale)}
        onClose={() => this.handleCloseModalByType(MODAL_EXPORT_REQUEST_CA)}
        style={{ width: "600px" }}>

        <RequestCAExport
          requestCA={requestCA}
          onSuccess={() => this.handleCloseModalByType(MODAL_EXPORT_REQUEST_CA)}
          onCancel={() => this.handleCloseModalByType(MODAL_EXPORT_REQUEST_CA)}
          onFail={() => this.handleCloseModalByType(MODAL_EXPORT_REQUEST_CA)} />
      </Modal>
    );
  }

  showModalDeleteRequestCA = () => {
    const { localize, locale } = this.context;
    const { requestCA, showModalDeleteRequestCA } = this.state;

    if (!requestCA || !showModalDeleteRequestCA) {
      return;
    }

    return (
      <Modal
        isOpen={showModalDeleteRequestCA}
        header={localize("Request.delete_request", locale)}
        onClose={() => this.handleCloseModalByType(MODAL_DELETE_REQUEST_CA)}
        style={{ width: "600px" }}>

        <RequestCADelete
          deleteRequestCA={this.handleDeleteRequestCA}
          requestCA={requestCA}
          onCancel={() => this.handleCloseModalByType(MODAL_DELETE_REQUEST_CA)} />
      </Modal>
    );
  }

  showModalCertificateRequest = () => {
    const { localize, locale } = this.context;
    const { showModalCertificateRequest } = this.props.location.state ? this.props.location.state :  this.state;
    const { certificate } = this.state;
    if (!showModalCertificateRequest) {
      return;
    }

    const certificateTemplate = certificate && certificate.category === REQUEST ? certificate : undefined;

    return (
      <Modal
        isOpen={showModalCertificateRequest}
        header={localize("CSR.create_request", locale)}
        onClose={() => this.handleCloseModalByType(MODAL_CERTIFICATE_REQUEST)}>

        <CertificateRequest
          certificateTemplate={certificateTemplate}
          onCancel={() => this.handleCloseModalByType(MODAL_CERTIFICATE_REQUEST)}
          selfSigned={false}
        />
      </Modal>
    );
  }

  showModalCertificateRequestCA = () => {
    const { localize, locale } = this.context;
    const { showModalCertificateRequestCA } = this.props.location.state ? this.props.location.state :  this.state;
    const { certificate } = this.state;

    if (!showModalCertificateRequestCA) {
      return;
    }

    const certificateTemplate = certificate && certificate.category === REQUEST ? certificate : undefined;

    return (
      <Modal
        isOpen={showModalCertificateRequestCA}
        header={localize("CSR.create_request", locale)}
        onClose={() => this.handleCloseModalByType(MODAL_CERTIFICATE_REQUEST_CA)}>

        <CertificateRequestCA
          certificateTemplate={certificateTemplate}
          handleShowModalByType={this.handleShowModalByType}
          onCancel={() => this.handleCloseModalByType(MODAL_CERTIFICATE_REQUEST_CA)}
          selfSigned={false}
        />
      </Modal>
    );
  }

  showModalBestStore = () => {
    const { localize, locale } = this.context;
    const { bestStore, pathOfImportedPkiItem, showModalBestStore } = this.state;
    const { location, urlCmdProps } = this.props;

    if (!showModalBestStore) {
      return;
    }

    const currentStore = location.state.store;
    const header = location.state.head;

    const isImportFromCommand = urlCmdProps && !urlCmdProps.done
      && (urlCmdProps.operation === URL_CMD_CERTIFICATES_IMPORT);

    return (
      <Modal
        isOpen={showModalBestStore}
        header={`Импорт в хранилище: ${header}`}
        onClose={() => this.handleCloseModalByType(MODAL_BEST_STORE)}
        style={{ width: "500px" }}>
        <BestStore
          onCancel={() => this.handleCloseModalByType(MODAL_BEST_STORE)}
          autoImport={() => this.handleCertificateImport(pathOfImportedPkiItem, true)}
          importToCurrent={() => {
            this.handleAddCertToStore(currentStore, isImportFromCommand ? urlCmdProps.certPath : pathOfImportedPkiItem);
          }}
          bestStore={bestStore}
          currentStore={currentStore}
          isImportFromUrlCmd={isImportFromCommand}
        />
      </Modal>
    );
  }

  showModalCertificateImportDSS = () => {
    const { localize, locale } = this.context;
    const { certificate, showModalCertificateImportDSS } = this.state;

    if (!showModalCertificateImportDSS) {
      return;
    }

    return (
      <Modal
        isOpen={showModalCertificateImportDSS}
        header={localize("DSS.DSS_connection", locale)}
        onClose={() => this.handleCloseModalByType(MODAL_CERTIFICATE_IMPORT_DSS)}
        style={{ width: "500px" }}>
        <DSSConnection
          onCancel={() => this.handleCloseModalByType(MODAL_CERTIFICATE_IMPORT_DSS)}
          handleReloadCertificates={this.handleReloadCertificates}
        />
      </Modal>
    );
  }

  showModalCloudCSP = () => {
    const { localize, locale } = this.context;
    const { showModalCloudCSP } = this.state;

    if (!showModalCloudCSP) {
      return;
    }

    return (
      <Modal
        isOpen={showModalCloudCSP}
        header={localize("CloudCSP.cloudCSP", locale)}
        onClose={() => this.handleCloseModalByType(MODAL_CLOUD_CSP)}>

        <CloudCSP onCancel={() => this.handleCloseModalByType(MODAL_CLOUD_CSP)} />
      </Modal>
    );
  }

  componentDidUpdate(prevProps, prevState) {
    const { cloudCSPSettings, cloudCSPState, certificates, isCertInfoMode, isLoading,
      location, urlCmdProps } = this.props;
    const { certificate, crl } = this.state;
    const { localize, locale } = this.context;

    if ((!prevState.certificate && certificate) || (!prevState.crl && crl)) {
      $(".nav-small-btn").dropdown();
    }

    if (prevProps.isLoading && !isLoading) {
      $(".btn-floated").dropdown();
    }

    if (prevProps.urlCmdProps !== urlCmdProps) {
      if (urlCmdProps && !urlCmdProps.done) {
        if (urlCmdProps.operation === URL_CMD_CERTIFICATES_IMPORT) {
          this.setState({ showModalBestStore: true });
        }
      }
    }

    if (!prevProps.isCertInfoMode && this.props.isCertInfoMode && this.props.urlCmdCertInfo.certToProcessPkiItemInfo) {
      this.handleActiveCert(this.props.urlCmdCertInfo.certToProcessPkiItemInfo);
    }

    if (prevProps.location !== location) {
      this.setState({ certificate: null, crl: null, requestCA: null });
    }

    if (prevProps.cloudCSPState !== this.props.cloudCSPState) {
      if (cloudCSPState.loaded) {
        if (cloudCSPState.error) {
          Materialize.toast(localize("CloudCSP.request_error", locale), 2000, "toast-request_error");
        }

        if (cloudCSPState.statusCode !== 200) {
          Materialize.toast(`${localize("CloudCSP.request_error", locale)} : ${cloudCSPState.statusCode}`, 2000, "toast-request_error");
        } else {
          if (cloudCSPState.certificates) {
            const countOfCertificates = cloudCSPState.certificates.length;
            let testCount = 0;

            for (const hcert of cloudCSPState.certificates) {
              if (hcert) {
                try {
                  throw new Error("TODO add function installCertificateFromCloud");
                  /*trusted.utils.Csp.installCertificateFromCloud(hcert.x509, cloudCSPSettings.authURL, cloudCSPSettings.restURL, hcert.id);

                  testCount++;

                  logger.log({
                    certificate: hcert.subjectName,
                    level: "info",
                    message: "",
                    operation: "Импорт сертификата",
                    operationObject: {
                      in: "CN=" + hcert.subjectFriendlyName + " (DSS)",
                      out: "Null",
                    },
                    userName: USER_NAME,
                  });*/
                } catch (err) {
                  logger.log({
                    certificate: hcert.subjectName,
                    level: "error",
                    message: err.message ? err.message : err,
                    operation: "Импорт сертификата",
                    operationObject: {
                      in: "CN=" + hcert.subjectFriendlyName + " (DSS)",
                      out: "Null",
                    },
                    userName: USER_NAME,
                  });
                }
              }
            }

            if (countOfCertificates && countOfCertificates === testCount) {
              Materialize.toast(localize("CloudCSP.certificates_import_success", locale), 2000, "toast-certificates_import_success");
            } else {
              Materialize.toast(localize("CloudCSP.certificates_import_fail", locale), 2000, "toast-certificates_import_fail");
            }
          } else {
            Materialize.toast(localize("CloudCSP.certificates_import_fail", locale), 2000, "toast-certificates_import_fail");
          }

          this.handleReloadCertificates();
        }

        resetCloudCSP();
      }
    }
  }

  render() {
    const { certrequests, certificates, crls, isLoading,
      isLoadingFromDSS, searchValue, isCertInfoMode, urlCmdCertInfo } = this.props;
    const { certificate, crl, requestCA } = this.state;
    const { localize, locale } = this.context;

    if (isLoading || isLoadingFromDSS) {
      return <ProgressBars />;
    }

    const VIEW = certrequests.length < 1 && certificates.size < 1 && crls.size < 1 ? "not-active" : "";

    return (
      <div className="content-noflex">
        <div className="row">
          <div className="col s8 leftcol">
            {
              isCertInfoMode ? null :
                <div className="row halfbottom">
                  <div className="row halfbottom" />
                  <div className="col" style={{ width: "calc(100% - 60px)" }}>
                    <div className="input-field input-field-csr col s12 border_element find_box">
                      <i className="material-icons prefix">search</i>
                      <input
                        id="search"
                        type="search"
                        placeholder={localize("Certificate.search_in_certificates_list", locale)}
                        value={searchValue}
                        onChange={this.handleSearchValueChange} />
                      <i className="material-icons close" onClick={() => this.props.changeSearchValue("")} style={this.state.searchValue ? { color: "#444" } : {}}>close</i>
                    </div>
                  </div>
                  <div className="col" style={{ width: "40px", marginLeft: "20px" }}>
                    <a onClick={this.handleReloadCertificates}>
                      <i className="file-setting-item waves-effect material-icons secondary-content">autorenew</i>
                    </a>
                  </div>
                </div>
            }
            <div className={"collection " + VIEW}>
              <div style={{ flex: "1 1 auto", height: "calc(100vh - 110px)" }}>

                {
                  certrequests.length < 1 && certificates.size < 1 && crls.size < 1 ?
                    <BlockNotElements name={"active"} title={localize("Certificate.cert_not_found", locale)} /> :
                    <CertificateList
                      selectedCert={isCertInfoMode && urlCmdCertInfo.certToProcessPkiItemInfo ? urlCmdCertInfo.certToProcessPkiItemInfo
                        : this.state.certificate}
                      selectedCrl={this.state.crl}
                      activeCert={this.handleActiveCert}
                      activeCrl={this.handleActiveCRL}
                      activeRequestCA={this.handleActiveRequestCA}
                      operation="certificate" />
                }
              </div>
            </div>
          </div>

          <div className="col s4 rightcol">
            <div className="row halfbottom" />
            <div className="row">
              <div style={{ height: "calc(100vh - 110px)" }}>
                {this.getCertificateOrCRLInfo()}
              </div>
            </div>
            {
              (certificate || crl) && !isCertInfoMode ?
                <div className="row fixed-bottom-rightcolumn" style={{ bottom: "20px" }}>
                  <div className="col s12">
                    <hr />
                  </div>
                  <div className="col s4 waves-effect waves-cryptoarm" style={{ paddingLeft: "0px" }} onClick={() => certificate ? this.handleShowModalByType(MODAL_EXPORT_CERTIFICATE)
                    : this.CRLExport()}>
                    <div className="col s12 svg_icon">
                      <a data-position="bottom">
                        <i className="material-icons certificate export" />
                      </a>
                    </div>
                    <div className="col s12 svg_icon_text">{localize("Certificate.cert_export", locale)}</div>
                  </div>

                  <div className="col s4 waves-effect waves-cryptoarm" onClick={() => certificate ? this.handleShowModalByType(MODAL_DELETE_CERTIFICATE) : this.handleShowModalByType(MODAL_DELETE_CRL)}>
                    <div className="col s12 svg_icon">
                      <a data-position="bottom">
                        <i className="material-icons certificate remove" />
                      </a>
                    </div>
                    <div className="col s12 svg_icon_text">{localize("Documents.docmenu_remove", locale)}</div>
                  </div>

                  {
                    OS_TYPE === "Windows_NT" && certificate && certificate.category !== REQUEST ?
                      <div style = {{right: '2px'}} className="col s4 waves-effect waves-cryptoarm" onClick={this.viewCertificate}>
                        <div className="col s12 svg_icon">
                          <a data-position="bottom">
                            <i className="material-icons certificate import" />
                          </a>
                        </div>
                        <div  className="col s12 svg_icon_text">{localize("Common.open", locale)}</div>
                      </div>
                      : null
                  }

                  {
                    certificate && certificate.category === REQUEST ?
                      <div className="col s4 waves-effect waves-cryptoarm" onClick={this.handleOpenCSRFolder}>
                        <div className="col s12 svg_icon">
                          <a data-position="bottom">
                            <i className="material-icons certificate csrfolder" />
                          </a>
                        </div>
                        <div className="col s12 svg_icon_text">{localize("CSR.go_to_csr_folder", locale)}</div>
                      </div> :
                      null
                  }
                </div>
                : null
            }

            {
              isCertInfoMode ?
                <div className="row fixed-bottom-rightcolumn">
                  <div className="col s6 offset-s1">
                    <a className="btn btn-text waves-effect waves-light" onClick={this.handleCertInfoCancel}>
                      ОТМЕНА
                  </a>
                  </div>
                  <div className="col s2">
                    <a className="btn btn-outlined waves-effect waves-light" onClick={this.handleCertInfoConfirm}>
                      {localize("Settings.Choose", locale)}
                    </a>
                  </div>
                </div>
                : null
            }

            {
              requestCA ?
                <div className="row fixed-bottom-rightcolumn" style={{ bottom: "20px" }}>
                  <div className="col s12">
                    <hr />
                  </div>
                  <div className="col s4 waves-effect waves-cryptoarm" onClick={() => this.handleShowModalByType(MODAL_EXPORT_REQUEST_CA)}>
                    <div className="col s12 svg_icon">
                      <a data-position="bottom">
                        <i className="material-icons ca export_request" />
                      </a>
                    </div>
                    <div className="col s12 svg_icon_text">{localize("Certificate.cert_export", locale)}</div>
                  </div>

                  <div className="col s4 waves-effect waves-cryptoarm" onClick={() => this.handleShowModalByType(MODAL_DELETE_REQUEST_CA)}>
                    <div className="col s12 svg_icon">
                      <a data-position="bottom">
                        <i className="material-icons certificate remove" />
                      </a>
                    </div>
                    <div className="col s12 svg_icon_text">{localize("Documents.docmenu_remove", locale)}</div>
                  </div>
                </div>
                : null
            }

          </div>
          {this.showModalAddCertificate()}
          {this.showModalAddService()}
          {this.showModalDeleteCertificate()}
          {this.showModalExportCertificate()}
          {this.showModalDeleteCrl()}
          {this.showModalExportRequestCA()}
          {this.showModalDeleteRequestCA()}
          {this.showModalCertificateImportDSS()}
          {this.showModalCertificateRequest()}
          {this.showModalCertificateRequestCA()}
          {this.showModalCloudCSP()}
          {this.showModalBestStore()}

          <Dialog isOpen={this.state.showDialogInstallRootCertificate}
            header="Внимание!" body="Для установки корневых сертификатов требуются права администратора. Продолжить?"
            onYes={this.handleInstallTrustedCertificate} onNo={this.handleCloseDialogInstallRootCertificate} />
          <PasswordDialog value={this.state.password} onChange={this.handlePasswordChange} />
        </div>

        {
          isCertInfoMode ? null :
            <div className="fixed-action-btn" style={{ bottom: "20px", right: "380px" }} onClick={() => this.handleShowModalByType(MODAL_ADD_CERTIFICATE)}>
              <a className="btn-floating btn-large cryptoarm-red">
                <i className="large material-icons">add</i>
              </a>
            </div>
        }
      </div>
    );
  }

  viewCertificate = async () => {
    const { certificate } = this.state;

    if (certificate) {
      const x509: trusted.pki.Certificate = window.PKISTORE.getPkiObject(certificate);

      if (x509) {
        return new Promise((resolve, reject) => {
          x509.view();
          resolve();
        });
      }
    }
  }

  handleDeleteRequestCA = (requestId: string) => {
    this.setState({ requestCA: null });
    this.props.deleteRequestCA(requestId);
  }

  handleSearchValueChange = (ev: any) => {
    // tslint:disable-next-line:no-shadowed-variable
    const { changeSearchValue } = this.props;
    changeSearchValue(ev.target.value);
  }

  certImport = () => {
    const { localize, locale } = this.context;

    const files = dialog.showOpenDialogSync({
      properties: ["openFile"],
      title: localize("Certificate.certs", locale),
    });

    if (files) {
      this.handleImportPkiItem(files[0]);
    }
  }

  crlDialog = () => {
    const { localize, locale } = this.context;

    const files = dialog.showOpenDialogSync({
      filters: [
        { name: localize("CRL.crls", locale), extensions: ["crl"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile"],
      title: localize("CRL.crls", locale),
    });

    if (files) {
      this.handleImportPkiItem(files[0]);
    }
  }

  importFromCloudCSP = () => {
    if (os.type() === "Windows_NT") {
      let executablePath = "C:\\Program Files (x86)\\Common Files\\Crypto Pro\\Shared\\cptools.exe";

      if (os.arch() !== "x64") {
        executablePath = "C:\\Program Files\\Common Files\\Crypto Pro\\Shared\\cptools.exe";
      }

      if (fileExists(executablePath)) {
        execFile(executablePath, (error, stdout, stderr) => {
          if (error) {
            console.log("execFile error", error);
          }

          console.log(stdout);
        });

        return;
      }
    }

    this.props.handleShowModalCloudCSP();
  }

  getSelectedCertificate = () => {
    const { certificate, crl } = this.state;
    const { localize, locale } = this.context;

    const DISABLED = certificate || crl ? "" : "disabled";

    if (certificate) {
      const status = certificate.status;
      let curStatusStyle;

      if (status) {
        curStatusStyle = certificate.dssUserID ? "cloud_cert_status_ok" : "cert_status_ok";
      } else {
        curStatusStyle = certificate.dssUserID ? "cloud_cert_status_error" : "cert_status_error";
      }

      return (
        <div className="row">
          <div className="row halfbottom" />
          <div className="col s10">
            <div className="primary-text">Сертификат:</div>
            <hr />
          </div>
          <div className="col s2">
            <div className="right import-col">
              <a className={"nav-small-btn waves-effect waves-light " + DISABLED} data-activates="dropdown-btn-for-cert">
                <i className="file-setting-item waves-effect material-icons secondary-content">more_vert</i>
              </a>
              <ul id="dropdown-btn-for-cert" className="dropdown-content">
                {
                  certificate ?
                    <React.Fragment>
                      <li><a onClick={() => this.handleShowModalByType(MODAL_EXPORT_CERTIFICATE)}>{localize("Certificate.cert_export", locale)}</a></li>
                      <li><a onClick={() => this.handleShowModalByType(MODAL_DELETE_CERTIFICATE)}>{localize("Common.delete", locale)}</a></li>
                    </React.Fragment>
                    : null
                }
                {
                  certificate && certificate.category === REQUEST ?
                    <li>
                      <a onClick={this.handleOpenCSRFolder}>
                        {localize("CSR.go_to_csr_folder", locale)}
                      </a>
                    </li>
                    :
                    null
                }
                {
                  crl ?
                    <li>
                      <a onClick={() => this.CRLExport()}>{localize("Certificate.cert_export", locale)}</a>
                      <li><a onClick={() => this.handleShowModalByType(MODAL_DELETE_CRL)}>{localize("Common.delete", locale)}</a></li>
                    </li>
                    :
                    null
                }
              </ul>
            </div>
          </div>
          <div className="col s11">
            <div className="col s1">
              <div className={curStatusStyle} />
            </div>
            <div className="col s11">
              <div className="desktoplic_text_item topitem truncate">{certificate.subjectFriendlyName}</div>
              <div className="desktoplic_text_item topitem truncate">{certificate.issuerFriendlyName}</div>
            </div>
          </div>

        </div>
      );
    } else {
      return null;
    }
  }

  handleOpenCSRFolder = () => {
    window.electron.shell.openItem(DEFAULT_CSR_PATH);
  }

  getCPCSPVersion = () => {
    try {
      return trusted.utils.Csp.getCPCSPVersion();
    } catch (e) {
      return "";
    }
  }

  handleCertInfoConfirm = () => {
    const { urlCmdCertInfo } = this.props;
    sendCertificateInfo(urlCmdCertInfo.certToProcess, urlCmdCertInfo.url, urlCmdCertInfo.id);
  }

  handleCertInfoCancel = () => {
    certInfoFail();
  }

  CRLExport = () => {
    const { localize, locale } = this.context;
    const { crl } = this.state;

    const extension = "crl";

    const outFilePAth = dialog.showSaveDialogSync({
      defaultPath: "export." + extension,
      filters: [{ name: localize("CRL.crls", locale), extensions: [extension] }],
      title: localize("CRL.export_crl", locale),
    });

    const X509_CRL = window.PKISTORE.getPkiObject(crl);

    if (!X509_CRL) {
      $(".toast-crl_export_failed").remove();
      Materialize.toast(localize("CRL.crl_export_failed", locale), 2000, "toast-crl_export_failed");

      return;
    }

    if (outFilePAth && X509_CRL) {
      try {
        X509_CRL.save(outFilePAth);
      } catch (e) {
        $(".toast-crl_export_failed").remove();
        Materialize.toast(localize("CRL.crl_export_failed", locale), 2000, "toast-crl_export_failed");

        if (fileExists(outFilePAth)) {
          fs.unlinkSync(outFilePAth);
        }

        return;
      }
      $(".toast-crl_export_ok").remove();
      Materialize.toast(localize("CRL.crl_export_ok", locale), 2000, "toast-crl_export_ok");
    } else {
      $(".toast-crl_export_cancel").remove();
      Materialize.toast(localize("CRL.crl_export_cancel", locale), 2000, "toast-crl_export_cancel");
    }
  }
}

export default connect((state) => {
  return {
    certificates: filteredCertificatesSelector(state, { operation: "certificate" }),
    certrequests: filteredRequestCASelector(state),
    regrequests: state.regrequests.entities,
    cloudCSPSettings: state.settings.getIn(["entities", state.settings.default]).cloudCSP,
    cloudCSPState: state.cloudCSP,
    containersLoading: state.containers.loading,
    crls: filteredCrlsSelector(state),
    isLoading: state.certificates.loading,
    isLoadingFromDSS: state.cloudCSP.loading,
    location: state.router.location,
    searchValue: state.filters.searchValue,
    servicesMap: state.services.entities,
    urlCmdProps: state.urlCmdCertificates,
    urlCmdCertInfo: state.urlCmdCertInfo,
    isCertInfoMode: !state.urlCmdCertInfo.done,
    certificatesMap: state.certificates.entities,
  };
}, {
  changeSearchValue, deleteRequestCA, loadAllCertificates, loadAllContainers,
  removeAllCertificates, removeAllContainers, resetCloudCSP,
})(CertWindow);

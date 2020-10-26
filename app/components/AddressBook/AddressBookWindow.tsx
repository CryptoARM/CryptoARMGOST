import store from "../../store";
import * as os from "os";
import PropTypes from "prop-types";
import React from "react";
import Media from "react-media";
import { connect } from "react-redux";
import { loadAllCertificates, loadAllContainers, removeAllCertificates, removeAllContainers } from "../../AC";
import { changeSearchValue } from "../../AC/searchActions";
import {
  ADDRESS_BOOK, CA, DEFAULT_CSR_PATH, MODAL_ADD_CERTIFICATE,
  MODAL_BEST_STORE,
  MODAL_DELETE_CERTIFICATE,
  MODAL_EXPORT_CERTIFICATE,
  MY,
  PROVIDER_CRYPTOPRO, REQUEST, RESET_DSS_CERTIFICATES_VERIFIED, ROOT, USER_NAME,
} from "../../constants";
import { filteredCertificatesSelector } from "../../selectors";
import { fileCoding } from "../../utils";
import logger from "../../winstonLogger";
import BlockNotElements from "../BlockNotElements";
import AddCertificate from "../Certificate/AddCertificate";
import BestStore from "../Certificate/BestStore";
import CertificateChainInfo from "../Certificate/CertificateChainInfo";
import CertificateDelete from "../Certificate/CertificateDelete";
import CertificateExport from "../Certificate/CertificateExport";
import CertificateInfo from "../Certificate/CertificateInfo";
import CertificateInfoTabs from "../Certificate/CertificateInfoTabs";
import CertificateList from "../Certificate/CertificateList";
import Dialog from "../Dialog";
import Modal from "../Modal";
import ProgressBars from "../ProgressBars";

const dialog = window.electron.remote.dialog;
const OS_TYPE = os.type();

class AddressBookWindow extends React.Component<any, any> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);

    this.state = ({
      activeCertInfoTab: true,
      certificate: null,
      importingCertificate: null,
      showModalAddCertificate: false,
      showModalDeleteCertifiacte: false,
      showModalExportCertifiacte: false,
      showModalBestStore: false,
      showDialogInstallRootCertificate: false,
    });
  }

  componentDidMount() {
    $(".btn-floated").dropdown();
  }

  componentDidUpdate(prevProps, prevState) {
    const { isLoading } = this.props;
    const { certificate } = this.state;

    if ((!prevState.certificate && certificate)) {
      $(".nav-small-btn").dropdown();
    }

    if (prevProps.isLoading && !isLoading) {
      $(".btn-floated").dropdown();
    }
  }

  render() {
    const { certificates, isLoading, searchValue } = this.props;
    const { certificate } = this.state;
    const { localize, locale } = this.context;

    if (isLoading) {
      return <ProgressBars />;
    }

    const VIEW = certificates.size < 1 ? "not-active" : "";

    return (
      <div className="content-noflex">
        <div className="row">
          <div className="col s8 leftcol">
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
            <div className={"collection " + VIEW}>
              <div style={{ flex: "1 1 auto", height: "calc(100vh - 110px)" }}>
                {
                  certificates.size < 1 ?
                    <BlockNotElements name={"active"} title={localize("Certificate.cert_not_found", locale)} /> :
                    <CertificateList
                      selectedCert={this.state.certificate}
                      activeCert={this.handleActiveCert}
                      operation="address_book" />
                }
              </div>
            </div>
          </div>

          <div className="col s4 rightcol">
            <div className="row halfbottom" />
            <div className="row">
              <div style={{ height: "calc(100vh - 110px)" }}>
                {this.getCertificateInfo()}
              </div>
            </div>
            {
              certificate ?
                <div className="row fixed-bottom-rightcolumn" style={{ bottom: "20px" }}>
                  <div className="col s12">
                    <hr />
                  </div>
                  <div className="col s4 waves-effect waves-cryptoarm" onClick={() => this.handleShowModalByType(MODAL_EXPORT_CERTIFICATE)}>
                    <div className="col s12 svg_icon">
                      <a data-position="bottom">
                        <i className="material-icons certificate export" />
                      </a>
                    </div>
                    <div className="col s12 svg_icon_text">{localize("Certificate.cert_export", locale)}</div>
                  </div>

                  <div className="col s4 waves-effect waves-cryptoarm" onClick={() =>this.handleShowModalByType(MODAL_DELETE_CERTIFICATE)}>
                    <div className="col s12 svg_icon">
                      <a data-position="bottom">
                        <i className="material-icons certificate remove" />
                      </a>
                    </div>
                    <div className="col s12 svg_icon_text">{localize("Documents.docmenu_remove", locale)}</div>
                  </div>

                  {
                    OS_TYPE === "Windows_NT" && certificate && certificate.category !== REQUEST ?
                      <div className="col s4 waves-effect waves-cryptoarm" onClick={this.viewCertificate}>
                        <div className="col s12 svg_icon">
                          <a data-position="bottom">
                            <i className="material-icons certificate import" />
                          </a>
                        </div>
                        <div className="col s12 svg_icon_text">{localize("Common.open", locale)}</div>
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
          </div>
          {this.showModalAddCertificate()}
          {this.showModalDeleteCertificate()}
          {this.showModalExportCertificate()}
          {this.showModalBestStore()}
          <Dialog isOpen={this.state.showDialogInstallRootCertificate}
            header="Внимание!" body="Для установки корневых сертификатов требуются права администратора. Продолжить?"
            onYes={this.handleInstallTrustedCertificate} onNo={this.handleCloseDialogInstallRootCertificate} />
        </div>

        <div className="fixed-action-btn" style={{ bottom: "20px", right: "380px" }} onClick={() => this.handleShowModalByType(MODAL_ADD_CERTIFICATE)}>
          <a className="btn-floating btn-large cryptoarm-red">
            <i className="large material-icons">add</i>
          </a>
        </div>
      </div>
    );
  }

  handleShowModalByType = (typeOfModal: string) => {
    switch (typeOfModal) {
      case MODAL_ADD_CERTIFICATE:
        this.setState({ showModalAddCertificate: true });
        break;
      case MODAL_DELETE_CERTIFICATE:
        this.setState({ showModalDeleteCertifiacte: true });
        break;
      case MODAL_EXPORT_CERTIFICATE:
        this.setState({ showModalExportCertifiacte: true });
        break;
      case MODAL_BEST_STORE:
        this.setState({ showModalBestStore: true });
      default:
        return;
    }
  }

  handleCloseModalByType = (typeOfModal: string): void => {
    switch (typeOfModal) {
      case MODAL_ADD_CERTIFICATE:
        this.setState({ showModalAddCertificate: false });
        break;
      case MODAL_DELETE_CERTIFICATE:
        this.setState({ showModalDeleteCertifiacte: false });
        break;
      case MODAL_EXPORT_CERTIFICATE:
        this.setState({ showModalExportCertifiacte: false });
        break;
      case MODAL_BEST_STORE:
        this.setState({ showModalBestStore: false });
      default:
        return;
    }
  }

  handleCloseModals = () => {
    this.setState({
      showModalDeleteCertifiacte: false,
      showModalExportCertifiacte: false,
      showModalBestStore: false,
    });
  }

  handleChangeActiveTab = (certInfoTab: boolean) => {
    this.setState({
      activeCertInfoTab: certInfoTab,
    });
  }

  handleActiveCert = (certificate: any) => {
    this.setState({ certificate });
  }

  handleReloadCertificates = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { isLoading, loadAllCertificates, removeAllCertificates } = this.props;

    this.setState({ certificate: null});

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

  handleCertificateImport = (path: string, auto: boolean = false) => {

    const { localize, locale } = this.context;
    // tslint:disable-next-line:no-shadowed-variable
    const { isLoading, loadAllCertificates, removeAllCertificates, location } = this.props;

    const format: trusted.DataFormat = fileCoding(path);

    let certificate: trusted.pki.Certificate;
    let providerType: string;

    try {
      certificate = trusted.pki.Certificate.load(path, format);
    } catch (e) {
      Materialize.toast(localize("Certificate.cert_load_failed", locale), 2000, "toast-cert_load_failed");
      return;
    }

    providerType = PROVIDER_CRYPTOPRO;

    let bestStore;
    const bCA = certificate.isCA;
    const selfSigned = certificate.isSelfSigned;
    let container = "";

    try {
      container = trusted.utils.Csp.getContainerNameByCertificate(certificate);
    } catch (e) {
      //
    }

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
      this.handleShowModalByType(MODAL_BEST_STORE)
    }
  }

  handleInstallTrustedCertificate = () => {
    const { localize, locale } = this.context;
    // tslint:disable-next-line:no-shadowed-variable
    const { isLoading, loadAllCertificates, removeAllCertificates } = this.props;
    const { importingCertificate, importingCertificatePath } = this.state;

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

          Materialize.toast(localize("Certificate.cert_import_failed", locale), 2000, "toast-cert_import_error");
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

  handleAddCertToStore = (path: string) => {
    const { localize, locale } = this.context;
    // tslint:disable-next-line:no-shadowed-variable
    const { isLoading, loadAllCertificates, removeAllCertificates } = this.props;

    const format: trusted.DataFormat = fileCoding(path);

    let certificate: trusted.pki.Certificate;
    let providerType: string;

    try {
      certificate = trusted.pki.Certificate.load(path, format);
    } catch (e) {
      Materialize.toast(localize("Certificate.cert_load_failed", locale), 2000, "toast-cert_load_failed");
      return;
    }

    providerType = PROVIDER_CRYPTOPRO;

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

    removeAllCertificates();

    if (!isLoading) {
      loadAllCertificates();
    }
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

    return (
      <Modal
        isOpen={showModalBestStore}
        header={`Импорт в хранилище: ${header}`}
        onClose={() => this.handleCloseModalByType(MODAL_BEST_STORE)}
        style={{ width: "500px" }}>
        <BestStore
          onCancel={() => this.handleCloseModalByType(MODAL_BEST_STORE)}
          autoImport={() => this.handleCertificateImport(pathOfImportedPkiItem, true)}
          importToCurrent={() => {this.handleAddCertToStore(pathOfImportedPkiItem)}}
          bestStore={bestStore}
          currentStore={currentStore}
          isImportFromUrlCmd={false}
        />
      </Modal>
    );
  }

  getCertificateInfo() {
    const { certificate } = this.state;
    const { localize, locale } = this.context;

    if (certificate) {
      return this.getCertificateInfoBody();
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

  getTitle() {
    const { certificate } = this.state;
    const { localize, locale } = this.context;

    let title: any = null;

    if (certificate) {
      title = <div className="cert-title-main">
        <div className="collection-title cert-title">{certificate.subjectFriendlyName}</div>
        <div className="collection-info cert-title">{certificate.issuerFriendlyName}</div>
      </div>;
    } else {
      title = <span>{localize("Certificate.cert_info", locale)}</span>;
    }

    return title;
  }

  showModalAddCertificate = () => {
    const { localize, locale } = this.context;
    const { showModalAddCertificate } = this.state;
    const { location } = this.props;

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
        style={{width: "600px"}}>

        <CertificateDelete
          certificate={certificate}
          onCancel={() => this.handleCloseModalByType(MODAL_DELETE_CERTIFICATE)}
          reloadCertificates={this.handleReloadCertificates}
          reloadContainers={this.handleReloadContainers} />
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
        style={{width: "600px"}}>

        <CertificateExport
          certificate={certificate}
          onSuccess={() => this.handleCloseModalByType(MODAL_EXPORT_CERTIFICATE)}
          onCancel={() => this.handleCloseModalByType(MODAL_EXPORT_CERTIFICATE)}
          onFail={() => this.handleCloseModalByType(MODAL_EXPORT_CERTIFICATE)} />
      </Modal>
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

  handleSearchValueChange = (ev: any) => {
    // tslint:disable-next-line:no-shadowed-variable
    const { changeSearchValue } = this.props;
    changeSearchValue(ev.target.value);
  }

  certImport = () => {
    const { localize, locale } = this.context;

    const files = dialog.showOpenDialogSync({
      filters: [
        { name: localize("Certificate.certs", locale), extensions: ["cer", "crt"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile"],
      title: localize("Certificate.certs", locale),
    });
    this.setState({ pathOfImportedPkiItem: files[0] });
    if (files) {
      this.handleCertificateImport(files[0]);
    }
  }

  handleOpenCSRFolder = () => {
    window.electron.shell.openItem(DEFAULT_CSR_PATH);
  }
}

export default connect((state) => {
  return {
    certificates: filteredCertificatesSelector(state, { operation: "address_book" }),
    containersLoading: state.containers.loading,
    isLoading: state.certificates.loading,
    location: state.router.location,
    searchValue: state.filters.searchValue,
  };
}, {
  changeSearchValue, loadAllCertificates, loadAllContainers,
  removeAllCertificates, removeAllContainers})(AddressBookWindow);

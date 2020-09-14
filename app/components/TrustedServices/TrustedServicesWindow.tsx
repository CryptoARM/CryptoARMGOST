import * as os from "os";
import PropTypes from "prop-types";
import React from "react";
import Media from "react-media";
import { connect } from "react-redux";
import { loadAllCertificates, removeAllCertificates } from "../../AC";
import { changeSearchValue } from "../../AC/searchActions";
import { deleteTrustedService } from "../../AC/trustedServicesActions";
import {
  ADDRESS_BOOK, DEFAULT_CSR_PATH, MODAL_ADD_CERTIFICATE,
  MODAL_DELETE_CERTIFICATE,
  MODAL_EXPORT_CERTIFICATE,
  PROVIDER_CRYPTOPRO, REQUEST, ROOT, USER_NAME,
} from "../../constants";
import { filteredCertificatesSelector } from "../../selectors";
import { filteredTrustedServicesSelector } from "../../selectors/trustedServicesSelector";
import BlockNotElements from "../BlockNotElements";
import CertificateChainInfo from "../Certificate/CertificateChainInfo";
import CertificateDelete from "../Certificate/CertificateDelete";
import CertificateInfo from "../Certificate/CertificateInfo";
import CertificateInfoTabs from "../Certificate/CertificateInfoTabs";
import CertificateList from "../Certificate/CertificateList";
import Modal from "../Modal";
import ProgressBars from "../ProgressBars";
import TrustedServiceDelete from "./TrustedServiceDelete";
import TrustedServicesTable from "./TrustedServicesTable";

class TrustedServicesWindow extends React.Component<any, any> {
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
                    placeholder={"Поиск по списку сервисов"}
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
                    <TrustedServicesTable searchValue={this.state.searchValue} activeCert={this.handleActiveCert} selectedCert={this.state.certificate} />
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

                  <div className="col s4 waves-effect waves-cryptoarm" onClick={() => this.handleShowModalByType(MODAL_DELETE_CERTIFICATE)}>
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
          {this.showModalDeleteCertificate()}
        </div>
      </div>
    );
  }

  handleActiveCert = (certificate: any) => {
    this.setState({ certificate });
  }

  handleShowModalByType = (typeOfModal: string) => {
    switch (typeOfModal) {
      case MODAL_DELETE_CERTIFICATE:
        this.setState({ showModalDeleteCertifiacte: true });
        break;
      default:
        return;
    }
  }

  handleCloseModalByType = (typeOfModal: string): void => {
    switch (typeOfModal) {
      case MODAL_DELETE_CERTIFICATE:
        this.setState({ showModalDeleteCertifiacte: false });
        break;
      default:
        return;
    }
  }

  handleCloseModals = () => {
    this.setState({
      showModalDeleteCertifiacte: false,
      showModalExportCertifiacte: false,
    });
  }

  handleChangeActiveTab = (certInfoTab: boolean) => {
    this.setState({
      activeCertInfoTab: certInfoTab,
    });
  }

  handleReloadCertificates = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { isLoading, loadAllCertificates, removeAllCertificates } = this.props;

    this.setState({ certificate: null });

    removeAllCertificates();

    if (!isLoading) {
      loadAllCertificates();
    }

    this.handleCloseModals();
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

  showModalDeleteCertificate = () => {
    const { localize, locale } = this.context;
    const { certificate, showModalDeleteCertifiacte } = this.state;

    if (!certificate || !showModalDeleteCertifiacte) {
      return;
    }

    return (
      <Modal
        isOpen={showModalDeleteCertifiacte}
        header={"Удаление сервиса"}
        onClose={() => this.handleCloseModalByType(MODAL_DELETE_CERTIFICATE)}
        style={{ width: "600px" }}>

        <TrustedServiceDelete
          deleteTrustedService={(url) => {
            this.setState({ certificate: null });
            this.props.deleteTrustedService(url);
          }}
          service={certificate}
          onCancel={() => this.handleCloseModalByType(MODAL_DELETE_CERTIFICATE)} />
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
}

export default connect((state) => {
  return {
    certificates: filteredTrustedServicesSelector(state),
    isLoading: state.certificates.loading,
    location: state.router.location,
    searchValue: state.filters.searchValue,
  };
}, {
  changeSearchValue, loadAllCertificates,
  // tslint:disable-next-line: object-literal-sort-keys
  removeAllCertificates, deleteTrustedService,
})(TrustedServicesWindow);

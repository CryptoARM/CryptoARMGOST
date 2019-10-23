import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { getCertificateFromContainer, loadAllCertificates, loadAllContainers, removeAllCertificates, removeAllContainers } from "../../AC";
import { changeSearchValue } from "../../AC/searchActions";
import { USER_NAME } from "../../constants";
import { filteredContainersSelector } from "../../selectors";
import logger from "../../winstonLogger";
import BlockNotElements from "../BlockNotElements";
import CertificateInfo from "../Certificate/CertificateInfo";
import Modal from "../Modal";
import ProgressBars from "../ProgressBars";
import ContainerDelete from "./ContainerDelete";
import ContainersList from "./ContainersList";

class ContainersWindow extends React.Component<any, any> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);

    this.state = ({
      showModalDeleteContainer: false,
    });
  }

  render() {
    const { container, containers, isLoading, certificatesLoading, searchValue } = this.props;
    const { localize, locale } = this.context;

    if (isLoading || certificatesLoading) {
      return <ProgressBars />;
    }

    const block = containers.length > 0 ? "not-active" : "active";
    const active = container ? "active" : "not-active";
    const view = containers.length < 1 ? "not-active" : "";

    return (
      <div className="main">
        <div className="content">
          <div className="col col s8 leftcol">
            <div className="row">
              <div className="row halfbottom" />
              <div className="col" style={{ width: "calc(100% - 40px)" }}>
                <div className="input-field input-field-csr col s12 border_element find_box">
                  <i className="material-icons prefix">search</i>
                  <input
                    id="search"
                    type="search"
                    placeholder={localize("Certificate.search_in_certificates_list", locale)}
                    value={searchValue}
                    onChange={this.handleSearchValueChange} />
                  <i className="material-icons close" onClick={() => this.props.changeSearchValue("")} style={{}}>close</i>
                </div>
              </div>
              <div className="col" style={{ width: "40px" }}>
                <a onClick={this.handleReloadContainers}>
                  <i className="file-setting-item waves-effect material-icons secondary-content">autorenew</i>
                </a>
              </div>
            </div>
            <div className="add-certs">
              <BlockNotElements name={block} title={localize("Containers.containersNotFound", locale)} />
              <div className={"collection " + view}>
                <div className="row">
                  <div className="col s12">
                    <ContainersList />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col s4 rightcol">
            <div className="row halfbottom" />
            <div className="row">
              <div className="col s12">
                <div style={{ height: "calc(100vh - 110px)" }}>
                  {this.getCertificateInfoBody()}
                </div>
              </div>
            </div>

            {
              container ?
                <div className="row fixed-bottom-rightcolumn" style={{ position: "relative", bottom: "80px" }}>
                  <div className="col s12">
                    <hr />
                  </div>

                  {
                    container.certificate ?
                      <div className="col s4 waves-effect waves-cryptoarm" onClick={this.handleInstallCertificate}>
                        <div className="col s12 svg_icon">
                          <a data-position="bottom">
                            <i className="material-icons certificate import" />
                          </a>
                        </div>
                        <div className="col s12 svg_icon_text">{localize("Containers.installCertificate", locale)}</div>
                      </div> :
                      null
                  }

                  <div className="col s4 waves-effect waves-cryptoarm" onClick={this.handleShowModalDeleteContainer}>
                    <div className="col s12 svg_icon">
                      <a data-position="bottom">
                        <i className="material-icons certificate remove" />
                      </a>
                    </div>
                    <div className="col s12 svg_icon_text">{localize("Containers.remove_container", locale)}</div>
                  </div>
                </div> :
                null
            }
          </div>
          {this.showModalDeleteContainer()}
        </div>
      </div>
    );
  }

  handleShowModalDeleteContainer = () => {
    this.setState({ showModalDeleteContainer: true });
  }

  handleCloseModalDeleteContainer = () => {
    this.setState({ showModalDeleteContainer: false });
  }

  showModalDeleteContainer = () => {
    const { localize, locale } = this.context;
    const { showModalDeleteContainer } = this.state;
    const { container } = this.props;

    if (!showModalDeleteContainer) {
      return;
    }

    return (
      <Modal
        isOpen={showModalDeleteContainer}
        header={localize("Containers.remove_container", locale)}
        onClose={this.handleCloseModalDeleteContainer}>

        <ContainerDelete
          container={container}
          onCancel={this.handleCloseModalDeleteContainer}
          reloadContainers={this.handleReloadContainers}
          reloadCertificates={this.handleReloadCertificates} />

      </Modal>
    );
  }

  handleSearchValueChange = (ev: any) => {
    // tslint:disable-next-line:no-shadowed-variable
    const { changeSearchValue } = this.props;
    changeSearchValue(ev.target.value);
  }

  handleInstallCertificate = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { certificatesLoading, container, loadAllCertificates, removeAllCertificates } = this.props;
    const { localize, locale } = this.context;

    if (!container.certificate) {
      return;
    }

    try {
      trusted.utils.Csp.installCertificateFromContainer(container.name, 75, "Crypto-Pro GOST R 34.10-2001 Cryptographic Service Provider");
      const certificate = trusted.utils.Csp.getCertificateFromContainer(container.name, 75, "Crypto-Pro GOST R 34.10-2001 Cryptographic Service Provider");

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
        level: "error",
        message: err.message ? err.message : err,
        operation: "Импорт сертификата",
        operationObject: {
          in: "Null",
          out: "Null",
        },
        userName: USER_NAME,
      });
    }

    removeAllCertificates();

    if (!certificatesLoading) {
      loadAllCertificates();
    }

    Materialize.toast(localize("Certificate.cert_import_ok", locale), 2000, "toast-cert_imported");
  }

  handleReloadContainers = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { isLoading, loadAllContainers, removeAllContainers } = this.props;

    removeAllContainers();

    if (!isLoading) {
      loadAllContainers();
    }
  }
  handleReloadCertificates = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { isLoading, loadAllCertificates, removeAllCertificates } = this.props;

    this.setState({ certificate: null, crl: null, requestCA: null });

    removeAllCertificates();

    if (!isLoading) {
      loadAllCertificates();
    }

  }

  getCertificateInfoBody() {
    // tslint:disable-next-line:no-shadowed-variable
    const { container, getCertificateFromContainer } = this.props;
    const { localize, locale } = this.context;

    if (!container) {
      return (
        <BlockNotElements name={"active"} title={localize("Containers.contNotSelected", locale)} />
      );
    }

    if (!container.certificateLoading && !container.certificateLoaded) {
      getCertificateFromContainer(container.id);
    }

    if (container.certificateLoading) {
      return <ProgressBars />;
    }

    if (!container.certificateItem) {
      return <BlockNotElements name={"active"} title={localize("Containers.get_certificate_fail", locale)} />;
    }

    return (
      <div className="add-certs">
        <CertificateInfo certificate={container.certificateItem} />
      </div>
    );
  }
}

export default connect((state) => {
  return {
    certificatesLoading: state.certificates.loading,
    container: state.containers.getIn(["entities", state.containers.active]),
    containers: filteredContainersSelector(state),
    isLoading: state.containers.loading,
    searchValue: state.filters.searchValue,
  };
}, {
  changeSearchValue, getCertificateFromContainer, loadAllCertificates,
  loadAllContainers, removeAllContainers, removeAllCertificates
})(ContainersWindow);

import PropTypes from "prop-types";
import React from "react";
import Media from "react-media";
import { connect } from "react-redux";
import {
  addRecipientCertificate, deleteRecipient,
  loadAllCertificates, removeAllCertificates,
} from "../../AC";
import { changeSearchValue } from "../../AC/searchActions";
import { changeEncryptionAlgorithm, getDefaultEncryptionAlg, isGostRecipients } from "../../AC/settingsActions";
import { urlCmdCertExportFail, urlCmdSendCerts } from "../../AC/urlCmdCertificates";
import { URL_CMD_CERTIFICATES_EXPORT } from "../../constants";
import { filteredCertificatesSelector } from "../../selectors";
import { mapToArr } from "../../utils";
import BlockNotElements from "../BlockNotElements";
import Modal from "../Modal";
import ProgressBars from "../ProgressBars";
import RecipientsList from "../RecipientsList";
import WrongCertificate from "../Settings/WrongCertificate";
import CertificateChainInfo from "./CertificateChainInfo";
import CertificateInfo from "./CertificateInfo";
import CertificateInfoTabs from "./CertificateInfoTabs";
import CertificateList from "./CertificateList";

class CertificateSelectionForEncrypt extends React.Component<any, any> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);

    this.state = ({
      activeCertInfoTab: true,
      activeCertificate: null,
      certificate: null,
      crl: null,
      importingCertificate: null,
      importingCertificatePath: null,
      password: "",
      selectedRecipients: props.recipients,
      showDialogInstallRootCertificate: false,
      showModalCertificateRequest: false,
      showModalCloudCSP: false,
      showModalDeleteCRL: false,
      showModalDeleteCertifiacte: false,
      showModalExportCRL: false,
      showModalExportCertifiacte: false,
      showModalWrongCertificate: false,
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
    const { certificates, isLoading, isLoadingFromDSS, searchValue, exportCommmand } = this.props;
    const { certificate, selectedRecipients } = this.state;
    const { localize, locale } = this.context;

    if (isLoading || isLoadingFromDSS) {
      return <ProgressBars />;
    }

    const VIEW = certificates.size < 1 ? "not-active" : "";
    const CHOOSE_VIEW = !selectedRecipients || !selectedRecipients.length ? "active" : "not-active";

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
            <div className="add-certs">
              <div className={"collection " + VIEW}>
                <div className="row">
                  <div className="col s12">
                    <div style={{ display: "flex" }}>
                      <div style={{ flex: "1 1 auto", height: "calc(100vh - 140px)" }}>
                        {
                          certificates.size < 1 ?
                            <BlockNotElements name={"active"} title={localize("Certificate.cert_not_found", locale)} /> :
                            <CertificateList
                              activeCert={this.handleAddRecipient}
                              operation={exportCommmand ? "export_certs" : "encrypt"} />
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col s4 rightcol">
            <div className="row halfbottom" />
            <div className="row">
              <div className="col s12">
                <div className="primary-text">Сертификаты шифрования</div>
                <hr />
                {this.state.showModalWrongCertificate ?
                  this.showModalWrongCertificate() : null}
              </div>
              <div className="col s12">
                {(this.state.activeCertificate) ?
                  <div>
                    <div style={{ height: "calc(100vh - 120px)" }}>
                      {this.getCertificateInfoBody(this.state.activeCertificate)}
                    </div>
                  </div>
                  :
                  <div style={{ height: "calc(100vh - 120px)" }}>
                    <div className="add-certs">
                      <RecipientsList onActive={this.handleActiveCert} handleRemoveRecipient={this.handleRemoveRecipient} recipients={this.state.selectedRecipients} />
                      <BlockNotElements name={CHOOSE_VIEW} title={localize("Certificate.cert_not_select", locale)} />
                    </div>
                  </div>
                }

              </div>
            </div>
            <div className="row fixed-bottom-rightcolumn">
              {(this.state.activeCertificate) ?
                <div className="col s1 offset-s4">
                  <a className="btn btn-text waves-effect waves-light" onClick={this.backViewChooseCerts}>
                    {"< НАЗАД"}
                  </a>
                </div> :
                <React.Fragment>
                  <div className="col s6 offset-s1">
                    <a className="btn btn-text waves-effect waves-light" onClick={this.handleCancel}>
                      ОТМЕНА
                      </a>
                  </div>
                  <div className="col s2">
                    <a className="btn btn-outlined waves-effect waves-light" onClick={this.handleChooseRecipients}>
                      {localize("Settings.Choose", locale)}
                    </a>
                  </div>
                </React.Fragment>
              }
            </div>
          </div>
        </div>
      </div>
    );
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
  }

  getCertificateInfoBody(certificate: any) {
    const { activeCertInfoTab } = this.state;
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

  handleAddRecipient = (cert: any) => {
    if (!this.state.selectedRecipients.includes(cert)) {
      this.setState({
        selectedRecipients: [...this.state.selectedRecipients, cert],
      });
    }
  }

  handleRemoveRecipient = (cert: any) => {
    this.setState({
      selectedRecipients: this.state.selectedRecipients.filter((item: object) => item !== cert),
    });
  }

  handleActiveCert = (certificate: any) => {
    this.setState({ activeCertificate: certificate });
  }

  backViewChooseCerts = () => {
    this.setState({ activeCertificate: null });
  }

  handleChooseRecipients = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { addRecipientCertificate } = this.props;
    const { selectedRecipients } = this.state;
    const { urlCmdProps } = this.props;
    const isGost = isGostRecipients (selectedRecipients);
    const defaultAlg = getDefaultEncryptionAlg (isGost);

    if (urlCmdProps && !urlCmdProps.done
      && (urlCmdProps.operation == URL_CMD_CERTIFICATES_EXPORT)
    ) {
      urlCmdSendCerts(selectedRecipients, urlCmdProps.id, urlCmdProps.url);
    } else {
      for (const items of selectedRecipients) {
        if (!items.status) {
          this.handleshowModalWrongCertificate();
          return;
        }
      }

      this.handleCleanRecipientsList();

      for (const recipient of selectedRecipients) {
        addRecipientCertificate(recipient.id);
        this.props.changeEncryptionAlgorithm(defaultAlg);
      }

    }

    this.props.history.goBack();
  }

  handleCancel = () => {
    const { urlCmdProps } = this.props;

    if (urlCmdProps && !urlCmdProps.done
      && (urlCmdProps.operation == URL_CMD_CERTIFICATES_EXPORT)
    ) {
      urlCmdCertExportFail();
    }

    this.props.history.goBack();
  }

  handleCleanRecipientsList = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { deleteRecipient, recipients } = this.props;

    recipients.forEach((recipient: any) => deleteRecipient(recipient.id));
  }

  handleCleanStateList = () => {
    this.setState({
      selectedRecipients: [],
    });
  }

  handleSearchValueChange = (ev: any) => {
    // tslint:disable-next-line:no-shadowed-variable
    const { changeSearchValue } = this.props;
    changeSearchValue(ev.target.value);
  }

  showModalWrongCertificate = () => {
    const { localize, locale } = this.context;
    const { showModalWrongCertificate } = this.state;

    if (!showModalWrongCertificate) {
      return null;
    }

    return (
      <Modal
        isOpen={showModalWrongCertificate}
        key="showModalWrongCertificate"
        header={localize("Settings.warning", locale)}
        onClose={this.handleCloseModalWrongCertificate}
        style={{ width: "500px" }}>

        <WrongCertificate
          onCancel={this.handleCloseModalWrongCertificate}
          onContinue={this.handleCloseModalContinue}
          message={localize("Problems.problem_9", locale)}
        />
      </Modal>
    );
  }

  handleCloseModalContinue = () => {
    const { selectedRecipients } = this.state;
    const isGost = isGostRecipients (selectedRecipients);
    const defaultAlg = getDefaultEncryptionAlg (isGost);

    this.props.changeEncryptionAlgorithm(defaultAlg);
    this.setState({ showModalWrongCertificate: false });
    this.handleCleanRecipientsList();

    for (const recipient of selectedRecipients) {
      this.props.addRecipientCertificate(recipient.id);
    }

    this.props.history.goBack();
  }

  handleshowModalWrongCertificate = () => {
    this.setState({ showModalWrongCertificate: true });
  }

  handleCloseModalWrongCertificate = () => {
    this.setState({ showModalWrongCertificate: false });
  }
}

export default connect((state) => {
  return {
    certificates: filteredCertificatesSelector(state,
      (state.urlCmdCertificates && state.urlCmdCertificates.performing
        && (state.urlCmdCertificates.operation === URL_CMD_CERTIFICATES_EXPORT))
        ? { operation: "export_certs" } : { operation: "encrypt" }),
    exportCommmand: state.urlCmdCertificates && state.urlCmdCertificates.performing,
    isLoading: state.certificates.loading,
    isLoadingFromDSS: state.cloudCSP.loading,
    recipients: mapToArr(state.settings.getIn(["entities", state.settings.active]).encrypt.recipients)
      .map((recipient) => state.certificates.getIn(["entities", recipient.certId]))
      .filter((recipient) => recipient !== undefined),
    searchValue: state.filters.searchValue,
    urlCmdProps: state.urlCmdCertificates,
  };
}, {
  addRecipientCertificate, changeEncryptionAlgorithm, changeSearchValue, deleteRecipient,
  loadAllCertificates, removeAllCertificates,
})(CertificateSelectionForEncrypt);

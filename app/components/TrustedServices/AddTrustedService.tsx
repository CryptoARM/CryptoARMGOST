import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { addTrustedService, hideModalAddTrustedService } from "../../AC/trustedServicesActions";
import { dispatchURLCommand, finishCurrentUrlCmd, getServiceBaseLinkFromUrl } from "../../AC/urlActions";
import { PkiCertToCertInfo } from "../../AC/urlCmdCertInfo";
import store from "../../store";
import CertificateChainInfo from "../Certificate/CertificateChainInfo";

interface IAddTrustedServiceProps {
  onCancel?: () => void;
}

interface IAddTrustedServiceState {
  saveService: boolean;
}

class AddTrustedService extends React.Component<
  IAddTrustedServiceProps,
  IAddTrustedServiceState
  > {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  isCommandAccepted: boolean = false;

  constructor(props: IAddTrustedServiceProps) {
    super(props);

    this.state = {
      saveService: false,
    };
  }

  componentWillUnmount() {
    this.handelCancel();
  }

  render() {
    const { saveService } = this.state;
    const { localize, locale } = this.context;
    const { trustedServices } = this.props;
    const { cert } = this.props.trustedServices;

    const urlToCheck = trustedServices && trustedServices.urlToCheck ? getServiceBaseLinkFromUrl(trustedServices.urlToCheck, false) : "Unknown URL";

    return (
      <React.Fragment>
        <div className="row halftop">
          <div className="col s12">
            <div className="content-wrapper z-depth-1 tbody">
              <div className="dialog-text">
                {localize("TrustedServices.site", locale)} <span className="cryptoarm-blue" style={{ fontWeight: "bold" }}>{urlToCheck}</span> {localize("TrustedServices.requests_for_cryptoarm", locale)}
              </div>
              <div>
                {this.certInfo()}
              </div>
              <div className="row">
                <div className="dialog-text">
                  <input
                    disabled={!cert ? true : false}
                    name="groupDelCont"
                    type="checkbox"
                    id="delCont"
                    className="filled-in"
                    checked={saveService}
                    onClick={this.toggleSaveService}
                  />
                  <label htmlFor="delCont">{localize("TrustedServices.do_not_show_again", locale)}</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row halfbottom" />

        <div className="row halfbottom">
          <div style={{ float: "right" }}>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a
                className="btn btn-text waves-effect waves-light modal-close"
                onClick={this.handelCancel}
              >
                {localize("Common.cancel", locale)}
              </a>
            </div>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a
                className={`btn btn-outlined waves-effect waves-light modal-close ${cert ? "" : "disabled"}`}
                onClick={this.handleProcessCommandWithService}
              >
                {localize("Common.allow", locale)}
              </a>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  handleProcessCommandWithService = () => {
    const { trustedServices, urlCmds } = this.props;

    const urlToCheck = (trustedServices && trustedServices.urlToCheck) ? trustedServices.urlToCheck : "'Unknown resource'";

    if (this.state.saveService) {
      const certificateValue = trustedServices.cert.export(trusted.DataFormat.PEM).toString();
      store.dispatch(addTrustedService(getServiceBaseLinkFromUrl(urlToCheck), certificateValue));
    }

    this.isCommandAccepted = true;
    store.dispatch(hideModalAddTrustedService());
    dispatchURLCommand(urlCmds);
  }

  handelCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }

    if (!this.isCommandAccepted) {
      store.dispatch(finishCurrentUrlCmd(false));
    }
    store.dispatch(hideModalAddTrustedService());
  }

  toggleSaveService = () => {
    this.setState({ saveService: !this.state.saveService });
  }

  certInfo = () => {
    const { cert } = this.props.trustedServices;
    const { localize, locale } = this.context;

    if (!cert) {
      return <div className="dialog-text">{localize("TrustedServices.error_load_cert", locale)}</div>;
    }

    const certInfo = PkiCertToCertInfo(cert.subjectKeyIdentifier, cert, false);
    return (<React.Fragment>
      <a className="collection-info chain-info-blue">{localize("Certificate.cert_chain_status", locale)}</a>
      <div className="collection-info chain-status">{certInfo.status ? localize("Certificate.cert_chain_status_true", locale) : localize("Certificate.cert_chain_status_false", locale)}</div>
      <CertificateChainInfo certificate={certInfo} style="" onClick={() => { return; }} />
    </React.Fragment>);
  }
}

export default connect((state) => {
  return {
    trustedServices: state.trustedServices,
    urlCmds: state.urlCmds,
  };
})(AddTrustedService);

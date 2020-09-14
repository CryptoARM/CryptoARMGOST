import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { addTrustedService, hideModalAddTrustedService } from "../../AC/trustedServicesActions";
import { dispatchURLCommand, getServiceBaseLinkFromUrl } from "../../AC/urlActions";
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
                <div className="dialog-text">
                  {localize("TrustedServices.cert_params", locale)}
                </div>
                {this.certInfo()}
              </div>
              <div className="row">
                <div className="dialog-text">
                  <input
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
                className="btn btn-outlined waves-effect waves-light modal-close"
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
      /*     // tslint:disable-next-line: max-line-length
      const x509 = "-----BEGIN CERTIFICATE-----\r\nMIIHVDCCBwGgAwIBAgIRASBgKwGWq/aGQXPU/KiDvkkwCgYIKoUDBwEBAwIwggFb\r\nMSAwHgYJKoZIhvcNAQkBFhFpbmZvQGNyeXB0b3Byby5ydTEYMBYGBSqFA2QBEg0x\r\nMDM3NzAwMDg1NDQ0MRowGAYIKoUDA4EDAQESDDAwNzcxNzEwNzk5MTELMAkGA1UE\r\nBhMCUlUxGDAWBgNVBAgMDzc3INCc0L7RgdC60LLQsDEVMBMGA1UEBwwM0JzQvtGB\r\n0LrQstCwMS8wLQYDVQQJDCbRg9C7LiDQodGD0YnRkdCy0YHQutC40Lkg0LLQsNC7\r\nINC0LiAxODElMCMGA1UECgwc0J7QntCeICLQmtCg0JjQn9Ci0J4t0J/QoNCeIjFr\r\nMGkGA1UEAwxi0KLQtdGB0YLQvtCy0YvQuSDQv9C+0LTRh9C40L3QtdC90L3Ri9C5\r\nINCj0KYg0J7QntCeICLQmtCg0JjQn9Ci0J4t0J/QoNCeIiDQk9Ce0KHQoiAyMDEy\r\nICjQo9CmIDIuMCkwHhcNMjAwNDA3MTgwMDAwWhcNMjAwNzA3MTgxMDAwWjAXMRUw\r\nEwYDVQQDDAxhbGdfZHNzXzIwMjAwZjAfBggqhQMHAQEBATATBgcqhQMCAiQABggq\r\nhQMHAQECAgNDAARA7FQCmyUePP2U8GWpEXIFt+TbGGNREzrPV7G0Ramy1ro6Bp0W\r\nLHhBhVwsaI2JWvZDTl9f1EJ411oyKi/BfrFmvKOCBNkwggTVMA4GA1UdDwEB/wQE\r\nAwID+DAdBgNVHQ4EFgQUHNcurUIt9Qh4atuiTLBZ19yBIEMwNQYJKwYBBAGCNxUH\r\nBCgwJgYeKoUDAgIyAQmH8OBOhu7PDIXpkVuCr7RcgcpVgrNEAgEBAgEAMBMGA1Ud\r\nJQQMMAoGCCsGAQUFBwMCMBsGCSsGAQQBgjcVCgQOMAwwCgYIKwYBBQUHAwIwgacG\r\nCCsGAQUFBwEBBIGaMIGXMDgGCCsGAQUFBzABhixodHRwOi8vdGVzdGNhMjAxMi5j\r\ncnlwdG9wcm8ucnUvb2NzcC9vY3NwLnNyZjBbBggrBgEFBQcwAoZPaHR0cDovL3Rl\r\nc3RjYTIwMTIuY3J5cHRvcHJvLnJ1L2FpYS9mZmU0Njg2MDkyYzhlYzgxMTMxOWJi\r\nOTYzNWUzNTg0MWYxODEyZDliLmNydDAdBgNVHSAEFjAUMAgGBiqFA2RxAjAIBgYq\r\nhQNkcQEwKwYDVR0QBCQwIoAPMjAyMDA0MDcxNzU5NTlagQ8yMDIwMDcwNzE3NTk1\r\nOVowggEaBgUqhQNkcASCAQ8wggELDDTQodCa0JfQmCAi0JrRgNC40L/RgtC+0J/R\r\ngNC+IENTUCIgKNCy0LXRgNGB0LjRjyA0LjApDDHQn9CQ0JogItCa0YDQuNC/0YLQ\r\nvtCf0YDQviDQo9CmIiDQstC10YDRgdC40LggMi4wDE/QodC10YDRgtC40YTQuNC6\r\n0LDRgiDRgdC+0L7RgtCy0LXRgtGB0YLQstC40Y8g4oSWINCh0KQvMTI0LTMzODAg\r\n0L7RgiAxMS4wNS4yMDE4DE/QodC10YDRgtC40YTQuNC60LDRgiDRgdC+0L7RgtCy\r\n0LXRgtGB0YLQstC40Y8g4oSWINCh0KQvMTI4LTM1OTIg0L7RgiAxNy4xMC4yMDE4\r\nMCoGBSqFA2RvBCEMH9Cf0JDQmtCcINCa0YDQuNC/0YLQvtCf0YDQviBIU00wYAYD\r\nVR0fBFkwVzBVoFOgUYZPaHR0cDovL3Rlc3RjYTIwMTIuY3J5cHRvcHJvLnJ1L2Nk\r\ncC9mZmU0Njg2MDkyYzhlYzgxMTMxOWJiOTYzNWUzNTg0MWYxODEyZDliLmNybDCC\r\nAZcGA1UdIwSCAY4wggGKgBT/5GhgksjsgRMZu5Y141hB8YEtm6GCAV2kggFZMIIB\r\nVTEgMB4GCSqGSIb3DQEJARYRaW5mb0BjcnlwdG9wcm8ucnUxGDAWBgUqhQNkARIN\r\nMTAzNzcwMDA4NTQ0NDEaMBgGCCqFAwOBAwEBEgwwMDc3MTcxMDc5OTExCzAJBgNV\r\nBAYTAlJVMRgwFgYDVQQIDA83NyDQnNC+0YHQutCy0LAxFTATBgNVBAcMDNCc0L7R\r\ngdC60LLQsDEvMC0GA1UECQwm0YPQuy4g0KHRg9GJ0ZHQstGB0LrQuNC5INCy0LDQ\r\nuyDQtC4gMTgxJTAjBgNVBAoMHNCe0J7QniAi0JrQoNCY0J/QotCeLdCf0KDQniIx\r\nZTBjBgNVBAMMXNCi0LXRgdGC0L7QstGL0Lkg0LPQvtC70L7QstC90L7QuSDQo9Cm\r\nINCe0J7QniAi0JrQoNCY0J/QotCeLdCf0KDQniIg0JPQntCh0KIgMjAxMiAo0KPQ\r\npiAyLjApghEB0TnGAOWpVbVKj33IVQpvZjAKBggqhQMHAQEDAgNBANOjmQWDKuvI\r\n7yg4TEWILPkd+v6DxDol1AXEoenSv6hOUCHqpkotPH7dILHMqWbqYRYsZfo6soz0\r\n3srZER0BuKI=\r\n-----END CERTIFICATE-----\r\n";
      const pkiCertificate = new trusted.pki.Certificate();
      try {
        pkiCertificate.import(Buffer.from(x509), trusted.DataFormat.PEM);
      } catch (e) {
        // tslint:disable-next-line: no-console
        console.log("Error addTrustedService", e);
        return;
      }
      */

      const certificateValue = trustedServices.cert/*pkiCertificate*/.export(trusted.DataFormat.PEM).toString();
      store.dispatch(addTrustedService(getServiceBaseLinkFromUrl(urlToCheck), certificateValue));
    }

    store.dispatch(hideModalAddTrustedService());
    dispatchURLCommand(urlCmds);
  }

  handelCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
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
    return <CertificateChainInfo certificate={certInfo} style="" onClick={() => { return; }} />;
  }
}

export default connect((state) => {
  return {
    trustedServices: state.trustedServices,
    urlCmds: state.urlCmds,
  };
})(AddTrustedService);

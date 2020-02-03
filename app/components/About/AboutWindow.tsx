import PropTypes from "prop-types";
import React from "react";
import { TSP_OCSP_ENABLED } from "../../constants";
import LicenseCSPSetup from "../License/LicenseCSPSetup";
import LicenseInfo from "../License/LicenseInfo";
import LicenseOCSPSetup from "../License/LicenseOCSPSetup";
import LicenseSetupModal from "../License/LicenseSetupModal";
import LicenseTSPSetup from "../License/LicenseTSPSetup";
import Modal from "../Modal";

interface ILicenseInfoCSPState {
  showModalLicenseCSPSetup: boolean;
  showModalLicenseTSPSetup: boolean;
  showModalLicenseOCSPSetup: boolean;
  showModalLicenseSetup: boolean;
}

class AboutWindow extends React.Component<{}, ILicenseInfoCSPState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: {}) {
    super(props);

    this.state = ({
      showModalLicenseCSPSetup: false,
      showModalLicenseOCSPSetup: false,
      showModalLicenseSetup: false,
      showModalLicenseTSPSetup: false,
    });
  }

  componentDidMount() {
    $(".add-licence-modal-btn").leanModal();
  }

  render() {
    const { localize, locale } = this.context;
    const licenseCsp = this.getLicense();

    return (
      <div className="content-noflex">
        <div className="row">
          <div className="col s8 leftcol">
            <div className="row halfbottom">
              <div className="row halfbottom" />
              <div className="col s12">
                <div className="headline6">{localize("License.About_License", locale)}</div>
                <hr />
                <LicenseInfo />
              </div>

              <div className="row" />

              <div className="col s12">
                <div className="headline6">О программе</div>
                <hr />
                <div className="row">
                  <div className="col s12">
                    <div className="primary-text">{localize("About.about_programm", locale)}</div>
                  </div>
                </div>
                <div className="col s6">
                  <div className="caption-text">{localize("About.AppVersion", locale)}</div>
                  <div className="primary-text">{`${localize("About.product_NAME", locale)} ${localize("About.version", locale)}`}</div>
                </div>
                <div className="col s6">
                  <div className="caption-text">{localize("About.developer", locale)}</div>
                  <div className="primary-text">{localize("About.company_name", locale)},  {localize("About.address", locale)}</div>
                  <h6 className="contact-text"></h6>
                  <div className="mail-block">
                    <div className="contact-icon"><i className="mail_contact_icon"></i></div>
                    <div className="h6 text-center"><a href="mailto:info@trusted.ru">{localize("About.info", locale)}</a></div>
                  </div>
                </div>
                <div className="row" />
                <div className="col s6">
                </div>
                <div className="col s6">
                  <div className="caption-text">{localize("About.support", locale)}</div>
                  <div className="mail-block">
                    <div className="contact-icon"><i className="mail_contact_icon"></i></div>
                    <div className="h6 text-center"><a href="mailto:support@trusted.ru">support@trusted.ru</a></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col s4 rightcol">
            <div className="row halfbottom" />
            <div className="col s12">
              <div className="primary-text">Управление лицензией КриптоАРМ ГОСТ</div>
              <hr />
              <div className="row" >
                <div className="col s6 waves-effect waves-cryptoarm hover_outline" onClick={this.showModalLicenseSetup}>
                  <div className="col s12 svg_icon">
                    <a data-position="bottom">
                      <i className="material-icons license install" />
                    </a>
                  </div>
                  <div className="col s12 svg_icon_text">{localize("License.enter_key", locale)}</div>
                </div>
                <div className="col s6 waves-effect waves-cryptoarm hover_outline" onClick={() => this.gotoLink(localize("License.link_buy_license", locale))}>
                  <div className="col s12 svg_icon">
                    <a data-position="bottom">
                      <i className="material-icons license buy" />
                    </a>
                  </div>
                  <div className="col s12 svg_icon_text">{localize("License.buy_license", locale)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {this.getModalLicenseSetup()}
      </div>
    );
  }

  getCPCSPVersionPKZI = () => {
    try {
      return trusted.utils.Csp.getCPCSPVersion() + "." + trusted.utils.Csp.getCPCSPVersionPKZI();
    } catch (e) {
      return "";
    }
  }

  getCPCSPVersionSKZI = () => {
    try {
      return trusted.utils.Csp.getCPCSPVersion() + "." + trusted.utils.Csp.getCPCSPVersionSKZI() + " " + trusted.utils.Csp.getCPCSPSecurityLvl();
    } catch (e) {
      return "";
    }
  }

  getLicense = () => {
    try {
      return trusted.utils.Csp.getCPCSPLicense();
    } catch (e) {
      return "-";
    }
  }

  getLicenseStatus = () => {
    try {
      return trusted.utils.Csp.checkCPCSPLicense();
    } catch (e) {
      return false;
    }
  }

  gotoLink = (address: string) => {
    window.electron.shell.openExternal(address);
  }

  getModalLicenseCSPSetup = () => {
    const { localize, locale } = this.context;
    const { showModalLicenseCSPSetup } = this.state;

    if (!showModalLicenseCSPSetup) {
      return;
    }

    return (
      <Modal
        isOpen={showModalLicenseCSPSetup}
        header={localize("License.enter_key_csp", locale)}
        onClose={() => {
          this.closeModalLicenseCSPSetup();
          this.forceUpdate();
        }}
        style={{  width: "600px" }}
      >

        <LicenseCSPSetup onCancel={this.closeModalLicenseCSPSetup} />
      </Modal>
    );
  }

  getModalLicenseTSPSetup = () => {
    const { localize, locale } = this.context;
    const { showModalLicenseTSPSetup } = this.state;

    if (!showModalLicenseTSPSetup) {
      return;
    }

    return (
      <Modal
        isOpen={showModalLicenseTSPSetup}
        header={localize("License.enter_key_tsp", locale)}
        onClose={() => {
          this.closeModalLicenseTSPSetup();
          this.forceUpdate();
        }}
        style={{ height: "210px", width: "600px" }}
      >

        <LicenseTSPSetup onCancel={this.closeModalLicenseTSPSetup} />
      </Modal>
    );
  }

  getModalLicenseOCSPSetup = () => {
    const { localize, locale } = this.context;
    const { showModalLicenseOCSPSetup } = this.state;

    if (!showModalLicenseOCSPSetup) {
      return;
    }

    return (
      <Modal
        isOpen={showModalLicenseOCSPSetup}
        header={localize("License.enter_key_ocsp", locale)}
        onClose={() => {
          this.closeModalLicenseOCSPSetup();
          this.forceUpdate();
        }}
        style={{ height: "210px", width: "600px" }}
      >

        <LicenseOCSPSetup onCancel={this.closeModalLicenseOCSPSetup} />
      </Modal>
    );
  }

  getModalLicenseSetup = () => {
    const { localize, locale } = this.context;
    const { showModalLicenseSetup } = this.state;

    if (!showModalLicenseSetup) {
      return;
    }

    return (
      <Modal
        isOpen={showModalLicenseSetup}
        header={localize("License.enter_key", locale)}
        onClose={() => {
          this.closeModalLicenseSetup();
          this.forceUpdate();
        }}
        style={{ height: "310px", width: "600px" }}
      >

        <LicenseSetupModal text_info={localize("License.entered_the_key", locale)} icon="" onCancel={this.closeModalLicenseSetup} />
      </Modal>
    );
  }

  showModalLicenseCSPSetup = () => {
    this.setState({ showModalLicenseCSPSetup: true });
  }

  closeModalLicenseCSPSetup = () => {
    this.setState({ showModalLicenseCSPSetup: false });
  }

  showModalLicenseTSPSetup = () => {
    this.setState({ showModalLicenseTSPSetup: true });
  }

  closeModalLicenseTSPSetup = () => {
    this.setState({ showModalLicenseTSPSetup: false });
  }

  showModalLicenseOCSPSetup = () => {
    this.setState({ showModalLicenseOCSPSetup: true });
  }

  closeModalLicenseOCSPSetup = () => {
    this.setState({ showModalLicenseOCSPSetup: false });
  }

  showModalLicenseSetup = () => {
    this.setState({ showModalLicenseSetup: true });
  }

  closeModalLicenseSetup = () => {
    this.setState({ showModalLicenseSetup: false });
  }
}

export default AboutWindow;

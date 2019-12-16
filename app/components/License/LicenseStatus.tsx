import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import LicenseInfoField from "./LicenseInfoField";

interface IButtonWithExternalLinkProps {
  externalLink: string;
  externalName: string;
}

class ButtonWithExternalLink extends React.Component<IButtonWithExternalLinkProps, {}> {
  render() {
    const { externalName, externalLink } = this.props;

    return (
      <span>
        <a className="waves-effect waves-light btn" target="_blank" onClick={(event: any) => this.gotoLink(externalLink)}>
          {externalName}
        </a>
      </span>
    );
  }

  gotoLink = (address: string) => {
    window.electron.shell.openExternal(address);
  }
}

interface ILicenseModel {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  jti: string;
  sub: string;
}

interface ILicenseStatusProps {
  data: string;
  license: ILicenseModel;
  loaded: boolean;
  loading: boolean;
  status: number;
  lic_format: string;
}

// tslint:disable-next-line:max-classes-per-file
class LicenseStatus extends React.Component<ILicenseStatusProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: ILicenseStatusProps) {
    super(props);
  }

  render() {
    const { localize, locale } = this.context;


    const { license, status, lic_format, lic_error } = this.props;

    const settings = {
      draggable: false,
    };

    let style: any;
    let styleRow: any;
    let viewStatus = "incorrect";
    let messageStatus = "";
    let messageExpired = "";

    const dateExp = new Date(license.exp * 1000).getTime();
    const dateNow = new Date().getTime();
    const dateDif = dateExp - dateNow;
    const fullDays = Math.round(dateDif / (24 * 3600 * 1000));

    if (lic_format === "NONE") {
      viewStatus = "incorrect";
      messageExpired = localize("License.failed_key_find", locale);
    }
    if (lic_format === "TRIAL") {
      if (status) {
        viewStatus = "correct";
        messageStatus = localize("License.License_overtimes", locale);
        messageExpired = localize("License.lic_key_correct", locale) + fullDays + ")";
      } else {
        viewStatus = "incorrect";
        messageStatus = localize("License.License_overtimes", locale);
        messageExpired = localize("License.license_overtimes_expired", locale);
      }
    } else if (lic_format === "dlv") {
      if (status && lic_error !== 903 && lic_error !== 907) {
        viewStatus = "correct";
        if (license.exp == 0) {
          messageExpired = localize("License.lic_key_correct_unlimited", locale);
        } else {
          messageExpired = localize("License.lic_key_correct", locale) + fullDays + ")";
        }
      } else {
        viewStatus = "incorrect";
        messageExpired = localize("License.lic_key_uncorrect", locale);
      }
    } else if (lic_format === "JWT") {
      if (status && lic_error !== 903 && lic_error !== 907) {
        viewStatus = "correct";
        let year = (new Date(dateExp)).getFullYear();
        if (year === 1970 || year >= 2037) messageExpired = localize("License.lic_key_correct_unlimited", locale);
        else messageExpired = localize("License.lic_key_correct", locale) + fullDays + ")";
      } else {
        viewStatus = "incorrect";
        messageExpired = localize("License.lic_key_uncorrect", locale);
      }
    }

    if (viewStatus === "correct") {
      style = { color: "#4caf50" };
      return (
          <React.Fragment>
            <div className="caption-text">{localize("License.lic_status", locale)}</div>
            <div className="desktoplic_text_item topitem" style={{color: "green"}}>{messageStatus}</div>
            <LicenseInfoField info={messageExpired} style={style} />
          </React.Fragment>

      );
    } else {
      style = { color: "red" };
      return (
          <React.Fragment>
            <div className="caption-text">{localize("License.lic_status", locale)}</div>
            <div className="desktoplic_text_item topitem" style={style}>{messageStatus}</div>
            <LicenseInfoField info={messageExpired} style={style} />
          </React.Fragment>
      );
    }
  }
}

export default connect((state) => {
  return {
    data: state.license.data,
    lic_error: state.license.lic_error,
    lic_format: state.license.lic_format,
    license: state.license.info,
    loaded: state.license.loaded,
    loading: state.license.loading,
    status: state.license.status,
  };
}, {}, null, { pure: false })(LicenseStatus);

import * as crypto_module from "crypto";
import * as fs from "fs";
import * as npath from "path";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { loadLicense } from "../../AC/licenseActions";
import { DEFAULT_PATH, LICENSE_PATH, LICENSE_REGISTRY_PATH, LicenseManager, PLATFORM } from "../../constants";
import * as jwt from "../../trusted/jwt";
import HeaderWorkspaceBlock from "../HeaderWorkspaceBlock";
const dialog = window.electron.remote.dialog;

interface ILicenseSetupModalProps {
  closeWindow: () => void;
  loadLicense: () => void;
  onCancel?: () => void;
}

interface ILicenseSetupModalState {
  license_file: string;
  license_key: string;
}

class LicenseSetupModal extends React.Component<ILicenseSetupModalProps, ILicenseSetupModalState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: ILicenseSetupModalProps) {
    super(props);

    this.state = ({
      license_file: "",
      license_key: "",
    });
  }

  componentDidMount() {
    $("input#input_file, textarea#input_key").characterCounter();
  }

  componentWillUnmount() {
    this.handelCancel();
  }

  paste() {
    $("#input_key").focus();
    document.execCommand("paste");
    $("#input_key").trigger("autoresize");
  }

  setupLicense = () => {
    const { localize, locale } = this.context;
    const { license_key, license_file } = this.state;
    // tslint:disable-next-line:no-shadowed-variable
    const { loadLicense } = this.props;

    const path = npath.dirname(LICENSE_PATH);
    const options = {
      name: "CryptoARM GOST",
    };

    let command = "";

    if (PLATFORM !== "win32") {
      command = "sh -c " + "\"";
      command = command + "mkdir -p " + "'" + path + "'" + " && ";
    }

    let key;

    if (license_key) {
      key = license_key;
    } else if (fs.existsSync(license_file)) {
      const licFileContent: string = fs.readFileSync(license_file, "utf8");

      if (licFileContent) {
        key = licFileContent.trim();
      } else {
        $(".toast-read_file_error").remove();
        Materialize.toast(localize("Common.read_file_error", locale), 2000, "toast-read_file_error");
      }
    } else {
      $(".toast-lic_file_not_found").remove();
      Materialize.toast(localize("License.lic_file_not_found", locale), 2000, "toast-lic_file_not_found");
    }

    if (!key) {
      $(".toast-lic_key_uncorrect").remove();
      Materialize.toast(localize("License.lic_key_uncorrect", locale), 2000, "toast-lic_key_uncorrect");
    } else {
      if (jwt.checkLicense(key)) {
        if (PLATFORM === "win32") {
          command = "reg add \"" + LICENSE_REGISTRY_PATH + "\" /v license /t REG_SZ /f /d " + key.trim();
        } else {
          command = command + " printf " + key.trim() + " > " + "'" + LICENSE_PATH + "'" + " && ";
          command = command + " chmod 777 " + "'" + LICENSE_PATH + "'" + "\"";
        }

        try {
          LicenseManager.addLicense(key);
        } catch (e) {
          console.log("LicenseManager error", e);
        }

        window.sudo.exec(command, options, function (error: any) {
          if (!error) {
            loadLicense();

            $(".toast-lic_key_setup").remove();
            Materialize.toast(localize("License.lic_key_setup", locale), 2000, "toast-lic_key_setup");
          } else {
            $(".toast-write_file_error").remove();
            Materialize.toast(localize("Common.write_file_error", locale), 2000, "toast-write_file_error");
          }
        });
      } else {
        $(".toast-lic_key_uncorrect").remove();
        Materialize.toast(localize("License.lic_key_uncorrect", locale), 2000, "toast-lic_key_uncorrect");
      }
    }

    this.handelCancel();
  }

  openLicenseFile() {
    const { localize, locale } = this.context;

    if (!window.framework_NW) {
      const file = dialog.showOpenDialogSync({
        filters: [
          { name: localize("License.license", locale), extensions: ["lic"] },
        ],
        properties: ["openFile"],
      });
      if (file) {
        $("#input_file").focus();
        this.setState({ license_file: file[0], license_key: this.state.license_key });
      }
    }
  }

  render() {
    const { localize, locale } = this.context;
    const self = this;
    const disable = this.state.license_file || this.state.license_key ? "" : "disabled";

    return (
      <React.Fragment>
        <div className="row halftop">
          <div className="col s12">
            <div className="content-wrapper tbody border_group">
              <div className="row halfbottom" />
              <div className="col s12">
                <div className="input-field col s12 input-field-licence">
                  <i className="material-icons prefix key-prefix" style={{ left: "-10px" }}>vpn_key</i>
                  <input id="input_key" type="text" value={this.state.license_key} onChange={function (e: any) {
                    self.setState({ license_file: self.state.license_file, license_key: e.target.value });
                  }} />
                  <label htmlFor="input_key">{localize("License.entered_the_key", locale)}</label>
                  <a onClick={this.paste.bind(this)}>
                    <i className="file-setting-item waves-effect material-icons secondary-content pulse active">content_copy</i>
                  </a>
                </div>
              </div>
              <div className="col s12 or">
                {localize("Common.or", locale)}
                <div className="row halfbottom" />
              </div>
              <div className="col s12">
                <div className="input-field col s12 input-field-licence">
                  <i className="material-icons prefix key-prefix" style={{ left: "-10px" }}>vpn_key</i>
                  <input id="input_file" type="text" value={this.state.license_file} onChange={function (e: any) {
                    self.setState({ license_file: e.target.value, license_key: self.state.license_key });
                  }} />
                  <label htmlFor="input_file">{localize("License.lic_file_choose", locale)}</label>
                  <a onClick={this.openLicenseFile.bind(this)}>
                    <i className="file-setting-item waves-effect material-icons secondary-content pulse active">insert_drive_file</i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row halfbottom" />

        <div className="row halfbottom">
          <div style={{ float: "right" }}>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a className="btn btn-text waves-effect waves-light modal-close" onClick={this.handelCancel}>{localize("Common.cancel", locale)}</a>
            </div>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a className={"btn btn-outlined waves-effect waves-light modal-close " + disable} onClick={this.setupLicense}>{localize("Common.apply", locale)}</a>
            </div>
          </div>
        </div>

      </React.Fragment>
    );
  }

  handelCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }
  }
}

export default connect((state) => {
  return {
    loading: state.license.loading,
  };
}, { loadLicense })(LicenseSetupModal);

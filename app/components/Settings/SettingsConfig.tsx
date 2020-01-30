import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import {
  deleteRecipient, selectSignerCertificate,
} from "../../AC";
import {
  applySettings,
} from "../../AC/settingsActions";
import {
  DEFAULT_DOCUMENTS_PATH,
  LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT,
  LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE,
} from "../../constants";
import { loadingRemoteFilesSelector } from "../../selectors";
import { mapToArr } from "../../utils";
import CheckBoxWithLabel from "../CheckBoxWithLabel";
import EncodingTypeSelector from "../EncodingTypeSelector";
import RecipientsList from "../RecipientsList";
import SelectFolder from "../SelectFolder";
import SignatureTypeSelector from "../Signature/SignatureTypeSelector";
import SignerInfo from "../Signature/SignerInfo";

const dialog = window.electron.remote.dialog;

interface ISettingsWindowState {
  settings: any;
}

class SettingsWindow extends React.Component<any, ISettingsWindowState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);

    this.state = {
      settings: props.settings,
    };
  }

  componentDidMount() {
    $(".btn-floated, .nav-small-btn").dropdown({
      alignment: "left",
      belowOrigin: false,
      gutter: 0,
      inDuration: 300,
      outDuration: 225,
    });

    Materialize.updateTextFields();
  }

  render() {
    const { localize, locale } = this.context;
    const { recipients, signer } = this.props;
    const { settings } = this.state;

    const disabled = this.getDisabled();
    const classDisabled = disabled ? "disabled" : "";

    let encoding = settings.sign.encoding;
    const isDetached = settings.sign.detached;

    if (signer && signer.service && encoding !== "BASE-64") {
      encoding = "BASE-64";
    }

    return (
      <div className="content-noflex">
        <div className="row">
          <div className="col s8 leftcol">
            <div className="row">

              <div className="row halfbottom" />

              <div className="row">
                <div className="col s12">
                  <div className="headline6">
                    {localize("Settings.general", locale)}
                  </div>
                  <hr />
                </div>

                <div className="col s12">
                  <div className="row settings-content">
                    <div className="col s12 m12 l6">
                      <CheckBoxWithLabel
                        disabled={disabled}
                        onClickCheckBox={this.handleSaveToDocumentsClick}
                        isChecked={settings.saveToDocuments}
                        elementId="saveToDocuments"
                        title={localize("Documents.save_to_documents", locale)} />
                    </div>
                    <div className="col s12 m12 l6">
                      <SelectFolder
                        disabled={disabled}
                        directory={settings.saveToDocuments ? DEFAULT_DOCUMENTS_PATH : settings.outfolder}
                        viewDirect={this.handleOutfolderChange}
                        openDirect={this.addDirect.bind(this)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col s12">
                  <div className="headline6">
                    {localize("Sign.sign_setting", locale)}
                    <hr />
                  </div>
                </div>

                <div className="col s12">
                  <div className="row settings-content">
                    <div className="col s12 m12 l6">
                      <SignatureTypeSelector
                        detached={isDetached}
                        handleChange={this.handleDetachedChange}
                        disabled={signer && signer.service} />

                      <EncodingTypeSelector
                        EncodingValue={encoding}
                        handleChange={this.handleEncodingChange}
                        disabled={signer && signer.service} />
                    </div>
                    <div className="col s12 m12 l6">
                      <CheckBoxWithLabel
                        disabled={disabled}
                        onClickCheckBox={this.handleTimestampOnSignClick}
                        isChecked={settings.sign.timestamp_on_sign}
                        elementId="detached-sign"
                        title={localize("Cades.set_timestamp_on_sign", locale)} />
                    </div>
                    <div className="col s12 m12 l6">
                      <CheckBoxWithLabel onClickCheckBox={this.handleTimestampClick}
                        disabled={disabled || (signer && signer.service)}
                        isChecked={settings.sign.timestamp_on_data || (signer && signer.service)}
                        elementId="sign-time"
                        title={localize("Cades.set_timestamp_on_data", locale)} />
                    </div>
                  </div>

                  <div className="row nobottom">
                    <div className="col s11">
                      <div className="primary-text">{localize("Sign.signer_cert", locale)}</div>
                      <hr />
                    </div>
                    <div className="col s1">
                      <a className="btn-floated" data-activates="dropdown-btn-signer">
                        <i className="file-setting-item waves-effect material-icons secondary-content">more_vert</i>
                      </a>
                      <ul id="dropdown-btn-signer" className="dropdown-content">
                        <Link to={LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE}>
                          <li><a>Заменить</a></li>
                        </Link>
                        <li><a onClick={() => this.props.selectSignerCertificate(0)}>{localize("Common.clear", locale)}</a></li>
                      </ul>
                    </div>
                    {
                      (signer) ? <SignerInfo signer={signer} /> :
                        <div className="col s12 right-align">
                          <Link to={LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE}>
                            <a className="btn btn-outlined waves-effect waves-light" style={{ width: "100%", maxWidth: "505px" }}>
                              {localize("Settings.Choose", locale)}
                            </a>
                          </Link>
                        </div>
                    }
                  </div>
                </div>
              </div>

              <div className="row" />

              <div className={`row ${classDisabled}`}>
                <div className="col s12">
                  <div className="headline6">
                    {localize("Encrypt.encrypt_setting", locale)}
                  </div>
                  <hr />
                </div>

                <div className="col s12">
                  <div className="row settings-content">
                    <div className="col s12 m12 l6">
                      <EncodingTypeSelector
                        EncodingValue={settings.encrypt.encoding}
                        handleChange={this.handleEncryptEncodingChange}
                      />
                    </div>
                    <div className="col s12 m12 l6">
                      <CheckBoxWithLabel
                        disabled={disabled}
                        onClickCheckBox={this.handleDeleteClick}
                        isChecked={settings.encrypt.delete}
                        elementId="delete_files"
                        title={localize("Encrypt.delete_files_after", locale)} />
                    </div>
                    <div className="col s12 m12 l6">
                      <CheckBoxWithLabel
                        disabled={disabled}
                        onClickCheckBox={this.handleArchiveClick}
                        isChecked={settings.encrypt.archive}
                        elementId="archive_files"
                        title={localize("Encrypt.archive_files_before", locale)} />
                    </div>
                  </div>
                </div>

                <div className="row" />

                <div className="col s12">
                  <div className="col s10">
                    <div className="primary-text">Сертификаты шифрования:</div>
                    <hr />
                  </div>
                  <div className="col s2 settings-content">
                    <div className="right import-col">
                      <a className="btn-floated" data-activates="dropdown-btn-encrypt">
                        <i className="file-setting-item waves-effect material-icons secondary-content">more_vert</i>
                      </a>
                      <ul id="dropdown-btn-encrypt" className="dropdown-content">
                        <Link to={LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT}>
                          <li><a>{localize("Settings.add", locale)}</a></li>
                        </Link>
                        <li><a onClick={() => this.handleCleanRecipientsList()}>{localize("Common.clear", locale)}</a></li>
                      </ul>
                    </div>
                  </div>

                  {
                    (recipients && recipients.length) ?
                      <div className="col s12">
                        <RecipientsList recipients={recipients} handleRemoveRecipient={(recipient) => this.props.deleteRecipient(recipient.id)} />
                      </div> :
                      <div className="col s12 right-align">
                        <Link to={LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT}>
                          <a className={`btn btn-outlined waves-effect waves-light ${classDisabled}`}
                            style={{ width: "100%", maxWidth: "505px" }}>
                            {localize("Settings.Choose", locale)}
                          </a>
                        </Link>
                      </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="col s4 rightcol">
            <div className="row halfbottom" />
            <div className="row fixed-bottom-rightcolumn">
              <div className="col s6 offset-s1">
                <a className="btn btn-text waves-effect waves-light" onClick={this.props.history.goBack}>
                  ОТМЕНА
                </a>
              </div>
              <div className="col s2">
                <a className="btn btn-outlined waves-effect waves-light" onClick={this.applySettings}>
                  СОХРАНИТЬ
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  addDirect() {
    const { settings } = this.state;

    if (!window.framework_NW) {
      const directory = dialog.showOpenDialog({ properties: ["openDirectory"] });
      if (directory) {
        this.setState({
          settings: settings
            .setIn(["outfolder"], directory[0]),
        });
      }
    } else {
      const clickEvent = document.createEvent("MouseEvents");
      clickEvent.initEvent("click", true, true);
      document.querySelector("#choose-folder").dispatchEvent(clickEvent);
    }
  }

  applySettings = () => {
    const { settings } = this.state;
    // tslint:disable-next-line:no-shadowed-variable
    const { applySettings } = this.props;

    applySettings(settings);

    this.props.history.goBack();
  }

  getDisabled = () => {
    const { files, loadingFiles } = this.props;

    if (loadingFiles && loadingFiles.length) {
      return true;
    }

    if (files && files.length) {
      for (const file of files) {
        if (file.socket) {
          return true;
        }
      }
    }

    return false;
  }

  handleInputNameChange = (ev: any) => {
    const { settings } = this.state;

    this.setState({
      settings: settings
        .setIn(["name"], ev.target.value),
    });
  }

  handleOutfolderChange = (ev: any) => {
    const { settings } = this.state;

    this.setState({
      settings: settings
        .setIn(["outfolder"], ev.target.value),
    });
  }

  handleDetachedChange = (detached: boolean) => {
    const { settings } = this.state;

    this.setState({
      settings: settings
        .setIn(["sign", "detached"], detached),
    });
  }

  handleTimestampClick = () => {
    const { settings } = this.state;

    this.setState({
      settings: settings
        .setIn(["sign", "timestamp_on_data"], !settings.sign.timestamp_on_data),
    });
  }

  handleTimestampOnSignClick = () => {
    const { settings } = this.state;

    this.setState({
      settings: settings
        .setIn(["sign", "timestamp_on_sign"], !settings.sign.timestamp_on_sign),
    });
  }

  handleSaveToDocumentsClick = () => {
    const { settings } = this.state;
    const directory = !settings.saveToDocuments ? DEFAULT_DOCUMENTS_PATH : settings.outfolder
    this.setState({
      settings: settings
        .setIn(["outfolder"], directory)
        .setIn(["saveToDocuments"], !settings.saveToDocuments),

    });

  }

  handleEncodingChange = (encoding: string) => {
    const { settings } = this.state;

    this.setState({
      settings: settings
        .setIn(["sign", "encoding"], encoding),
    });
  }

  handleEncryptEncodingChange = (encoding: string) => {
    const { settings } = this.state;

    this.setState({
      settings: settings
        .setIn(["encrypt", "encoding"], encoding),
    });
  }

  handleDeleteClick = () => {
    const { settings } = this.state;

    this.setState({
      settings: settings
        .setIn(["encrypt", "delete"], !settings.encrypt.delete),
    });
  }

  handleArchiveClick = () => {
    const { settings } = this.state;

    this.setState({
      settings: settings
        .setIn(["encrypt", "archive"], !settings.encrypt.archive),
    });
  }

  handleCleanRecipientsList = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { deleteRecipient, recipients } = this.props;

    recipients.forEach((recipient) => deleteRecipient(recipient.id));
  }
}

export default connect((state) => {
  return {
    files: mapToArr(state.files.entities),
    loadingFiles: loadingRemoteFilesSelector(state, { loading: true }),
    recipients: mapToArr(state.settings.getIn(["entities", state.settings.active]).encrypt.recipients)
      .map((recipient) => state.certificates.getIn(["entities", recipient.certId]))
      .filter((recipient) => recipient !== undefined),
    settings: state.settings.getIn(["entities", state.settings.active]),
    signer: state.certificates.getIn(["entities", state.settings.getIn(["entities", state.settings.active]).sign.signer]),
  };
}, { applySettings, deleteRecipient, selectSignerCertificate })(SettingsWindow);

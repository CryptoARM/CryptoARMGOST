import * as fs from "fs";
import { OrderedMap } from "immutable";
import * as path from "path";
import PropTypes, { any } from "prop-types";
import React from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import {
  activeFile, deleteFile, deleteRecipient,
  filePackageDelete, filePackageSelect, packageReSign, packageSign,
  selectFile, selectSignerCertificate, verifyCertificate,
  verifySignature,
} from "../../AC";
import { IFile } from "../../AC";
import { documentsReviewed } from "../../AC/documentsActions";
import {
  activeSetting, changeDefaultSettings, deleteSetting, saveSettings,
} from "../../AC/settingsActions";
import {
  DECRYPT, ENCRYPT, GOST_28147, GOST_R3412_2015_K, GOST_R3412_2015_M, HOME_DIR,
  LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT, LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE,
  LOCATION_SETTINGS_CONFIG,
  LOCATION_SETTINGS_SELECT, REMOVE, SIGN, UNSIGN, USER_NAME, VERIFY,
} from "../../constants";
import { DEFAULT_ID, ISignParams } from "../../reducer/settings";
import { activeFilesSelector, connectedSelector, loadingRemoteFilesSelector } from "../../selectors";
import { DECRYPTED, ENCRYPTED, ERROR, SIGNED, UPLOADED } from "../../server/constants";
import * as trustedEncrypts from "../../trusted/encrypt";
import * as jwt from "../../trusted/jwt";
import { checkLicense } from "../../trusted/jwt";
import * as signs from "../../trusted/sign";
import * as trustedSign from "../../trusted/sign";
import { bytesToSize, dirExists, fileCoding, fileNameForResign, fileNameForSign, mapToArr } from "../../utils";
import { fileExists } from "../../utils";
import logger from "../../winstonLogger";
import CheckBoxWithLabel from "../CheckBoxWithLabel";
import Modal from "../Modal";
import RecipientsList from "../RecipientsList";
import AllSettings from "../Settings/AllSettings";
import AskSaveSetting from "../Settings/AskSaveSetting";
import RenameSettings from "../Settings/RenameSettings";
import SaveSettings from "../Settings/SaveSettings";
import SettingsSelector from "../Settings/SettingsSelector";
import SignerInfo from "../Signature/SignerInfo";

const dialog = window.electron.remote.dialog;

interface ISignatureAndEncryptRightColumnSettingsProps {
  activeFilesArr: any;
  isDefaultFilters: boolean;
  isDocumentsReviewed: boolean;
  changeDefaultSettings: (id: string) => void;
  loadingFiles: any;
  files: any;
  packageSignResult: any;
  removeAllFiles: () => void;
  signatures: any;
  signedPackage: any;
  tokensAuth: any;
  users: any;
  saveSettings: () => void;
}

interface ISignatureAndEncryptRightColumnSettingsState {
  allSettingsMaunted: boolean;
  currentOperation: string;
  pinCode: string;
  saveSettingsWithNewName: boolean;
  searchValue: string;
  showModalAskSaveSetting: boolean;
  showModalRenameParams: boolean;
  showModalSaveParams: boolean;
}

class SignatureAndEncryptRightColumnSettings extends React.Component<ISignatureAndEncryptRightColumnSettingsProps, ISignatureAndEncryptRightColumnSettingsState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: ISignatureAndEncryptRightColumnSettingsProps) {
    super(props);

    this.state = {
      allSettingsMaunted: false,
      currentOperation: "",
      pinCode: "",
      saveSettingsWithNewName: false,
      searchValue: "",
      showModalAskSaveSetting: false,
      showModalRenameParams: false,
      showModalSaveParams: false,
    };
  }

  componentWillMount() {
    this.props.activeSetting(this.props.setting.id);
  }

  componentDidMount() {
    $(".btn-floated").dropdown();

    $(".collapsible").collapsible();

    $(document).ready(() => {
      $("select").material_select();
    });

    $(ReactDOM.findDOMNode(this.refs.settingsSelectRef)).on("change", this.handleChangeDefaultSettings);
  }

  componentDidUpdate(prevProps: ISignatureAndEncryptRightColumnSettingsProps, prevState: ISignatureAndEncryptRightColumnSettingsState) {
    if (prevProps.setting.id !== this.props.setting.id) {
      $(".btn-floated").dropdown();
    }
  }

  render() {
    const { localize, locale } = this.context;
    const { activeFiles, isDocumentsReviewed, recipients, setting, settings, signer } = this.props;
    const { file, saveSettingsWithNewName } = this.state;

    const disabledNavigate = this.isFilesFromSocket();
    const classDisabled = disabledNavigate ? "disabled" : "";

    return (
      <React.Fragment>
        <div style={{ height: "calc(100vh - 150px)" }}>
          <div className="add-certs">
            <div className="col s10">
              <div className="subtitle">Параметры операций</div>
              <hr />
            </div>
            <div className="col s2">
              <div className="right import-col">
                <a className="btn-floated" data-activates="dropdown-btn-settings">
                  <i className="file-setting-item waves-effect material-icons secondary-content">more_vert</i>
                </a>
                <ul id="dropdown-btn-settings" className="dropdown-content">
                <li>
                    <a onClick={this.handleShowModalRenameParams}>
                      {localize("Common.rename", locale)}
                    </a>
                  </li>
                  <li>
                    <a onClick={() => this.props.deleteSetting(setting.id)}>
                      {localize("Common.delete", locale)}
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col s12 valign-wrapper">
              <div className="col s2">
                <div className="setting_color" />
              </div>
              <div className="col s10" style={{ fontSize: "75%" }}>
                <SettingsSelector
                  value={setting.id}
                  handleChange={this.handleChangeDefaultSettings}
                  showModalAskSaveSetting={this.handleShowModalAskSaveSetting}
                  disabled={false}
                  setting={setting}
                  settings={settings} />
              </div>
            </div>

            <div className="row" />

            {
              setting.changed ?
                <React.Fragment>
                  <div className="col s12">
                    <CheckBoxWithLabel
                      disabled={false}
                      onClickCheckBox={this.toggleSaveSettingsWithNewName}
                      isChecked={saveSettingsWithNewName}
                      elementId="new_time"
                      title={"Сохранить параметры с новым именем"} />
                  </div>

                  <div className="row" />

                  <div className="col s12">
                    <a className="btn btn-outlined waves-effect waves-light"
                      onClick={this.handleSaveSettings}
                      style={{ width: "100%" }}>
                      {localize("Settings.save", locale)}
                    </a>
                  </div>

                  <div className="row" />
                </React.Fragment>
                : null
            }

            <div className="col s10">
              <div className="subtitle">{localize("Sign.signer_cert", locale)}</div>
              <hr />
            </div>
            <div className="col s2">
              <div className="right import-col">
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
            </div>
            {
              (signer) ? <SignerInfo signer={signer} /> :
                <div className="col s12">
                  <Link to={LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE}>
                    <a className="btn btn-outlined waves-effect waves-light"
                      style={{ width: "100%" }}>
                      {localize("Settings.Choose", locale)}
                    </a>
                  </Link>
                </div>
            }
            <div className="row" />

            <div className="col s10">
              <div className="subtitle">Сертификаты шифрования</div>
              <hr />
            </div>

            <div className={`col s2 ${classDisabled}`}>
              <div className="right import-col">
                <a className="btn-floated" data-activates="dropdown-btn-encrypt">
                  <i className={`file-setting-item waves-effect material-icons secondary-content ${classDisabled}`}>more_vert</i>
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
                <div className={`col s12 ${classDisabled}`}>
                  <RecipientsList
                    disabled={disabledNavigate}
                    recipients={recipients}
                    handleRemoveRecipient={(recipient) => this.props.deleteRecipient(recipient.id)}
                  />
                </div> :
                <div className={`col s12 ${classDisabled}`}>
                  <Link to={LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT}>
                    <a className={`btn btn-outlined waves-effect waves-light ${classDisabled}`}
                      style={{ width: "100%" }}>
                      {localize("Settings.Choose", locale)}
                    </a>
                  </Link>
                </div>
            }

            <div className="row" />

            <div className="col s12">
              <ul className="collapsible params" data-collapsible="accordion">
                <li>
                  <div className="collapsible-header params" onClick={() => {
                    if (!this.state.allSettingsMaunted) {
                      this.setState({ allSettingsMaunted: true });
                    }

                    $(document).ready(() => {
                      setTimeout(() => {
                        $(".select-dropdown:eq(0)").css("border-bottom", "none");
                        $(".select-dropdown:eq(0)").css("margin", "0");
                        $(".select-dropdown:eq(0)").css("height", "2rem");
                      }, 0);
                    });
                  }
                  }>
                    <i className="material-icons right">expand_more</i>
                    Параметры
                  </div>
                  <div className="collapsible-body params">
                    {
                      this.state.allSettingsMaunted ? < AllSettings /> : null
                    }

                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="row fixed-bottom-rightcolumn" >
          <div className="col s12">
            <hr />
          </div>

          {
            activeFiles && activeFiles.size ?
              <div className="col s12">
                <div className="input-checkbox">
                  <input
                    name={"filesview"}
                    type="checkbox"
                    id={"filesview"}
                    className="filled-in"
                    checked={isDocumentsReviewed}
                    onClick={this.toggleDocumentsReviewed}
                  />
                  <label htmlFor={"filesview"} className="truncate" style={{ fontSize: "0.875rem" }}>
                    {localize("Sign.documents_reviewed", locale)}
                  </label>
                </div>
                <div className="row halfbottom" />
              </div> :
              null
          }

          {
            disabledNavigate ?
              this.props.method === "sign" ?
                <React.Fragment>
                  <div className={`col s4 waves-effect waves-cryptoarm ${this.checkEnableOperationButton(SIGN) ? "" : "disabled_docs"}`} onClick={this.handleClickSign}>
                    <div className="col s12 svg_icon">
                      <a data-position="bottom">
                        <i className="material-icons docmenu sign" />
                      </a>
                    </div>
                    <div className="col s12 svg_icon_text">{localize("Documents.docmenu_sign", locale)}</div>
                  </div>

                  <div className="col s4 waves-effect waves-cryptoarm" onClick={this.props.removeAllFiles}>
                    <div className="col s12 svg_icon">
                      <a data-position="bottom">
                        <i className="material-icons docmenu cancel" />
                      </a>
                    </div>
                    <div className="col s12 svg_icon_text">{localize("Common.cancel", locale)}</div>
                  </div>
                </React.Fragment>

                :

                <React.Fragment>
                  <div className={`col s4 waves-effect waves-cryptoarm  ${this.checkEnableOperationButton(VERIFY) ? "" : "disabled_docs"}`} onClick={this.verifySign}>
                    <div className="col s12 svg_icon">
                      <a data-position="bottom"
                        data-tooltip={localize("Sign.sign_and_verify", locale)}>
                        <i className="material-icons docmenu verifysign" />
                      </a>
                    </div>
                    <div className="col s12 svg_icon_text">{"Проверить"}</div>
                  </div>

                  <div className="col s4 waves-effect waves-cryptoarm" onClick={this.props.removeAllFiles}>
                    <div className="col s12 svg_icon">
                      <a data-position="bottom">
                        <i className="material-icons docmenu cancel" />
                      </a>
                    </div>
                    <div className="col s12 svg_icon_text">{localize("Common.cancel", locale)}</div>
                  </div>
                </React.Fragment>

              :

              <React.Fragment>
                <div className={`col s4 waves-effect waves-cryptoarm ${this.checkEnableOperationButton(SIGN) ? "" : "disabled_docs"}`} onClick={this.handleClickSign}>
                  <div className="col s12 svg_icon">
                    <a data-position="bottom">
                      <i className="material-icons docmenu sign" />
                    </a>
                  </div>
                  <div className="col s12 svg_icon_text">{localize("Documents.docmenu_sign", locale)}</div>
                </div>

                <div className={`col s4 waves-effect waves-cryptoarm  ${this.checkEnableOperationButton(VERIFY) ? "" : "disabled_docs"}`} onClick={this.verifySign}>
                  <div className="col s12 svg_icon">
                    <a data-position="bottom"
                      data-tooltip={localize("Sign.sign_and_verify", locale)}>
                      <i className="material-icons docmenu verifysign" />
                    </a>
                  </div>
                  <div className="col s12 svg_icon_text">{"Проверить"}</div>
                </div>

                <div className={`col s4 waves-effect waves-cryptoarm ${this.checkEnableOperationButton(UNSIGN) ? "" : "disabled_docs"}`} onClick={this.unSign}>
                  <div className="col s12 svg_icon">
                    <a data-position="bottom">
                      <i className="material-icons docmenu removesign" />
                    </a>
                  </div>
                  <div className="col s12 svg_icon_text">{localize("Documents.docmenu_removesign", locale)}</div>
                </div>

                <div className="col s12">
                  <div className="row halfbottom" />
                </div>

                <div className={`col s4 waves-effect waves-cryptoarm ${this.checkEnableOperationButton(ENCRYPT) ? "" : "disabled_docs"}`} onClick={this.encrypt}>
                  <div className="col s12 svg_icon">
                    <a data-position="bottom">
                      <i className="material-icons docmenu encrypt" />
                    </a>
                  </div>
                  <div className="col s12 svg_icon_text">{localize("Documents.docmenu_enctypt", locale)}</div>
                </div>

                <div className={`col s4 waves-effect waves-cryptoarm ${this.checkEnableOperationButton(DECRYPT) ? "" : "disabled_docs"}`} onClick={this.decrypt}>
                  <div className="col s12 svg_icon">
                    <a data-position="bottom">
                      <i className="material-icons docmenu decrypt" />
                    </a>
                  </div>
                  <div className="col s12 svg_icon_text">{localize("Documents.docmenu_dectypt", locale)}</div>
                </div>

                <div className={`col s4 waves-effect waves-cryptoarm ${this.checkEnableOperationButton(REMOVE) ? "" : "disabled_docs"}`} onClick={this.handleRemoveFiles}>
                  <div className="col s12 svg_icon">
                    <a data-position="bottom"
                      data-tooltip={localize("Sign.sign_and_verify", locale)}>
                      <i className="material-icons docmenu remove" />
                    </a>
                  </div>
                  <div className="col s12 svg_icon_text">{localize("Documents.docmenu_remove", locale)}</div>
                </div>
              </React.Fragment>
          }

        </div>
        {this.showModalSaveParams()}
        {this.showModalAskSaveSetting()}
        {this.showModalRenameParams()}
      </React.Fragment>
    );
  }

  showModalSaveParams = () => {
    const { localize, locale } = this.context;
    const { showModalSaveParams } = this.state;

    if (!showModalSaveParams) {
      return;
    }

    return (
      <Modal
        isOpen={showModalSaveParams}
        key="ShowModalSaveParams"
        header={localize("Settings.save", locale)}
        onClose={this.handleCloseModalSaveParams}
        style={{ width: "500px" }}>

        <SaveSettings
          onCancel={this.handleCloseModalSaveParams}
        />
      </Modal>
    );
  }

  showModalRenameParams = () => {
    const { localize, locale } = this.context;
    const { showModalRenameParams } = this.state;
    const { setting } = this.props;

    if (!showModalRenameParams) {
      return;
    }

    return (
      <Modal
        isOpen={showModalRenameParams}
        key="ShowModalRenameParams"
        header={localize("Settings.rename", locale)}
        onClose={this.handleCloseModalRenameParams}
        style={{ width: "500px" }}>

        <RenameSettings
          onCancel={this.handleCloseModalRenameParams}
          currentName={setting.name}
        />
      </Modal>
    );
  }

  showModalAskSaveSetting = () => {
    const { localize, locale } = this.context;
    const { showModalAskSaveSetting } = this.state;

    if (!showModalAskSaveSetting) {
      return;
    }

    return (
      <Modal
        isOpen={showModalAskSaveSetting}
        key="ShowModalAskSaveSetting"
        header={localize("Settings.save", locale)}
        onClose={this.handleCloseModalAskSaveSetting}
        style={{ width: "500px" }}>

        <AskSaveSetting
          onCancel={this.handleCloseModalAskSaveSetting}
        />
      </Modal>
    );
  }

  handleShowModalSaveParams = () => {
    this.setState({ showModalSaveParams: true });
  }

  handleCloseModalSaveParams = () => {
    this.setState({ showModalSaveParams: false });
  }

  handleShowModalRenameParams = () => {
    this.setState({ showModalRenameParams: true });
  }

  handleCloseModalRenameParams = () => {
    this.setState({ showModalRenameParams: false });
  }

  handleShowModalAskSaveSetting = () => {
    this.setState({ showModalAskSaveSetting: true });
  }

  handleCloseModalAskSaveSetting = () => {
    this.setState({ showModalAskSaveSetting: false });
  }

  toggleDocumentsReviewed = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { documentsReviewed, isDocumentsReviewed } = this.props;

    documentsReviewed(!isDocumentsReviewed);
  }

  toggleSaveSettingsWithNewName = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { saveSettingsWithNewName } = this.state;

    this.setState({ saveSettingsWithNewName: !saveSettingsWithNewName });
  }

  handleChangeDefaultSettings = (name: string) => {
    // tslint:disable-next-line: no-shadowed-variable
    const { activeSetting, changeDefaultSettings } = this.props;

    if (name && changeDefaultSettings) {
      changeDefaultSettings(name);
      activeSetting(name);
    }
  }

  handleSaveSettings = () => {
    const { saveSettingsWithNewName } = this.state;
    // tslint:disable-next-line: no-shadowed-variable
    const { saveSettings } = this.props;

    if (saveSettingsWithNewName) {
      this.handleShowModalSaveParams();
    } else {
      saveSettings();
    }
  }

  handleClickSign = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { activeFilesArr, signer, lic_error } = this.props;
    const { localize, locale } = this.context;
    const { pinCode } = this.state;

    const licenseStatus = checkLicense();

    if (licenseStatus !== true) {
      $(".toast-jwtErrorLicense").remove();
      Materialize.toast(localize(jwt.getErrorMessage(lic_error), locale), 5000, "toast-jwtErrorLicense");

      logger.log({
        level: "error",
        message: "No correct license",
        operation: "Подпись",
        operationObject: {
          in: "License",
          out: "Null",
        },
        userName: USER_NAME,
      });

      return;
    }

    if (activeFilesArr.length > 0) {
      const cert = window.PKISTORE.getPkiObject(signer);

      const filesForSign = [];
      const filesForResign = [];

      for (const file of activeFilesArr) {
        if (file.fullpath.split(".").pop() === "sig") {
          filesForResign.push(file);
        } else {
          filesForSign.push(file);
        }
      }

      if (filesForSign && filesForSign.length) {
        this.sign(filesForSign, cert);
      }

      if (filesForResign && filesForResign.length) {
        this.resign(filesForResign, cert);
      }

      this.setState({ pinCode: "" });
    }
  }

  sign = (files: IFile[], cert: any) => {
    const { signer, tokensAuth, users } = this.props;
    let { setting } = this.props;
    // tslint:disable-next-line:no-shadowed-variable
    const { packageSign } = this.props;
    const { localize, locale } = this.context;
    const { pinCode } = this.state;

    const isSockets = this.isFilesFromSocket();

    if (isSockets) {
      setting = setting.set("outfolder", "");
      setting = setting.setIn(["sign", "detached"], false);
      setting = setting.setIn(["sign", "time"], true);
    }

    if (files.length > 0) {
      const policies = ["noAttributes"];

      const folderOut = setting.outfolder;
      let format = trusted.DataFormat.PEM;
      if (setting.sign.encoding !== localize("Settings.BASE", locale)) {
        format = trusted.DataFormat.DER;
      }

      if (folderOut.length > 0) {
        if (!dirExists(folderOut)) {
          $(".toast-failed_find_directory").remove();
          Materialize.toast(localize("Settings.failed_find_directory", locale), 2000, "toast-failed_find_directory");

          return;
        }
      }


      if (setting.sign.detached) {
        policies.push("detached");
      }

      if (setting.sign.time) {
        policies.splice(0, 1);
      }

      const signParams: ISignParams = {
        signModel: setting.sign.toJS(),
        tspModel: setting.tsp.toJS(),
        ocspModel: setting.ocsp.toJS(),
      };

      packageSign(files, cert, policies, signParams, format, folderOut);
    }
  }

  resign = (files: IFile[], cert: any) => {
    const { connections, connectedList, signer, tokensAuth, users, uploader } = this.props;
    let { setting } = this.props;
    // tslint:disable-next-line:no-shadowed-variable
    const { deleteFile, selectFile, packageReSign } = this.props;
    const { localize, locale } = this.context;
    const { pinCode } = this.state;

    const isSockets = this.isFilesFromSocket();

    if (isSockets) {
      setting = setting.set("outfolder", "");
      setting = setting.setIn(["sign", "detached"], false);
      setting = setting.setIn(["sign", "time"], true);
    }

    if (files.length > 0) {
      const policies = ["noAttributes"];
      const folderOut = setting.outfolder;
      let format = trusted.DataFormat.PEM;
      if (setting.sign.encoding !== localize("Settings.BASE", locale)) {
        format = trusted.DataFormat.DER;
      }
      let res = true;

      if (folderOut.length > 0) {
        if (!dirExists(folderOut)) {
          $(".toast-failed_find_directory").remove();
          Materialize.toast(localize("Settings.failed_find_directory", locale), 2000, "toast-failed_find_directory");
          return;
        }
      }


      if (setting.sign.time) {
        policies.splice(0, 1);
      }

      const signParams: ISignParams = {
        signModel: setting.sign.toJS(),
        tspModel: setting.tsp.toJS(),
        ocspModel: setting.ocsp.toJS(),
      };

      files.forEach((file) => {
        const newPath = trustedSign.resignFile(file.fullpath, cert, policies, signParams, format, folderOut);

        if (newPath) {
          if (file.socket) {
            const connection = connections.getIn(["entities", file.socket]);

            if (connection && connection.connected && connection.socket) {
              connection.socket.emit(SIGNED, { id: file.remoteId });
            } else if (connectedList.length) {
              const connectedSocket = connectedList[0].socket;

              connectedSocket.emit(SIGNED, { id: file.remoteId });
              connectedSocket.broadcast.emit(SIGNED, { id: file.remoteId });
            }

            if (uploader) {
              let cms = trustedSign.loadSign(newPath);

              if (cms.isDetached()) {
                if (!(cms = trustedSign.setDetachedContent(cms, newPath))) {
                  throw new Error(("err"));
                }
              }

              const signatureInfo = trustedSign.getSignPropertys(cms);

              const normalyzeSignatureInfo: any[] = [];

              signatureInfo.forEach((info) => {
                const subjectCert = info.certs[info.certs.length - 1];
                let x509;

                if (subjectCert.object) {
                  try {
                    let cmsContext = subjectCert.object.export(trusted.DataFormat.PEM).toString();

                    cmsContext = cmsContext.replace("-----BEGIN CERTIFICATE-----", "");
                    cmsContext = cmsContext.replace("-----END CERTIFICATE-----", "");
                    cmsContext = cmsContext.replace(/\r\n|\n|\r/gm, "");

                    x509 = cmsContext;
                  } catch (e) {
                    //
                  }
                }

                normalyzeSignatureInfo.push({
                  serialNumber: subjectCert.serial,
                  subjectFriendlyName: info.subject,
                  issuerFriendlyName: subjectCert.issuerFriendlyName,
                  notBefore: new Date(subjectCert.notBefore).getTime(),
                  notAfter: new Date(subjectCert.notAfter).getTime(),
                  digestAlgorithm: subjectCert.signatureDigestAlgorithm,
                  organizationName: subjectCert.organizationName,
                  signingTime: info.signingTime ? new Date(info.signingTime).getTime() : undefined,
                  subjectName: subjectCert.subjectName,
                  issuerName: subjectCert.issuerName,
                  x509,
                });
              });

              window.request.post({
                formData: {
                  extra: JSON.stringify(file.extra),
                  file: fs.createReadStream(newPath),
                  id: file.remoteId,
                  signers: JSON.stringify(normalyzeSignatureInfo),
                },
                url: uploader,
              }, (err) => {
                if (err) {
                  if (connection && connection.connected && connection.socket) {
                    connection.socket.emit(ERROR, { id: file.remoteId, error: err });
                  } else if (connectedList.length) {
                    const connectedSocket = connectedList[0].socket;

                    connectedSocket.emit(ERROR, { id: file.remoteId, error: err });
                    connectedSocket.broadcast.emit(ERROR, { id: file.remoteId, error: err });
                  }
                } else {
                  if (connection && connection.connected && connection.socket) {
                    connection.socket.emit(UPLOADED, { id: file.remoteId });
                  } else if (connectedList.length) {
                    const connectedSocket = connectedList[0].socket;

                    connectedSocket.emit(UPLOADED, { id: file.remoteId });
                    connectedSocket.broadcast.emit(UPLOADED, { id: file.remoteId });
                  }
                }

                deleteFile(file.id);
              },
              );
            }
          } else {
            deleteFile(file.id);
            selectFile(newPath);
          }
        } else {
          res = false;
        }
      });

      if (res) {
        $(".toast-files_resigned").remove();
        Materialize.toast(localize("Sign.files_resigned", locale), 2000, "toast-files_resigned");
      } else {
        $(".toast-files_resigned_failed").remove();
        Materialize.toast(localize("Sign.files_resigned_failed", locale), 2000, "toast-files_resigned_failed");
      }
    }
  }

  unSign = () => {
    const { activeFilesArr, setting } = this.props;
    // tslint:disable-next-line:no-shadowed-variable
    const { deleteFile, selectFile } = this.props;
    const { localize, locale } = this.context;

    if (activeFilesArr.length > 0) {
      const folderOut = setting.outfolder;
      let res = true;

      activeFilesArr.forEach((file) => {
        const newPath = trustedSign.unSign(file.fullpath, folderOut);
        if (newPath) {
          deleteFile(file.id);
          selectFile(newPath);
        } else {
          res = false;
        }
      });

      if (res) {
        $(".toast-files_unsigned_ok").remove();
        Materialize.toast(localize("Sign.files_unsigned_ok", locale), 2000, "toast-files_unsigned_ok");
      } else {
        $(".toast-files_unsigned_failed").remove();
        Materialize.toast(localize("Sign.files_unsigned_failed", locale), 2000, "toast-files_unsigned_failed");
      }
    }
  }

  verifySign = () => {
    const { activeFilesArr, signatures } = this.props;
    // tslint:disable-next-line:no-shadowed-variable
    const { verifySignature } = this.props;
    const { localize, locale } = this.context;

    let res = true;

    activeFilesArr.forEach((file) => {
      verifySignature(file.id);
    });

    signatures.forEach((signature: any) => {
      for (const file of activeFilesArr) {
        if (file.id === signature.fileId && !signature.status_verify) {
          res = false;
          break;
        }
      }
    });

    if (res) {
      $(".toast-verify_sign_ok").remove();
      Materialize.toast(localize("Sign.verify_sign_ok", locale), 2000, "toast-verify_sign_ok");
    } else {
      $(".toast-verify_sign_founds_errors").remove();
      Materialize.toast(localize("Sign.verify_sign_founds_errors", locale), 2000, "toast-verify_sign_founds_errors");
    }
  }

  encrypt = () => {
    const { connectedList, connections, activeFilesArr, setting, deleteFile, selectFile, recipients } = this.props;
    const { localize, locale } = this.context;

    if (activeFilesArr.length > 0) {
      const certs = recipients;
      const folderOut = setting.outfolder;
      const policies = { deleteFiles: false, archiveFiles: false };

      let format = trusted.DataFormat.PEM;
      let res = true;
      let encAlg = trusted.EncryptAlg.GOST_28147;

      if (folderOut.length > 0) {
        if (!dirExists(folderOut)) {
          $(".toast-failed_find_directory").remove();
          Materialize.toast(localize("Settings.failed_find_directory", locale), 2000, "toast-failed_find_directory");
          return;
        }
      }

      switch (setting.encrypt.algorithm) {
        case GOST_28147:
          encAlg = trusted.EncryptAlg.GOST_28147;
          break;
        case GOST_R3412_2015_M:
          encAlg = trusted.EncryptAlg.GOST_R3412_2015_M;
          break;
        case GOST_R3412_2015_K:
          encAlg = trusted.EncryptAlg.GOST_R3412_2015_K;
          break;
      }

      policies.deleteFiles = setting.encrypt.delete;
      policies.archiveFiles = setting.encrypt.archive;

      if (setting.encrypt.encoding !== localize("Settings.BASE", locale)) {
        format = trusted.DataFormat.DER;
      }

      if (policies.archiveFiles) {
        let outURI: string;
        const archiveName = activeFilesArr.length === 1 ? `${activeFilesArr[0].filename}.zip` : localize("Encrypt.archive_name", locale);
        if (folderOut.length > 0) {
          outURI = path.join(folderOut, archiveName);
        } else {
          outURI = path.join(HOME_DIR, archiveName);
        }

        const output = fs.createWriteStream(outURI);
        const archive = window.archiver("zip");

        output.on("close", () => {
          $(".toast-files_archived").remove();
          Materialize.toast(localize("Encrypt.files_archived", locale), 2000, "toast-files_archived");

          if (policies.deleteFiles) {
            activeFilesArr.forEach((file) => {
              fs.unlinkSync(file.fullpath);
            });
          }

          const newPath = trustedEncrypts.encryptFile(outURI, certs, policies, encAlg, format, folderOut);
          if (newPath) {
            activeFilesArr.forEach((file) => {
              deleteFile(file.id);
              if (file.socket) {
                const connection = connections.getIn(["entities", file.socket]);
                if (connection && connection.connected && connection.socket) {
                  connection.socket.emit(ENCRYPTED, { id: file.remoteId });
                } else if (connectedList.length) {
                  const connectedSocket = connectedList[0].socket;

                  connectedSocket.emit(ENCRYPTED, { id: file.remoteId });
                  connectedSocket.broadcast.emit(ENCRYPTED, { id: file.remoteId });
                }
              }
            });
            selectFile(newPath);
          } else {
            res = false;
          }

          if (res) {
            $(".toast-files_encrypt").remove();
            Materialize.toast(localize("Encrypt.files_encrypt", locale), 2000, "toast-files_encrypt");
          } else {
            $(".toast-files_encrypt_failed").remove();
            Materialize.toast(localize("Encrypt.files_encrypt_failed", locale), 2000, "toast-files_encrypt_failed");
          }
        });

        archive.on("error", () => {
          $(".toast-files_archived_failed").remove();
          Materialize.toast(localize("Encrypt.files_archived_failed", locale), 2000, "toast-files_archived_failed");
        });

        archive.pipe(output);

        activeFilesArr.forEach((file) => {
          archive.append(fs.createReadStream(file.fullpath), { name: file.filename });
        });

        archive.finalize();
      } else {
        activeFilesArr.forEach((file) => {
          const newPath = trustedEncrypts.encryptFile(file.fullpath, certs, policies, encAlg, format, folderOut);
          if (newPath) {
            deleteFile(file.id);
            selectFile(newPath);

            if (file.socket) {
              const connection = connections.getIn(["entities", file.socket]);
              if (connection && connection.connected && connection.socket) {
                connection.socket.emit(ENCRYPTED, { id: file.remoteId });
              } else if (connectedList.length) {
                const connectedSocket = connectedList[0].socket;

                connectedSocket.emit(ENCRYPTED, { id: file.remoteId });
                connectedSocket.broadcast.emit(ENCRYPTED, { id: file.remoteId });
              }
            }
          } else {
            res = false;
          }
        });

        if (res) {
          $(".toast-files_encrypt").remove();
          Materialize.toast(localize("Encrypt.files_encrypt", locale), 2000, "toast-files_encrypt");
        } else {
          $(".toast-files_encrypt_failed").remove();
          Materialize.toast(localize("Encrypt.files_encrypt_failed", locale), 2000, "toast-files_encrypt_failed");
        }
      }
    }
  }

  decrypt = () => {
    const { connectedList, connections, activeFilesArr, setting, deleteFile, selectFile, licenseStatus, lic_error } = this.props;
    const { localize, locale } = this.context;

    if (licenseStatus !== true) {
      $(".toast-jwtErrorLicense").remove();
      Materialize.toast(localize(jwt.getErrorMessage(lic_error), locale), 5000, "toast-jwtErrorLicense");

      logger.log({
        level: "error",
        message: "No correct license",
        operation: "Расшифрование",
        operationObject: {
          in: "License",
          out: "Null",
        },
        userName: USER_NAME,
      });

      return;
    }

    if (activeFilesArr.length > 0) {
      const folderOut = setting.outfolder;
      let res = true;

      if (folderOut.length > 0) {
        if (!dirExists(folderOut)) {
          $(".toast-failed_find_directory").remove();
          Materialize.toast(localize("Settings.failed_find_directory", locale), 2000, "toast-failed_find_directory");
          return;
        }
      }

      activeFilesArr.forEach((file) => {
        const newPath = trustedEncrypts.decryptFile(file.fullpath, folderOut);

        if (newPath) {
          deleteFile(file.id);
          selectFile(newPath);

          if (file.socket) {
            const connection = connections.getIn(["entities", file.socket]);
            if (connection && connection.connected && connection.socket) {
              connection.socket.emit(DECRYPTED, { id: file.remoteId });
            } else if (connectedList.length) {
              const connectedSocket = connectedList[0].socket;

              connectedSocket.emit(DECRYPTED, { id: file.remoteId });
              connectedSocket.broadcast.emit(DECRYPTED, { id: file.remoteId });
            }
          }
        } else {
          res = false;
        }
      });

      if (res) {
        $(".toast-files_decrypt").remove();
        Materialize.toast(localize("Encrypt.files_decrypt", locale), 2000, "toast-files_decrypt");
      } else {
        $(".toast-files_decrypt_failed").remove();
        Materialize.toast(localize("Encrypt.files_decrypt_failed", locale), 2000, "toast-files_decrypt_failed");
      }
    }
  }

  handleRemoveFiles = () => {
    const { activeFilesArr, deleteFile } = this.props;

    activeFilesArr.forEach((file) => {
      deleteFile(file.id);
    });
  }

  backView = () => {
    this.setState({ showSignatureInfo: false });
  }

  handleCleanRecipientsList = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { deleteRecipient, recipients } = this.props;

    recipients.forEach((recipient) => deleteRecipient(recipient.id));
  }

  checkEnableOperationButton = (operation: string) => {
    const { activeFilesArr, isDocumentsReviewed, signer, recipients } = this.props;

    if (!activeFilesArr.length) {
      return false;
    }

    switch (operation) {
      case SIGN:
        if (!isDocumentsReviewed || !signer) {
          return false;
        } else {
          for (const document of activeFilesArr) {
            if (document.extension === "enc") {
              return false;
            }
          }
        }

        return true;

      case VERIFY:
      case UNSIGN:
        for (const document of activeFilesArr) {
          if (document.extension !== "sig") {
            return false;
          }
        }

        return true;

      case ENCRYPT:
        if (!recipients || !recipients.length) {
          return false;
        } else {
          for (const document of activeFilesArr) {
            if (document.extension === "enc") {
              return false;
            }
          }
        }

        return true;

      case DECRYPT:
        for (const document of activeFilesArr) {
          if (document.extension !== "enc") {
            return false;
          }
        }

        return true;

      case REMOVE:
        return true;

      default:
        return false;
    }
  }

  addFiles() {
    // tslint:disable-next-line:no-shadowed-variable
    const { filePackageSelect } = this.props;

    dialog.showOpenDialog(null, { properties: ["openFile", "multiSelections"] }, (selectedFiles: string[]) => {
      if (selectedFiles) {
        const pack: IFilePath[] = [];

        selectedFiles.forEach((file) => {
          pack.push({ fullpath: file });
        });

        filePackageSelect(pack);
      }
    });
  }

  getSelectedFilesSize = () => {
    const { activeFiles } = this.props;

    let sizeInBytes = 0;

    for (const document of activeFiles) {
      sizeInBytes += document.filesize;
    }

    return bytesToSize(sizeInBytes);
  }

  isFilesFromSocket = () => {
    const { files, loadingFiles } = this.props;

    if (loadingFiles.length) {
      return true;
    }

    if (files.length) {
      for (const file of files) {
        if (file.socket) {
          return true;
        }
      }
    }

    return false;
  }
}

export default connect((state) => {
  let signatures: object[] = [];

  mapToArr(state.signatures.entities).forEach((element: any) => {
    signatures = signatures.concat(mapToArr(element));
  });

  return {
    activeFiles: activeFilesSelector(state, { active: true }),
    activeFilesArr: mapToArr(activeFilesSelector(state, { active: true })),
    connectedList: connectedSelector(state, { connected: true }),
    connections: state.connections,
    files: mapToArr(state.files.entities),
    isDocumentsReviewed: state.files.documentsReviewed,
    licenseStatus: state.license.status,
    lic_error: state.license.lic_error,
    loadingFiles: loadingRemoteFilesSelector(state, { loading: true }),
    mapCertificates: state.certificates,
    method: state.remoteFiles.method,
    recipients: mapToArr(state.settings.getIn(["entities", state.settings.default]).encrypt.recipients)
      .map((recipient) => state.certificates.getIn(["entities", recipient.certId]))
      .filter((recipient) => recipient !== undefined),
    uploader: state.remoteFiles.uploader,
    setting: state.settings.getIn(["entities", state.settings.default]),
    settings: state.settings.entities,
    signatures,
    signer: state.certificates.getIn(["entities", state.settings.getIn(["entities", state.settings.default]).sign.signer]),
    tokensAuth: state.tokens.tokensAuth,
    users: state.users.entities,
  };
}, {
  activeFile, activeSetting, changeDefaultSettings,
  deleteSetting, deleteFile, deleteRecipient, documentsReviewed,
  filePackageSelect, filePackageDelete, packageSign, packageReSign,
  saveSettings, selectFile,
  verifyCertificate, selectSignerCertificate, verifySignature,
})(SignatureAndEncryptRightColumnSettings);

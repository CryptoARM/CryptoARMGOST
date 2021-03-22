import * as fs from "fs";
import { Map, OrderedMap } from "immutable";
import * as path from "path";
import PropTypes, { any } from "prop-types";
import React from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { push } from "react-router-redux";
import {
  activeFile, deleteFile, deleteRecipient,
  filePackageDelete, filePackageSelect, packageReSign, packageSign,
  selectFile, selectSignerCertificate, verifyCertificate,
  verifySignature,
} from "../../AC";
import { IFile } from "../../AC";
import { documentsReviewed } from "../../AC/documentsActions";
import { createTransactionDSS, dssOperationConfirmation, dssPerformOperation } from "../../AC/dssActions";
import { multiDirectOperation, multiOperationStart, multiReverseOperation } from "../../AC/multiOperations";
import {
  activeSetting, changeDefaultSettings, deleteSetting, saveSettings,
} from "../../AC/settingsActions";
import { cancelUrlAction, finishCurrentUrlCmd, removeUrlAction } from "../../AC/urlActions";
import { postRequest, removeWarningMessage } from "../../AC/urlCmdUtils";
import {
  ARCHIVATION_OPERATION, ARCHIVE, DECRYPT, DEFAULT_DOCUMENTS_PATH, DSS_ACTIONS, ENCRYPT, ENCRYPTION_OPERATION,
  GOST_28147, GOST_R3412_2015_K,
  GOST_R3412_2015_M,
  HOME_DIR, INTERRUPT,
  LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT, LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE, LOCATION_RESULTS_MULTI_OPERATIONS, LOCATION_SETTINGS_CONFIG, LOCATION_SETTINGS_SELECT,
  MULTI_DIRECT_OPERATION, MULTI_REVERSE, PACKAGE_SIGN, REMOVE, SIGN, SIGNING_OPERATION, SUCCESS, UNSIGN,
  UNZIPPING, USER_NAME, VERIFY,
} from "../../constants";
import { DEFAULT_ID, ISignParams } from "../../reducer/settings";
import { activeFilesSelector, connectedSelector, filesInTransactionsSelector, loadingRemoteFilesSelector } from "../../selectors";
import { DECRYPTED, ENCRYPTED, ERROR, SIGNED, UPLOADED } from "../../server/constants";
import store from "../../store";
import * as trustedEncrypts from "../../trusted/encrypt";
import * as jwt from "../../trusted/jwt";
import { checkLicense } from "../../trusted/jwt";
import * as signs from "../../trusted/sign";
import * as trustedSign from "../../trusted/sign";
import { bytesToSize, dirExists, fileCoding, fileNameForResign, fileNameForSign, mapToArr } from "../../utils";
import { extFile, fileExists, md5 } from "../../utils";
import { buildDocumentDSS, buildDocumentPackageDSS, buildTransaction } from "../../utils/dss/helpers";
import logger from "../../winstonLogger";
import CheckBoxWithLabel from "../CheckBoxWithLabel";
import ConfirmTransaction from "../DSS/ConfirmTransaction";
import PinCodeForDssContainer from "../DSS/PinCodeForDssContainer";
import ReAuth from "../DSS/ReAuth";
import Modal from "../Modal";
import RecipientsList from "../RecipientsList";
import AllSettings from "../Settings/AllSettings";
import AskSaveSetting from "../Settings/AskSaveSetting";
import Operations from "../Settings/Operations";
import RenameSettings from "../Settings/RenameSettings";
import SaveSettings from "../Settings/SaveSettings";
import SettingsSelector from "../Settings/SettingsSelector";
import WrongCertificate from "../Settings/WrongCertificate";
import SignerInfo from "../Signature/SignerInfo";

const dialog = window.electron.remote.dialog;

interface ISignatureAndEncryptRightColumnSettingsProps {
  activeFilesArr: any;
  isDefaultFilters: boolean;
  isDocumentsReviewed: boolean;
  changeDefaultSettings: (id: string) => void;
  dssResponses: OrderedMap<any, any>;
  loadingFiles: any;
  files: any;
  packageSignResult: any;
  removeAllFiles: () => void;
  createTransactionDSS: (url: string, token: string, body: ITransaction, fileId: string[]) => Promise<any>;
  dssPerformOperation: (url: string, token: string, body?: IDocumentDSS | IDocumentPackageDSS) => Promise<any>;
  dssOperationConfirmation: (url: string, token: string, TransactionTokenId: string, dssUserID: string) => Promise<any>;
  setting: any;
  signatures: any;
  signedPackage: any;
  tokensAuth: any;
  tokensDss: any;
  users: any;
  transactionDSS: any;
  policyDSS: any;
  saveSettings: () => void;
}

interface ISignatureAndEncryptRightColumnSettingsState {
  allSettingsMaunted: boolean;
  currentOperation: string;
  pinCode: string;
  saveSettingsWithNewName: boolean;
  searchValue: string;
  showModalAskSaveSetting: boolean;
  showModalDssPin: boolean;
  showModalDssResponse: boolean;
  showModalReAuth: boolean;
  showModalRenameParams: boolean;
  showModalSaveParams: boolean;
  signingPackage: boolean;
  packageSignResult: boolean;
  showModalWrongCertificate: boolean;
  isOnlySignerCertWrong: boolean;
}

interface IFilePackage {
  files: IFile[];
  documents: IDocumentContent[];
  documentsId: string[];
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
      showModalDssPin: false,
      showModalDssResponse: false,
      showModalReAuth: false,
      showModalRenameParams: false,
      showModalSaveParams: false,
    };
  }

  componentWillMount() {
    this.props.activeSetting(this.props.setting.id);

    $(document).ready(function () {
      $(".tooltipped").tooltip();
    });
  }

  componentDidMount() {
    const { dssResponses } = this.props;

    $(".btn-floated").dropdown();

    if (dssResponses && dssResponses.size) {
      this.handleCloseModalReAuth();
      this.handleShowModalDssResponse();
    }

    $(".collapsible").collapsible();

    $(document).ready(() => {
      $("select").material_select();
    });

    $(ReactDOM.findDOMNode(this.refs.settingsSelectRef)).on("change", this.handleChangeDefaultSettings);
  }

  componentDidUpdate(prevProps: ISignatureAndEncryptRightColumnSettingsProps, prevState: ISignatureAndEncryptRightColumnSettingsState) {
    const { localize, locale } = this.context;

    if (!prevProps.dssResponses.size && this.props.dssResponses.size) {
      this.handleCloseModalReAuth();
      this.handleShowModalDssResponse();
    }

    if (this.props.dssResponses.size && prevProps.dssResponses.size !== this.props.dssResponses.size) {
      this.handleShowModalDssResponse();
    }

    if (prevProps.dssResponses.size && !this.props.dssResponses.size) {
      this.handleCloseModalDssResponse();
    }

    if (prevProps.signingPackage && !this.props.signingPackage && !this.props.packageSignResult) {
      $(".toast-files_signed_failed").remove();
      Materialize.toast(localize("Sign.files_signed_failed", locale), 7000, "toast-files_signed_failed");
    }

    $(".btn-floated").dropdown();
  }

  componentWillUnmount() {
    $(".tooltipped").tooltip("remove");
  }

  render() {
    const { localize, locale } = this.context;
    const { activeFiles, activeFilesArr, isDocumentsReviewed, recipients, setting, settings, signer,
      operationIsRemote, operationRemoteAction } = this.props;
    const { file, saveSettingsWithNewName } = this.state;

    const disabledNavigate = this.isFilesFromSocket();
    const classDisabled = disabledNavigate ? "disabled" : "";
    const isSignCertFromDSS = (signer && (signer.service || signer.dssUserID)) ? true : false;

    let countAllFiles = 0;
    let countSignedFiles = 0;
    let countArchiveFiles = 0;
    let countEncryptedFiles = 0;

    if (setting.operations.reverse_operations) {
      for (const fileitem of activeFilesArr) {
        if (fileitem.extension === "sig") {
          countSignedFiles++;
          countAllFiles++;
        } else if (fileitem.extension === "enc") {
          countEncryptedFiles++;
          countAllFiles++;
        } else if (fileitem.extension === "zip") {
          countArchiveFiles++;
          countAllFiles++;
        } else {
          countAllFiles++;
        }
      }
    }

    return (
      <React.Fragment>
        <div style={{ height: `calc(100vh - ${activeFiles && activeFiles.size && setting.operations.signing_operation && !setting.operations.reverse_operations ? "170px" : "160px"})` }}>
          <div style={{ height: "100%", overflow: "auto" }}>
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
                  disabled={operationIsRemote}
                  setting={setting}
                  settings={settings} />
              </div>
            </div>

            <div className="row" />

            <div className="col s12">
              <div className="subtitle">{localize("Operations.Operations", locale)}</div>
              <hr />
            </div>

            <Operations />

            {
              setting.operations.reverse_operations ?
                <React.Fragment>
                  <div className="col s12">
                    <div className="subtitle">{localize("Operations.files_selected", locale)}</div>
                    <hr />
                  </div>
                  <div className="row halfbottom">
                    <div className="col s12">
                      <div className="primary-text">{localize("Operations.files_all", locale)}: {countAllFiles}</div>
                    </div>
                  </div>
                  <div className="row halfbottom">
                    <div className="col s12">
                      <div className="primary-text">{localize("Operations.files_signed", locale)}: {countSignedFiles}</div>
                    </div>
                  </div>
                  <div className="row halfbottom">
                    <div className="col s12">
                      <div className="primary-text">{localize("Operations.files_archived", locale)}: {countArchiveFiles}</div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col s12">
                      <div className="primary-text">{localize("Operations.files_encrypted", locale)}: {countEncryptedFiles}</div>
                    </div>
                  </div>
                  <div className="row"></div>
                </React.Fragment> :
                <React.Fragment>
                  {
                    setting.operations.signing_operation || operationIsRemote ?
                      <React.Fragment>
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
                      </React.Fragment>
                      : null
                  }

                  {
                    setting.operations.encryption_operation && !isSignCertFromDSS ?
                      <React.Fragment>
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
                      </React.Fragment> : null
                  }

                  <div className="col s12" style={{ position: "relative" }}>
                    < AllSettings />
                  </div>
                </React.Fragment>
            }

            <div className="col s12" style={{ position: "relative" }}>
              {
                setting.changed ?
                  <React.Fragment>

                    <CheckBoxWithLabel
                      disabled={false}
                      onClickCheckBox={this.toggleSaveSettingsWithNewName}
                      isChecked={saveSettingsWithNewName}
                      elementId="new_time"
                      title={"Сохранить параметры с новым именем"} />

                    <div className="row" />

                    <a className="btn btn-outlined waves-effect waves-light"
                      onClick={this.handleSaveSettings}
                      style={{ width: "100%" }}>
                      {localize("Settings.save", locale)}
                    </a>

                    <div className="row" />
                  </React.Fragment>
                  : null
              }
            </div>
          </div>
        </div>

        <div className="row fixed-bottom-rightcolumn center-align" style={{ bottom: "20px" }}>
          {
            activeFiles && activeFiles.size && setting.operations.signing_operation || operationIsRemote && !setting.operations.reverse_operations ?
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
                  <label htmlFor={"filesview"} className="truncate">
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

                  <div className="col s4 waves-effect waves-cryptoarm" onClick={() => {
                    this.props.removeAllFiles();
                    if (operationRemoteAction) {
                      console.log("operationRemoteAction", operationRemoteAction);
                      cancelUrlAction("signAndEncrypt.outDirectResults", operationRemoteAction.url, operationRemoteAction.id);
                    }

                    removeUrlAction();
                  }}>
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

                  <div className="col s4 waves-effect waves-cryptoarm" onClick={() => {
                    this.props.removeAllFiles();
                    if (operationRemoteAction) {
                      cancelUrlAction("signAndEncrypt.outDirectResults", operationRemoteAction.url, operationRemoteAction.id);
                    }
                    removeUrlAction();
                  }}>
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
                <div className="col s12">
                  <a className={`btn btn-outlined waves-effect waves-light ${this.checkEnableMultiOperations() ? "" : "disabled"}`}
                    onClick={setting.operations.signing_operation ? this.checkCertificatesBeforePerformOperation : this.handleClickPerformOperations}
                    style={{ width: "100%" }}>
                    {localize("Common.perform", locale)}
                  </a>
                </div>
              </React.Fragment>
          }

        </div>
        {this.showModalReAuth()}
        {this.showModalDssPin()}
        {this.showModalDssResponse()}
        {this.showModalSaveParams()}
        {this.showModalAskSaveSetting()}
        {this.showModalRenameParams()}
        {this.showModalWrongCertificate()}
      </React.Fragment>
    );
  }

  showModalReAuth = () => {
    const { localize, locale } = this.context;
    const { showModalReAuth } = this.state;
    const { signer } = this.props;

    if (!showModalReAuth) {
      return;
    }

    return (
      <Modal
        isOpen={showModalReAuth}
        key="ReAuth"
        header={localize("DSS.DSS_connection", locale)}
        onClose={this.handleCloseModalReAuth}
        style={{ width: "500px" }}>

        <ReAuth onCancel={this.handleCloseModalReAuth} dssUserID={signer.dssUserID} onGetTokenAndPolicy={() => this.handleClickSign()} />
      </Modal>
    );
  }

  showModalDssResponse = () => {
    const { localize, locale } = this.context;
    const { showModalDssResponse } = this.state;
    const { dssResponses, signer } = this.props;

    if (!showModalDssResponse || !dssResponses.size) {
      return;
    }

    const dssResponse = dssResponses.first();

    return (
      <Modal
        isOpen={showModalDssResponse}
        key="DssResponse"
        header={dssResponse.Title}
        onClose={this.handleCloseModalDssResponse}
        style={{ width: "600px" }}>

        <ConfirmTransaction
          dssResponse={dssResponse}
          onCancel={this.handleCloseModalDssResponse}
          dssUserID={signer.dssUserID} />
      </Modal>
    );
  }

  showModalDssPin = () => {
    const { localize, locale } = this.context;
    const { showModalDssPin } = this.state;

    if (!showModalDssPin) {
      return;
    }

    return (
      <Modal
        isOpen={showModalDssPin}
        key="DssPin"
        header={localize("DSS.pin_code_for_container", locale)}
        onClose={this.handleCloseModalDssPin}
        style={{ width: "500px" }}>

        <PinCodeForDssContainer
          done={(pinCode) => {
            this.setState({ pinCode });
          }}
          onCancel={this.handleCloseModalDssPin}
          clickSign={this.handleClickSign}
        />
      </Modal>
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

  showModalWrongCertificate = () => {
    const { localize, locale } = this.context;
    const { showModalWrongCertificate } = this.state;
    const { signer } = this.props;
    const isSignCertFromDSS = (signer && (signer.service || signer.dssUserID)) ? true : false;

    if (!showModalWrongCertificate) {
      return;
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
          onContinue={isSignCertFromDSS ? this.handleClickSign : this.handleClickPerformOperations}
          message={this.state.isOnlySignerCertWrong ? localize("Problems.problem_9_1", locale) : localize("Problems.problem_9", locale)}
        />
      </Modal>
    );
  }

  isGostRecipients(recipients: any) {
    return recipients.filter(function (recipient: any) {
      return recipient.publicKeyAlgorithm !== "1.2.643.7.1.1.1.1"
        && recipient.publicKeyAlgorithm !== "1.2.643.7.1.1.1.2"
        && recipient.publicKeyAlgorithm !== "1.2.643.2.2.19";
    }).length === 0;
  }

  checkCertificatesBeforePerformOperation = () => {
    const { setting, signer, recipients, activeFilesArr } = this.props;
    const { localize, locale } = this.context;
    const isSignCertFromDSS = (signer && (signer.service || signer.dssUserID)) ? true : false;

    for (const document of activeFilesArr) {
      if (document.filesize.toString() === "0") {
        $(".toast-Empty_file").remove();
        Materialize.toast(localize("Operations.file_empty_err", locale), 3000, "toast-Empty_file");
        return;
      }
    }

    if (isSignCertFromDSS && signer && !signer.status) {
      this.handleshowModalWrongCertificate();
      return;
    } else if (isSignCertFromDSS) {
      this.handleClickSign();
      return;
    }

    if (setting.operations.signing_operation && !setting.changedSigner && signer && !signer.status) {
      this.handleshowModalWrongCertificate();

      if (!setting.operations.encryption_operation) {
        this.setState({ isOnlySignerCertWrong: true });
      }

      return;
    }

    if (setting.operations.encryption_operation && !setting.changedRecipients && !(this.props.lic_error === 911)) {
      const isGost = this.isGostRecipients(recipients);

      for (const items of recipients) {
        const isItemGost =
          items.publicKeyAlgorithm !== "1.2.643.7.1.1.1.1"
            && items.publicKeyAlgorithm !== "1.2.643.7.1.1.1.2"
            && items.publicKeyAlgorithm !== "1.2.643.2.2.19" ?
            false : true;
        if (isGost !== isItemGost) {
          $(".toast-ca_req_error").remove();
          Materialize.toast(
            localize("Certificate.cert_error_mixed_GOST_RSA", locale), 3000, "toast-ca_req_error");
          return;
        }
        if (!items.status) {
          this.handleshowModalWrongCertificate();
          this.setState({ isOnlySignerCertWrong: false });
          return;
        }
      }
    }
    this.handleClickPerformOperations();
  }

  handleCloseModalWrongCertificate = () => {
    this.setState({ showModalWrongCertificate: false });
  }

  handleshowModalWrongCertificate = () => {
    this.setState({ showModalWrongCertificate: true });
  }

  handleShowModalReAuth = () => {
    this.setState({
      showModalReAuth: true,
    });
  }

  handleCloseModalReAuth = () => {
    this.setState({
      showModalReAuth: false,
    });
  }

  handleShowModalDssResponse = () => {
    this.setState({ showModalDssResponse: true });
  }

  handleCloseModalDssResponse = () => {
    this.setState({ showModalDssResponse: false });
  }

  handleShowModalDssPin = () => {
    this.setState({ showModalDssPin: true });
  }

  handleCloseModalDssPin = () => {
    this.setState({ showModalDssPin: false });
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

  handleClickPerformOperations = () => {
    const { activeFilesArr, inactiveFilesArr, lic_error, setting, signer,
      multiDirectOperation, multiReverseOperation, operations, recipients } = this.props;
    const { localize, locale } = this.context;

    for (const document of activeFilesArr) {
      if (document.filesize.toString() === "0") {
        $(".toast-Empty_file").remove();
        Materialize.toast(localize("Operations.file_empty_err", locale), 3000, "toast-Empty_file");
        return;
      }
    }

    if ((setting.sign.timestamp_on_data || setting.sign.timestamp_on_sign) && setting.tsp.url === "" && setting.operations.signing_operation) {
      $(".toast-Sign_failed_TSP_misconfigured").remove();
      Materialize.toast(localize("Tsp.failed_tsp_url", locale), 3000, "toast-Sign_failed-TSP_misconfigured");
      return;
    }

    const licenseStatus = checkLicense();

    let sinerCert = null;

    if (signer) {
      sinerCert = window.PKISTORE.getPkiObject(signer);
    }

    if (setting.operations.reverse_operations) {

      if (activeFilesArr.length === 1 && activeFilesArr[0].extension === "sig") {
        let cms = signs.loadSign(activeFilesArr[0].fullpath);

        if (cms.isDetached()) {
          $(".toast-files_unsigned_detached").remove();
          Materialize.toast(localize("Sign.files_unsigned_detached", window.locale), 2000, "toast-files_unsigned_detached");
          return;
        }
      }
      for (const activeFileItem of activeFilesArr) {

        if (activeFileItem.extension === "enc") {
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
        }
      }
      multiReverseOperation(activeFilesArr);
    } else {
      if (setting.operations.signing_operation) {
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
      }

      multiDirectOperation(activeFilesArr, setting, sinerCert, recipients);

      const inactiveFilesIdsForRemoveFromList = [];

      for (const inactiveFile of inactiveFilesArr) {
        inactiveFilesIdsForRemoveFromList.push(inactiveFile.id);
      }

      this.props.filePackageDelete(inactiveFilesIdsForRemoveFromList);
    }
  }

  handleClickSign = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { activeFilesArr, signer, lic_error, multiOperationStart, setting } = this.props;
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

    if ((setting.sign.timestamp_on_data || setting.sign.timestamp_on_sign)
      && setting.tsp.url === "") {
      $(".toast-Sign_failed_TSP_misconfigured").remove();
      Materialize.toast(localize("Tsp.failed_tsp_url", locale), 3000, "toast-Sign_failed-TSP_misconfigured");
      return;
    }

    if (signer && signer.dssUserID) {
      const { tokensAuth } = this.props;

      const token = tokensAuth.get(signer.dssUserID);

      if (token) {
        const time = new Date().getTime();
        const expired = token.time + token.expires_in * 1000;

        if (expired < time) {
          this.handleShowModalReAuth();
          return;
        }
      } else {
        this.handleShowModalReAuth();
        return;
      }
    }

    if (signer && signer.dssUserID && signer.hasPin && !pinCode) {
      setTimeout(() => {
        this.handleShowModalDssPin();
      }, 100);

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

      if (signer.dssUserID) {
        multiOperationStart(this.props.setting.operations);
      }

      if (signer.dssUserID
        && filesForSign && filesForSign.length
        && filesForResign && filesForResign.length) {
        this.signAndCosignInDss(filesForSign, filesForResign, cert);
      } else {
        let dropPin = true;
        if (filesForSign && filesForSign.length) {
          this.sign(filesForSign, cert);
        }

        if (filesForResign && filesForResign.length) {
          this.resign(filesForResign, cert);
          if (signer.dssUserID) {
            dropPin = false;
          }
        }

        if (dropPin) {
          this.setState({ pinCode: "" });
        }
      }
    }
  }

  sign = (files: IFile[], cert: any) => {
    const { signer, tokensAuth, users, policyDSS } = this.props;
    let { setting } = this.props;
    // tslint:disable-next-line:no-shadowed-variable
    const { packageSign, createTransactionDSS, dssPerformOperation, operationRemoteAction, uploader } = this.props;
    const { localize, locale } = this.context;
    const { pinCode } = this.state;
    const isSockets = this.isFilesFromSocket();

    if (isSockets) {
      setting = setting.set("outfolder", "");
      setting = operationRemoteAction && operationRemoteAction.isDetachedSign ? setting.setIn(["sign", "detached"], true) : setting.setIn(["sign", "detached"], false);
      setting = setting.setIn(["sign", "time"], true);
    }
    if (files.length > 0) {
      const policies: string[] = [];
      const folderOut = setting.operations.save_result_to_folder ? setting.outfolder : "";

      let format = trusted.DataFormat.PEM;
      if (setting.sign.encoding !== localize("Settings.BASE", locale)) {
        format = trusted.DataFormat.DER;
      }
      if (setting.sign.detached) { policies.push("detached"); }
      if (folderOut.length > 0) {
        if (!dirExists(folderOut)) {
          $(".toast-failed_find_directory").remove();
          Materialize.toast(localize("Settings.failed_find_directory", locale), 2000, "toast-failed_find_directory");

          return;
        }
      }

      if (signer.dssUserID) {
        const user = users.get(signer.dssUserID);
        const tokenAuth = tokensAuth.get(signer.dssUserID);
        const isSignPackage = files.length > 1;
        const policy = policyDSS.getIn([signer.dssUserID, "policy"]).filter(
          (item: any) => item.Action === (isSignPackage ? "SignDocuments" : "SignDocument"));
        const mfaRequired = policy[0].MfaRequired;

        const documents: IDocumentContent[] = [];
        const documentsId: string[] = [];

        files.forEach((file) => {
          const Content = fs.readFileSync(file.fullpath, "base64");
          const documentContent: IDocumentContent = {
            Content,
            Name: path.basename(file.fullpath),
          };
          documents.push(documentContent);
          documentsId.push(file.id);
        });

        if (mfaRequired) {
          createTransactionDSS(user.dssUrl,
            tokenAuth.access_token,
            buildTransaction(documents, signer.dssCertID, setting.sign.detached,
              isSignPackage ? DSS_ACTIONS.SignDocuments : DSS_ACTIONS.SignDocument, "sign", undefined, pinCode),
            documentsId)
            .then(
              (data: any) => {
                $(".toast-transaction_created_successful").remove();
                Materialize.toast(localize("DSS.transaction_created_successful", locale), 3000, "toast-transaction_created_successful");

                this.props.dssOperationConfirmation(
                  user.authUrl.replace("/oauth", "/confirmation"),
                  tokenAuth.access_token,
                  data,
                  user.id)
                  .then(
                    (data2) => {
                      this.props.dssPerformOperation(
                        user.dssUrl + (isSignPackage ? "/api/documents/packagesignature" : "/api/documents"),
                        data2.AccessToken, pinCode ? { Signature: { PinCode: pinCode } } : undefined)
                        .then(
                          (dataCMS: any) => {
                            let i: number = 0;
                            const outURIList: string[] = [];

                            const directResult: any = {};
                            directResult.results = [];
                            directResult.operations = setting.operations.toJS();
                            const directFiles: any = {};
                            files.forEach((file: any) => {
                              directFiles[file.id] = { original: { ...file.toJS(), operation: 4 } };
                            });

                            files.forEach((file) => {
                              const outURI = fileNameForSign(folderOut, file);
                              const tcms: trusted.cms.SignedData = new trusted.cms.SignedData();
                              const contextCMS = isSignPackage ? dataCMS.Results[i] : dataCMS;
                              tcms.import(Buffer.from("-----BEGIN CMS-----" + "\n" + contextCMS + "\n" + "-----END CMS-----"), trusted.DataFormat.PEM);
                              tcms.save(outURI, format);
                              outURIList.push(outURI);
                              i++;

                              const newFileProps = this.getFileProps(outURI);
                              directResult.results.push({
                                id: Date.now() + Math.random(),
                                in: {
                                  ...file.toJS(),
                                },
                                operation: SIGNING_OPERATION,
                                out: {
                                  ...newFileProps,
                                  operation: 3,
                                },
                                result: true,
                              });

                              directFiles[file.id] = {
                                ...directFiles[file.id],
                                signing_operation: {
                                  out: {
                                    ...newFileProps,
                                    operation: 3,
                                  },
                                  result: true,
                                },
                              };
                            });
                            directResult.files = directFiles;

                            packageSign(files, cert, policies, null, format, folderOut, outURIList, directResult);
                          },
                          (error: any) => {
                            if (uploader) {
                              this.dispatchSignInterrupt();
                            } else {
                              this.dispatchSignInDssFail(files, setting.operations.toJS(), error);
                            }

                            $(".toast-dssPerformOperation_failed").remove();
                            Materialize.toast(error, 3000, "toast-dssPerformOperation_failed");
                          },
                        );
                    },
                    (error) => {
                      if (uploader) {
                        this.dispatchSignInterrupt();
                      } else {
                        this.dispatchSignInDssFail(files, setting.operations.toJS(), error);
                      }

                      $(".toast-dssOperationConfirmation_failed").remove();
                      Materialize.toast(error, 3000, "toast-dssOperationConfirmation_failed");
                    },
                  )
                  .catch((error) => {
                    if (uploader) {
                      this.dispatchSignInterrupt();
                    } else {
                      this.dispatchSignInDssFail(files, setting.operations.toJS(), error);
                    }

                    $(".toast-dssOperationConfirmation_failed").remove();
                    Materialize.toast(error, 3000, "toast-dssOperationConfirmation_failed");
                  });
              },
              (error) => {
                $(".toast-transaction_created_failed").remove();
                Materialize.toast(localize("DSS.transaction_created_failed", locale), 3000, "toast-transaction_created_failed");

                $(".toast-createTransactionDSS_failed").remove();
                Materialize.toast(error, 3000, "toast-createTransactionDSS_failed");
              },
            );
        } else {
          dssPerformOperation(
            user.dssUrl + (isSignPackage ? "/api/documents/packagesignature" : "/api/documents"),
            tokenAuth.access_token,
            isSignPackage ? buildDocumentPackageDSS(documents, signer.dssCertID, setting.sign.detached, "sign", pinCode) :
              buildDocumentDSS(files[0].fullpath, signer.dssCertID, setting.sign.detached, "sign", undefined, pinCode))
            .then(
              (dataCMS) => {
                let i: number = 0;
                const outURIList: string[] = [];

                const directResult: any = {};
                directResult.results = [];
                directResult.operations = setting.operations.toJS();
                const directFiles: any = {};
                files.forEach((file: any) => {
                  directFiles[file.id] = { original: { ...file.toJS(), operation: 4 } };
                });

                files.forEach((file) => {
                  const outURI = fileNameForSign(folderOut, file);
                  const tcms: trusted.cms.SignedData = new trusted.cms.SignedData();
                  const contextCMS = isSignPackage ? dataCMS.Results[i] : dataCMS;
                  tcms.import(Buffer.from("-----BEGIN CMS-----" + "\n" + contextCMS + "\n" + "-----END CMS-----"), trusted.DataFormat.PEM);
                  tcms.save(outURI, format);
                  outURIList.push(outURI);
                  i++;

                  const newFileProps = this.getFileProps(outURI);
                  directResult.results.push({
                    id: Date.now() + Math.random(),
                    in: {
                      ...file.toJS(),
                    },
                    operation: SIGNING_OPERATION,
                    out: {
                      ...newFileProps,
                      operation: 3,
                    },
                    result: true,
                  });

                  directFiles[file.id] = {
                    ...directFiles[file.id],
                    signing_operation: {
                      out: {
                        ...newFileProps,
                        operation: 3,
                      },
                      result: true,
                    },
                  };
                });
                directResult.files = directFiles;
                packageSign(files, cert, policies, null, format, folderOut, outURIList, directResult);
              },
              (error) => {
                if (uploader) {
                  this.dispatchSignInterrupt();
                } else {
                  this.dispatchSignInDssFail(files, setting.operations.toJS(), error);
                }

                $(".toast-dssPerformOperation_failed").remove();
                Materialize.toast(error, 3000, "toast-dssPerformOperation_failed");
              },
            );
        }
      } else {

        if (setting.sign.detached) {
          policies.push("detached");
        }

        const signParams: ISignParams = {
          signModel: setting.sign.toJS(),
          tspModel: setting.tsp.toJS(),
          ocspModel: setting.ocsp.toJS(),
        };

        packageSign(files, cert, policies, signParams, format, folderOut);
      }
    }
  }

  dispatchSignInDssFail = (files: IFile[], operations: any, error: any) => {
    const directResult: any = {};
    directResult.results = [];
    directResult.operations = operations;
    const directFiles: any = {};

    files.forEach((file) => {
      logger.log({
        level: "error",
        message: error.message,
        operation: "Подпись",
        operationObject: {
          in: file.fullpath,
          out: "Null",
        },
        userName: USER_NAME,
      });
    });

    files.forEach((file) => {
      directResult.results.push({
        id: Date.now() + Math.random(),
        in: {
          ...file.toJS(),
        },
        operation: SIGNING_OPERATION,
        out: null,
        result: false,
      });

      directFiles[file.id] = {
        ...directFiles[file.id],
        signing_operation: {
          result: false,
        },
      };
    });

    directResult.files = directFiles;

    store.dispatch({
      payload: { status: false, directResult },
      type: MULTI_DIRECT_OPERATION + SUCCESS,
    });
    store.dispatch(push(LOCATION_RESULTS_MULTI_OPERATIONS));
  }

  dispatchSignInterrupt = () => {
    store.dispatch({
      type: PACKAGE_SIGN + INTERRUPT,
    });
  }

  getFileProps = (fullpath: string) => {
    const stat = fs.statSync(fullpath);
    const extension = extFile(fullpath);

    return {
      active: false,
      extension,
      extra: undefined,
      filename: path.basename(fullpath),
      filesize: stat.size,
      fullpath,
      id: md5(fullpath),
      mtime: stat.birthtime,
      remoteId: undefined,
      size: stat.size,
    };
  }

  resignDss = (filesAtt: IFilePackage, filesDet: IFilePackage, setting: any, cert: any,
    multipackage: boolean = false) => {
    const { signer, tokensAuth, users, policyDSS, uploader,
      createTransactionDSS, packageReSign } = this.props;
    const { pinCode } = this.state;
    const { localize, locale } = this.context;
    const user = users.get(signer.dssUserID);
    const tokenAuth = tokensAuth.get(signer.dssUserID);
    const signsIsDetached = filesAtt ? false : true;
    const files = signsIsDetached ? filesDet.files : filesAtt.files;
    const documents = signsIsDetached ? filesDet.documents : filesAtt.documents;
    const documentsId = signsIsDetached ? filesDet.documentsId : filesAtt.documentsId;
    const isSignPackage = files.length > 1;
    const policy = policyDSS.getIn([signer.dssUserID, "policy"]).filter(
      (item: any) => item.Action === (isSignPackage ? "SignDocuments" : "SignDocument"));
    const mfaRequired = policy[0].MfaRequired;
    const policies: string[] = [];
    const folderOut = setting.outfolder;
    let format = trusted.DataFormat.PEM;
    if (setting.sign.encoding !== localize("Settings.BASE", locale)) {
      format = trusted.DataFormat.DER;
    }

    if (mfaRequired) {
      const originalDocument = (signsIsDetached && !isSignPackage) ? documents[0].OriginalContent : "";
      createTransactionDSS(user.dssUrl,
        tokenAuth.access_token,
        buildTransaction(
          documents, signer.dssCertID, signsIsDetached,
          isSignPackage ? DSS_ACTIONS.SignDocuments : DSS_ACTIONS.SignDocument, "cosign", originalDocument, pinCode),
        documentsId)
        .then(
          (data1: any) => {
            //resign
            $(".toast-transaction_created_successful").remove();
            Materialize.toast(localize("DSS.transaction_created_successful", locale), 3000, "toast-transaction_created_successful");

            this.props.dssOperationConfirmation(
              user.authUrl.replace("/oauth", "/confirmation"),
              tokenAuth.access_token,
              data1,
              user.id)
              .then(
                (data2) => {
                  this.props.dssPerformOperation(
                    user.dssUrl + (isSignPackage ? "/api/documents/packagesignature" : "/api/documents"),
                    data2.AccessToken, pinCode ? { Signature: { PinCode: pinCode } } : undefined)
                    .then(
                      (dataCMS: any) => {
                        let i: number = 0;
                        const outURIList: string[] = [];

                        const directResult: any = {};
                        directResult.results = [];
                        directResult.operations = setting.operations.toJS();
                        const directFiles: any = {};
                        files.forEach((file: any) => {
                          directFiles[file.id] = { original: { ...file.toJS(), operation: 4 } };
                        });

                        files.forEach((file) => {
                          const outURI = fileNameForResign(folderOut, file);
                          const tcms: trusted.cms.SignedData = new trusted.cms.SignedData();
                          const contextCMS = isSignPackage ? dataCMS.Results[i] : dataCMS;
                          tcms.import(Buffer.from("-----BEGIN CMS-----" + "\n" + contextCMS + "\n" + "-----END CMS-----"), trusted.DataFormat.PEM);
                          tcms.save(outURI, format);
                          outURIList.push(outURI);
                          i++;

                          const newFileProps = this.getFileProps(outURI);
                          directResult.results.push({
                            id: Date.now() + Math.random(),
                            in: {
                              ...file.toJS(),
                            },
                            operation: SIGNING_OPERATION,
                            out: {
                              ...newFileProps,
                              operation: 3,
                            },
                            result: true,
                          });

                          directFiles[file.id] = {
                            ...directFiles[file.id],
                            signing_operation: {
                              out: {
                                ...newFileProps,
                                operation: 3,
                              },
                              result: true,
                            },
                          };
                        });
                        directResult.files = directFiles;
                        const isNeedToSignSecondPackage = !signsIsDetached && filesDet;
                        packageReSign(files, cert, policies, format, folderOut, outURIList,
                          directResult, isNeedToSignSecondPackage || multipackage,
                          isNeedToSignSecondPackage);
                        if (isNeedToSignSecondPackage) {
                          this.resignDss(null, filesDet, setting, cert, true);
                        } else {
                          this.setState({ pinCode: "" });
                        }
                      },
                      (error) => {
                        if (uploader) {
                          this.dispatchSignInterrupt();
                        } else {
                          this.dispatchSignInDssFail(files, setting.operations.toJS(), error);
                        }

                        $(".toast-dssPerformOperation_failed").remove();
                        Materialize.toast(error, 3000, "toast-dssPerformOperation_failed");

                        this.setState({ pinCode: "" });
                      },
                    );
                },
                (error) => {
                  if (uploader) {
                    this.dispatchSignInterrupt();
                  } else {
                    this.dispatchSignInDssFail(files, setting.operations.toJS(), error);
                  }

                  $(".toast-dssOperationConfirmation_failed").remove();
                  Materialize.toast(error, 3000, "toast-dssOperationConfirmation_failed");

                  this.setState({ pinCode: "" });
                },
              )
              .catch((error) => {
                if (uploader) {
                  this.dispatchSignInterrupt();
                } else {
                  this.dispatchSignInDssFail(files, setting.operations.toJS(), error);
                }

                $(".toast-dssOperationConfirmation_failed").remove();
                Materialize.toast(error, 3000, "toast-dssOperationConfirmation_failed");

                this.setState({ pinCode: "" });
              });
          },
          (error) => {
            if (uploader) {
              this.dispatchSignInterrupt();
            } else {
              this.dispatchSignInDssFail(files, setting.operations.toJS(), error);
            }

            $(".toast-transaction_created_failed").remove();
            Materialize.toast(localize("DSS.transaction_created_failed", locale), 3000, "toast-transaction_created_failed");

            $(".toast-createTransactionDSS_failed").remove();
            Materialize.toast(error, 3000, "toast-createTransactionDSS_failed");

            this.setState({ pinCode: "" });
          },
        );
    } else {
      const originalData = (signsIsDetached && !isSignPackage) ? documents[0].OriginalContent : "";
      this.props.dssPerformOperation(
        user.dssUrl + (isSignPackage ? "/api/documents/packagesignature" : "/api/documents"),
        tokenAuth.access_token,
        isSignPackage ? buildDocumentPackageDSS(documents, signer.dssCertID, signsIsDetached, "cosign", pinCode) :
          buildDocumentDSS(files[0].fullpath, signer.dssCertID, signsIsDetached, "cosign", originalData, pinCode))
        .then(
          (dataCMS: any) => {
            let i: number = 0;
            const outURIList: string[] = [];

            const directResult: any = {};
            directResult.results = [];
            directResult.operations = setting.operations.toJS();
            const directFiles: any = {};
            files.forEach((file: any) => {
              directFiles[file.id] = { original: { ...file.toJS(), operation: 4 } };
            });

            files.forEach((file) => {
              const outURI = fileNameForResign(folderOut, file);
              const tcms: trusted.cms.SignedData = new trusted.cms.SignedData();
              const contextCMS = isSignPackage ? dataCMS.Results[i] : dataCMS;
              const signResult = (contextCMS !== null);
              if (signResult) {
                tcms.import(Buffer.from("-----BEGIN CMS-----" + "\n" + contextCMS + "\n" + "-----END CMS-----"), trusted.DataFormat.PEM);
                tcms.save(outURI, format);
                outURIList.push(outURI);
              }
              i++;

              const newFileProps = this.getFileProps(outURI);
              directResult.results.push({
                id: Date.now() + Math.random(),
                in: {
                  ...file.toJS(),
                },
                operation: SIGNING_OPERATION,
                out: {
                  ...newFileProps,
                  operation: 3,
                },
                result: signResult,
              });

              directFiles[file.id] = {
                ...directFiles[file.id],
                signing_operation: {
                  out: {
                    ...newFileProps,
                    operation: 3,
                  },
                  result: signResult,
                },
              };
            });
            directResult.files = directFiles;
            const isNeedToSignSecondPackage = !signsIsDetached && filesDet;
            packageReSign(files, cert, policies, format, folderOut, outURIList, directResult,
              isNeedToSignSecondPackage || multipackage, isNeedToSignSecondPackage);
            if (isNeedToSignSecondPackage) {
              this.resignDss(null, filesDet, setting, cert, multipackage);
            } else {
              this.setState({ pinCode: "" });
            }
          },
          (error) => {
            if (uploader) {
              this.dispatchSignInterrupt();
            } else {
              this.dispatchSignInDssFail(files, setting.operations.toJS(), error);
            }

            $(".toast-dssPerformOperation_failed").remove();
            Materialize.toast(error, 3000, "toast-dssPerformOperation_failed");

            this.setState({ pinCode: "" });
          },
        );
    }
  }

  resign = (files: IFile[], cert: any, multipackage: boolean = false) => {
    const { signer, tokensAuth, users, uploader, policyDSS } = this.props;
    let { setting } = this.props;
    // tslint:disable-next-line:no-shadowed-variable
    const { deleteFile, selectFile, operationRemoteAction } = this.props;
    const { localize, locale } = this.context;

    const isSockets = this.isFilesFromSocket();

    if (isSockets) {
      setting = setting.set("outfolder", "");

      setting = operationRemoteAction && operationRemoteAction.isDetachedSign ? setting.setIn(["sign", "detached"], true) : setting.setIn(["sign", "detached"], false);

      setting = setting.setIn(["sign", "time"], true);
    }

    if (files.length > 0) {
      const policies: string[] = [];
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

      if (signer.dssUserID) {
        const isSignPackage = files.length > 1;
        const policy = policyDSS.getIn([signer.dssUserID, "policy"]).filter(
          (item: any) => item.Action === (isSignPackage ? "SignDocuments" : "SignDocument"));

        let OriginalContent: string;
        const documentsAttached: IDocumentContent[] = [];
        const documentsIdAttached: string[] = [];
        const documentsDetached: IDocumentContent[] = [];
        const documentsIdDetached: string[] = [];

        let filesAttached = [];
        let filesDetached = [];

        files.forEach((file) => {
          const uri = file.fullpath;
          let tempURI: string = "";
          const sd: trusted.cms.SignedData = signs.loadSign(uri);
          const signIsDetached = sd.isDetached();
          if (signIsDetached) {
            tempURI = uri.substring(0, uri.lastIndexOf("."));
            if (!fileExists(tempURI)) {
              tempURI = dialog.showOpenDialogSync(null,
                { title: localize("Sign.sign_content_file", window.locale) + path.basename(uri), properties: ["openFile"] });
              if (tempURI) {
                tempURI = tempURI[0];
              }
              if (!tempURI || !fileExists(tempURI)) {
                $(".toast-verify_get_content_failed").remove();
                Materialize.toast(localize("Sign.verify_get_content_failed", window.locale), 2000, "toast-verify_get_content_failed");
                return;
              }
            }
            if (tempURI) {
              OriginalContent = fs.readFileSync(tempURI, "base64");
            }
            filesDetached.push(file);
          } else {
            filesAttached.push(file);
          }

          const Content = fs.readFileSync(uri, "base64");
          const documentContent: IDocumentContent = {
            Content,
            Name: path.basename(file.fullpath),
            OriginalContent,
          };

          if (signIsDetached) {
            documentsDetached.push(documentContent);
            documentsIdDetached.push(file.id);
          } else {
            documentsAttached.push(documentContent);
            documentsIdAttached.push(file.id);
          }
        });

        const packageAtt = {
          files: filesAttached,
          documents: documentsAttached,
          documentsId: documentsIdAttached,
        };
        const packageDet = {
          files: filesDetached,
          documents: documentsDetached,
          documentsId: documentsIdDetached,
        };
        if ((filesDetached.length > 0) && (filesAttached.length > 0)) {
          this.resignDss(packageAtt, packageDet, setting, cert, multipackage);
        } else if (filesAttached.length > 0) {
          this.resignDss(packageAtt, null, setting, cert, multipackage);
        } else {
          this.resignDss(null, packageDet, setting, cert, multipackage);
        }

      } else {

        const signParams: ISignParams = {
          signModel: setting.sign.toJS(),
          tspModel: setting.tsp.toJS(),
          ocspModel: setting.ocsp.toJS(),
        };

        const remoteFilesToUpload: any[] = [];

        files.every((file) => {
          const newPath = trustedSign.resignFile(file.fullpath, cert, policies, signParams, format, folderOut);

          if (newPath) {
            if (file.remoteId) {

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

                const extra = file.extra;

                if (extra && extra.signType === "0" || extra.signType === "1") {
                  extra.signType = parseInt(extra.signType, 10);
                }

                remoteFilesToUpload.push({
                  file,
                  newPath,
                  normalyzeSignatureInfo
                });
              }
            } else {
              deleteFile(file.id);
              selectFile(newPath);
            }
          } else {
            res = false;

            if (file.remoteId) {
              return false;
            }
          }

          return true;
        });

        if (uploader) {
          if (!res) {
            this.dispatchSignInterrupt();
            $(".toast-files_signed_failed").remove();
            Materialize.toast(localize("Sign.files_signed_failed", locale), 7000, "toast-files_signed_failed");

            return;
          } else {
            const infoRequest = {
              jsonrpc: "2.0",
              method: "signAndEncrypt.outDirectResults",
              params: {
                directResults: [],
                id: operationRemoteAction.id,
              },
            };

            remoteFilesToUpload.forEach((uploadData: any) => {
              infoRequest.params.directResults.push({
                id: uploadData.file.remoteId,
                out: fs.readFileSync(uploadData.newPath, "base64"),
                signers: uploadData.normalyzeSignatureInfo,
              });

              deleteFile(uploadData.file.id);
            });

            postRequest(uploader, JSON.stringify(infoRequest)).then(
              (respData: any) => {
                const remote = window.electron.remote;
                remote.getCurrentWindow().minimize();
                store.dispatch(finishCurrentUrlCmd());
                removeWarningMessage();
              },
              (error) => {
                store.dispatch(finishCurrentUrlCmd(false));
                removeWarningMessage();
                // tslint:disable-next-line: no-console
                console.log("Error sending of diagnostics info with id " + operationRemoteAction.id
                  + ". Error description: " + error);
              },
            );
          }
        }

        removeUrlAction();

        if (res) {
          $(".toast-files_resigned").remove();
          Materialize.toast(localize("Sign.files_resigned", locale), 2000, "toast-files_resigned");
        } else {
          $(".toast-files_resigned_failed").remove();
          Materialize.toast(localize("Sign.files_resigned_failed", locale), 2000, "toast-files_resigned_failed");
        }
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
    const { activeFilesArr, signatures, operationRemoteAction, uploader } = this.props;
    // tslint:disable-next-line:no-shadowed-variable
    const { verifySignature } = this.props;
    const { localize, locale } = this.context;

    activeFilesArr.forEach((file) => {
      verifySignature(file.id);
    });

    if (uploader) {
      const verifySignResults: any[] = [];

      for (const file of activeFilesArr) {
        if (file && file.remoteId) {
          const signers: any[] = [];
          let res = true;
  
          for (const signature of signatures) {
            if (file.id === signature.fileId) {
              if (!signature.status_verify) {
                res = false;
              }
  
              const subjectCert = signature.certs[signature.certs.length - 1];
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
  
              signers.push({
                  serialNumber: subjectCert.serial,
                  subjectFriendlyName: signature.subject,
                  status: subjectCert.status,
                  issuerFriendlyName: subjectCert.issuerFriendlyName,
                  notBefore: new Date(subjectCert.notBefore).getTime(),
                  notAfter: new Date(subjectCert.notAfter).getTime(),
                  digestAlgorithm: subjectCert.signatureDigestAlgorithm,
                  organizationName: subjectCert.organizationName,
                  signingTime: signature.signingTime ? new Date(signature.signingTime).getTime() : undefined,
                  subjectName: subjectCert.subjectName,
                  issuerName: subjectCert.issuerName,
                  x509,
              });
            }
          };
  
          verifySignResults.push({
            id: file.remoteId,
            status: res,
            signers: [...signers]
          })
        }
      }
  
      const infoRequest = {
        jsonrpc: "2.0",
        method: "signAndEncrypt.verifySignResults",
        params: {
          verifyResults: [...verifySignResults],
          id: operationRemoteAction.id,
        },
      };
 
      postRequest(uploader, JSON.stringify(infoRequest)).then(
        (respData: any) => {
          this.props.removeAllFiles();
          removeUrlAction();
          const remote = window.electron.remote;
          remote.getCurrentWindow().minimize();
          store.dispatch(finishCurrentUrlCmd());
          removeWarningMessage();
        },
        (error) => {
          store.dispatch(finishCurrentUrlCmd(false));
          removeWarningMessage();
          // tslint:disable-next-line: no-console
          console.log("Error sending of diagnostics info with id " + operationRemoteAction.id
            + ". Error description: " + error);
        },
      );
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

      const forDecryptInDSS = [];
      const filesForDecryptInLocalCSP = [];

      for (const file of activeFilesArr) {
        let certWithKey: trusted.pki.Certificate;

        try {
          const uri = file.fullpath;
          const format = fileCoding(uri);
          const cipher = new trusted.pki.Cipher();

          const haveLocalRecipient = true;
          const haveDSSRecipient = false;
          const dssRecipient = undefined;

          /*  const ris = cipher.getRecipientInfos(uri, format);

            let ri: trusted.cms.CmsRecipientInfo;
            let haveLocalRecipient = false;
            let haveDSSRecipient = false;
            let dssRecipient;

              for (let i = 0; i < ris.length; i++) {
            ri = ris.items(i);

          certWithKey = this.props.mapCertificates
            .get("entities")
            .find((item) => item.issuerName === ri.issuerName && item.serial === ri.serialNumber && item.key);

                if (certWithKey) {
                  if (!certWithKey.service) {
            haveLocalRecipient = true;
          break;
                  } else {
            haveDSSRecipient = true;
          dssRecipient = certWithKey;
        }
                } else {
            res = false;
        }
      }*/

          if (haveLocalRecipient) {
            filesForDecryptInLocalCSP.push(file);
          } else if (haveDSSRecipient) {
            forDecryptInDSS.push({ file, dssRecipient });
          }
        } catch (e) {
          //
        }
      }

      if (filesForDecryptInLocalCSP && filesForDecryptInLocalCSP.length) {
        filesForDecryptInLocalCSP.forEach((file) => {
          const newPath = trustedEncrypts.decryptFile(file.fullpath, folderOut);

          if (newPath) {
            deleteFile(file.id);
            selectFile(newPath);
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

  checkEnableMultiOperations = () => {
    const { setting } = this.props;
    const { operations } = setting;

    const toperations = Map(operations);

    if (!operations.reverse_operations) {
      let flag = true;
      let operationsCount = 0;

      toperations.map((value: boolean, operationKey: string) => {
        if (value) {
          operationsCount++;
          let result = false;

          if (operationKey === SIGNING_OPERATION) {
            result = this.checkEnableOperationButton(SIGN);
          } else if (operationKey === ENCRYPTION_OPERATION) {
            result = this.checkEnableOperationButton(ENCRYPT);
          } else if (operationKey === ARCHIVATION_OPERATION) {
            result = this.checkEnableOperationButton(ARCHIVE);
          } else if (operationKey === "save_copy_to_documents") {
            result = this.checkEnableOperationButton(ARCHIVE);
          } else if (operationKey === "save_result_to_folder") {
            result = !(!toperations.get(SIGNING_OPERATION) && !toperations.get(ENCRYPTION_OPERATION) && !toperations.get(ARCHIVATION_OPERATION))
              || !!toperations.get("save_copy_to_documents");
          } else {
            result = true;
          }

          flag = flag && result;
        }
      });

      flag = operationsCount ? flag : false;

      return flag;
    } else {
      return this.checkEnableOperationButton(MULTI_REVERSE);
    }
  }

  checkEnableOperationButton = (operation: string) => {
    const { activeFilesArr, isDocumentsReviewed, filesInTransactionList, signer, recipients } = this.props;

    if (!activeFilesArr.length) {
      return false;
    }

    for (const document of activeFilesArr) {
      if (filesInTransactionList.includes(document.id)) {
        return false;
      }
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

      case ARCHIVE:

      case REMOVE:
        return true;

      case UNZIPPING:
        for (const document of activeFilesArr) {
          if (document.extension !== "zip") {
            return false;
          }
        }

        return true;

      case MULTI_REVERSE:
        for (const document of activeFilesArr) {
          if (document.extension !== "zip" && document.extension !== "enc" && document.extension !== "sig") {
            return false;
          }
        }

        return true;

      default:
        return false;
    }
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
    const { loadingFiles, operationIsRemote } = this.props;

    if (operationIsRemote || loadingFiles.length) {
      return true;
    }

    return false;
  }

  signAndCosignInDss = (filesSign: IFile[], filesReSign: IFile[], cert: any) => {
    const { signer, tokensAuth, users, policyDSS } = this.props;
    let { setting } = this.props;
    // tslint:disable-next-line:no-shadowed-variable
    const { packageSign, createTransactionDSS, dssPerformOperation, operationRemoteAction, uploader } = this.props;
    const { localize, locale } = this.context;
    const { pinCode } = this.state;

    const isSockets = this.isFilesFromSocket();

    if (isSockets) {
      setting = setting.set("outfolder", "");
      setting = operationRemoteAction && operationRemoteAction.isDetachedSign ? setting.setIn(["sign", "detached"], true) : setting.setIn(["sign", "detached"], false);
      setting = setting.setIn(["sign", "time"], true);
    }

    if (filesSign.length > 0) {
      const policies: string[] = [];

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

      if (signer.dssUserID) {
        const user = users.get(signer.dssUserID);
        const tokenAuth = tokensAuth.get(signer.dssUserID);
        const isSignPackage = filesSign.length > 1;
        const policy = policyDSS.getIn([signer.dssUserID, "policy"]).filter(
          (item: any) => item.Action === (isSignPackage ? "SignDocuments" : "SignDocument"));
        const mfaRequired = policy[0].MfaRequired;

        const documents: IDocumentContent[] = [];
        const documentsId: string[] = [];

        filesSign.forEach((file) => {
          const Content = fs.readFileSync(file.fullpath, "base64");
          const documentContent: IDocumentContent = {
            Content,
            Name: path.basename(file.fullpath),
          };
          documents.push(documentContent);
          documentsId.push(file.id);
        });

        if (mfaRequired) {
          createTransactionDSS(user.dssUrl,
            tokenAuth.access_token,
            buildTransaction(documents, signer.dssCertID, setting.sign.detached,
              isSignPackage ? DSS_ACTIONS.SignDocuments : DSS_ACTIONS.SignDocument,
              "sign", undefined, pinCode),
            documentsId)
            .then(
              (data: any) => {
                $(".toast-transaction_created_successful").remove();
                Materialize.toast(localize("DSS.transaction_created_successful", locale), 3000, "toast-transaction_created_successful");

                this.props.dssOperationConfirmation(
                  user.authUrl.replace("/oauth", "/confirmation"),
                  tokenAuth.access_token,
                  data,
                  user.id)
                  .then(
                    (data2) => {
                      this.props.dssPerformOperation(
                        user.dssUrl + (isSignPackage ? "/api/documents/packagesignature" : "/api/documents"),
                        data2.AccessToken, pinCode ? { Signature: { PinCode: pinCode } } : undefined)
                        .then(
                          (dataCMS: any) => {
                            let i: number = 0;
                            const outURIList: string[] = [];

                            const directResult: any = {};
                            directResult.results = [];
                            directResult.operations = setting.operations.toJS();
                            const directFiles: any = {};
                            filesSign.forEach((file: any) => {
                              directFiles[file.id] = { original: { ...file.toJS(), operation: 4 } };
                            });

                            filesSign.forEach((file) => {
                              const outURI = fileNameForSign(folderOut, file);
                              const tcms: trusted.cms.SignedData = new trusted.cms.SignedData();
                              const contextCMS = isSignPackage ? dataCMS.Results[i] : dataCMS;
                              tcms.import(Buffer.from("-----BEGIN CMS-----" + "\n" + contextCMS + "\n" + "-----END CMS-----"), trusted.DataFormat.PEM);
                              tcms.save(outURI, format);
                              outURIList.push(outURI);
                              i++;

                              const newFileProps = this.getFileProps(outURI);
                              directResult.results.push({
                                id: Date.now() + Math.random(),
                                in: {
                                  ...file.toJS(),
                                },
                                operation: SIGNING_OPERATION,
                                out: {
                                  ...newFileProps,
                                  operation: 3,
                                },
                                result: true,
                              });

                              directFiles[file.id] = {
                                ...directFiles[file.id],
                                signing_operation: {
                                  out: {
                                    ...newFileProps,
                                    operation: 3,
                                  },
                                  result: true,
                                },
                              };
                            });
                            directResult.files = directFiles;
                            packageSign(filesSign, cert, policies, null, format, folderOut, outURIList, directResult, true);
                            this.resign(filesReSign, cert, true);
                          },
                          (error) => {
                            if (uploader) {
                              this.dispatchSignInterrupt();
                            } else {
                              this.dispatchSignInDssFail(filesSign, setting.operations.toJS(), error);
                            }

                            $(".toast-dssPerformOperation_failed").remove();
                            Materialize.toast(error, 3000, "toast-dssPerformOperation_failed");
                            this.setState({ pinCode: "" });
                          },
                        );
                    },
                    (error) => {
                      if (uploader) {
                        this.dispatchSignInterrupt();
                      } else {
                        this.dispatchSignInDssFail(filesSign, setting.operations.toJS(), error);
                      }

                      $(".toast-dssOperationConfirmation_failed").remove();
                      Materialize.toast(error, 3000, "toast-dssOperationConfirmation_failed");
                      this.setState({ pinCode: "" });
                    },
                  )
                  .catch((error) => {
                    if (uploader) {
                      this.dispatchSignInterrupt();
                    } else {
                      this.dispatchSignInDssFail(filesSign, setting.operations.toJS(), error);
                    }

                    $(".toast-dssOperationConfirmation_failed").remove();
                    Materialize.toast(error, 3000, "toast-dssOperationConfirmation_failed");
                    this.setState({ pinCode: "" });
                  });
              },
              (error) => {
                $(".toast-transaction_created_failed").remove();
                Materialize.toast(localize("DSS.transaction_created_failed", locale), 3000, "toast-transaction_created_failed");

                $(".toast-createTransactionDSS_failed").remove();
                Materialize.toast(error, 3000, "toast-createTransactionDSS_failed");
                this.setState({ pinCode: "" });
              },
            );
        } else {
          dssPerformOperation(
            user.dssUrl + (isSignPackage ? "/api/documents/packagesignature" : "/api/documents"),
            tokenAuth.access_token,
            isSignPackage ? buildDocumentPackageDSS(documents, signer.dssCertID, setting.sign.detached, "sign", pinCode) :
              buildDocumentDSS(filesSign[0].fullpath, signer.dssCertID, setting.sign.detached, "sign", undefined, pinCode))
            .then(
              (dataCMS) => {
                let i: number = 0;
                const outURIList: string[] = [];

                const directResult: any = {};
                directResult.results = [];
                directResult.operations = setting.operations.toJS();
                const directFiles: any = {};
                filesSign.forEach((file: any) => {
                  directFiles[file.id] = { original: { ...file.toJS(), operation: 4 } };
                });

                filesSign.forEach((file) => {
                  const outURI = fileNameForSign(folderOut, file);
                  const tcms: trusted.cms.SignedData = new trusted.cms.SignedData();
                  const contextCMS = isSignPackage ? dataCMS.Results[i] : dataCMS;
                  tcms.import(Buffer.from("-----BEGIN CMS-----" + "\n" + contextCMS + "\n" + "-----END CMS-----"), trusted.DataFormat.PEM);
                  tcms.save(outURI, format);
                  outURIList.push(outURI);
                  i++;

                  const newFileProps = this.getFileProps(outURI);
                  directResult.results.push({
                    id: Date.now() + Math.random(),
                    in: {
                      ...file.toJS(),
                    },
                    operation: SIGNING_OPERATION,
                    out: {
                      ...newFileProps,
                      operation: 3,
                    },
                    result: true,
                  });

                  directFiles[file.id] = {
                    ...directFiles[file.id],
                    signing_operation: {
                      out: {
                        ...newFileProps,
                        operation: 3,
                      },
                      result: true,
                    },
                  };
                });
                directResult.files = directFiles;
                packageSign(filesSign, cert, policies, null, format, folderOut, outURIList, directResult, true);
                this.resign(filesReSign, cert, true);
                this.setState({ pinCode: "" });
              },
              (error) => {
                if (uploader) {
                  this.dispatchSignInterrupt();
                } else {
                  this.dispatchSignInDssFail(filesSign, setting.operations.toJS(), error);
                }

                $(".toast-dssPerformOperation_failed").remove();
                Materialize.toast(error, 3000, "toast-dssPerformOperation_failed");
                this.setState({ pinCode: "" });
              },
            );
        }
      }
    }
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
    dssResponses: state.dssResponses.entities,
    files: mapToArr(state.files.entities),
    filesInTransactionList: filesInTransactionsSelector(state),
    inactiveFilesArr: mapToArr(activeFilesSelector(state, { active: false })),
    isDocumentsReviewed: state.files.documentsReviewed,
    lic_error: state.license.lic_error,
    licenseStatus: state.license.status,
    loadingFiles: mapToArr(loadingRemoteFilesSelector(state, { loading: true })),
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
    tokensDss: state.tokens.tokensDss,
    users: state.users.entities,
    transactionDSS: mapToArr(state.transactionDSS.entities),
    policyDSS: state.policyDSS.entities,
    operationIsRemote: state.urlActions.performed || state.urlActions.performing,
    operationRemoteAction: state.urlActions.action,
    signingPackage: state.signatures.signingPackage,
    packageSignResult: state.signatures.packageSignResult,
  };
}, {
  activeFile, activeSetting, changeDefaultSettings, createTransactionDSS, dssPerformOperation, dssOperationConfirmation,
  deleteSetting, deleteFile, deleteRecipient, documentsReviewed,
  filePackageSelect, filePackageDelete, multiDirectOperation,
  multiReverseOperation,
  packageSign, packageReSign, saveSettings, selectFile,
  verifyCertificate, selectSignerCertificate, verifySignature, multiOperationStart,
})(SignatureAndEncryptRightColumnSettings);

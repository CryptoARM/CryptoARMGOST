import * as fs from "fs";
import { OrderedMap } from "immutable";
import * as path from "path";
import PropTypes, { any } from "prop-types";
import React from "react";
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
import { createTransactionDSS, dssOperationConfirmation, dssPerformOperation } from "../../AC/dssActions";
import {
  activeSetting,
} from "../../AC/settingsActions";
import {
  DECRYPT, DSS_ACTIONS, ENCRYPT, HOME_DIR,
  LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT, LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE,
  LOCATION_SETTINGS_CONFIG,
  LOCATION_SETTINGS_SELECT, REMOVE, SIGN, UNSIGN, USER_NAME, VERIFY,
} from "../../constants";
import { activeFilesSelector, connectedSelector, filesInTransactionsSelector, loadingRemoteFilesSelector } from "../../selectors";
import { DECRYPTED, ENCRYPTED, ERROR, SIGNED, UPLOADED } from "../../server/constants";
import * as trustedEncrypts from "../../trusted/encrypt";
import * as jwt from "../../trusted/jwt";
import { checkLicense } from "../../trusted/jwt";
import * as signs from "../../trusted/sign";
import * as trustedSign from "../../trusted/sign";
import { bytesToSize, dirExists, fileCoding, fileNameForResign, fileNameForSign, mapToArr } from "../../utils";
import { fileExists } from "../../utils";
import { buildDocumentDSS, buildDocumentPackageDSS, buildTransaction } from "../../utils/dss/helpers";
import logger from "../../winstonLogger";
import ConfirmTransaction from "../DSS/ConfirmTransaction";
import PinCodeForDssContainer from "../DSS/PinCodeForDssContainer";
import ReAuth from "../DSS/ReAuth";
import Modal from "../Modal";
import RecipientsList from "../RecipientsList";
import SignerInfo from "../Signature/SignerInfo";

const dialog = window.electron.remote.dialog;

interface ISignatureAndEncryptRightColumnSettingsProps {
  activeFilesArr: any;
  isDefaultFilters: boolean;
  isDocumentsReviewed: boolean;
  dssResponses: OrderedMap<any, any>;
  loadingFiles: any;
  files: any;
  packageSignResult: any;
  removeAllFiles: () => void;
  createTransactionDSS: (url: string, token: string, body: ITransaction, fileId: string[]) => Promise<any>;
  dssPerformOperation: (url: string, token: string, body?: IDocumentDSS | IDocumentPackageDSS) => Promise<any>;
  dssOperationConfirmation: (url: string, token: string, TransactionTokenId: string, dssUserID: string) => Promise<any>;
  signatures: any;
  signedPackage: any;
  tokensAuth: any;
  tokensDss: any;
  users: any;
  transactionDSS: any;
  policyDSS: any;
}

interface ISignatureAndEncryptRightColumnSettingsState {
  currentOperation: string;
  pinCode: string;
  searchValue: string;
  showModalDssPin: boolean;
  showModalDssResponse: boolean;
  showModalReAuth: boolean;
}

class SignatureAndEncryptRightColumnSettings extends React.Component<ISignatureAndEncryptRightColumnSettingsProps, ISignatureAndEncryptRightColumnSettingsState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: ISignatureAndEncryptRightColumnSettingsProps) {
    super(props);

    this.state = {
      currentOperation: "",
      pinCode: "",
      searchValue: "",
      showModalDssPin: false,
      showModalDssResponse: false,
      showModalReAuth: false,
    };
  }

  componentDidMount() {
    const { dssResponses } = this.props;

    $(".btn-floated").dropdown({
      alignment: "left",
      belowOrigin: false,
      gutter: 0,
      inDuration: 300,
      outDuration: 225,
    });

    if (dssResponses && dssResponses.size) {
      this.handleCloseModalReAuth();
      this.handleShowModalDssResponse();
    }
  }

  componentDidUpdate(prevProps: ISignatureAndEncryptRightColumnSettingsProps, prevState: ISignatureAndEncryptRightColumnSettingsState) {
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
  }

  render() {
    const { localize, locale } = this.context;
    const { activeFiles, isDocumentsReviewed, recipients, setting, settings, signer } = this.props;
    const { file } = this.state;

    const disabledNavigate = this.isFilesFromSocket();
    const classDisabled = disabledNavigate ? "disabled" : "";

    return (
      <React.Fragment>
        <div className="col s10">
          <div className="primary-text">Настройки:</div>
          <hr />
        </div>
        <div className="col s2">
          <div className="right import-col">
            <a className="btn-floated" data-activates="dropdown-btn-settings">
              <i className="file-setting-item waves-effect material-icons secondary-content">more_vert</i>
            </a>
            <ul id="dropdown-btn-settings" className="dropdown-content">
              <Link to={LOCATION_SETTINGS_CONFIG}>
                <li><a onClick={() => {
                  this.props.activeSetting(this.props.setting.id);
                }}>Изменить</a></li>
              </Link>
              {
                settings && settings.size > 1 ?
                  <Link to={LOCATION_SETTINGS_SELECT}>
                    <li>
                      <a onClick={() => {
                        this.props.activeSetting(this.props.setting.id);
                      }}>Выбрать</a>
                    </li>
                  </Link> :
                  null
              }
            </ul>
          </div>
        </div>
        <div className="col s12 valign-wrapper">
          <div className="col s2">
            <div className="setting" />
          </div>
          <div className="col s10">
            <div className="collection-title">{setting.name}</div>
          </div>
        </div>

        <div className="row" />

        <div className="col s10">
          <div className="primary-text">{localize("Sign.signer_cert", locale)}</div>
          <hr />
        </div>
        <div className="col s2">
          <div className="right import-col">
            <a className="btn-floated" data-activates="dropdown-btn-signer">
              <i className="file-setting-item waves-effect material-icons secondary-content">more_vert</i>
            </a>
            <ul id="dropdown-btn-signer" className="dropdown-content">
              <Link to={LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE}>
                <li><a onClick={() => {
                  this.props.activeSetting(this.props.setting.id);
                }}>Заменить</a></li>
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
                  onClick={() => {
                    this.props.activeSetting(this.props.setting.id);
                  }}
                  style={{ width: "100%" }}>
                  {localize("Settings.Choose", locale)}
                </a>
              </Link>
            </div>
        }
        <div className="row" />

        <div className="col s10">
          <div className="primary-text">Сертификаты шифрования:</div>
          <hr />
        </div>

        <div className={`col s2 ${classDisabled}`}>
          <div className="right import-col">
            <a className="btn-floated" data-activates="dropdown-btn-encrypt">
              <i className={`file-setting-item waves-effect material-icons secondary-content ${classDisabled}`}>more_vert</i>
            </a>
            <ul id="dropdown-btn-encrypt" className="dropdown-content">
              <Link to={LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT}>
                <li><a onClick={() => {
                  this.props.activeSetting(this.props.setting.id);
                }}>{localize("Settings.add", locale)}</a></li>
              </Link>
              <li><a onClick={() => this.handleCleanRecipientsList()}>{localize("Common.clear", locale)}</a></li>
            </ul>
          </div>
        </div>
        {
          (recipients && recipients.length) ?
            <div style={{ height: "calc(100vh - 400px)" }}>
              <div className={`add-certs ${classDisabled}`}>
                <RecipientsList recipients={recipients} handleRemoveRecipient={(recipient) => this.props.deleteRecipient(recipient.id)} />
              </div>
            </div> :
            <div className={`col s12 ${classDisabled}`}>
              <Link to={LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT}>
                <a onClick={() => {
                  this.props.activeSetting(this.props.setting.id);
                }}
                  className={`btn btn-outlined waves-effect waves-light ${classDisabled}`}
                  style={{ width: "100%" }}>
                  {localize("Settings.Choose", locale)}
                </a>
              </Link>
            </div>
        }

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
                  <label htmlFor={"filesview"} className="truncate" style={{fontSize: "0.875rem"}}>
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
        {this.showModalReAuth()}
        {this.showModalDssPin()}
        {this.showModalDssResponse()}
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

  toggleDocumentsReviewed = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { documentsReviewed, isDocumentsReviewed } = this.props;

    documentsReviewed(!isDocumentsReviewed);
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
    const { setting, signer, tokensAuth, users, policyDSS } = this.props;
    // tslint:disable-next-line:no-shadowed-variable
    const { packageSign, createTransactionDSS, dssPerformOperation } = this.props;
    const { localize, locale } = this.context;
    const { pinCode } = this.state;

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
                        data2.AccessToken, pinCode ? { "Signature": { "PinCode": pinCode } } : undefined)
                        .then(
                          (dataCMS: any) => {
                            let i: number = 0;
                            let outURIList: string[] = [];
                            files.forEach((file) => {
                              const outURI = fileNameForSign(folderOut, file);
                              const tcms: trusted.cms.SignedData = new trusted.cms.SignedData();
                              const contextCMS = isSignPackage ? dataCMS.Results[i] : dataCMS;
                              tcms.import(Buffer.from("-----BEGIN CMS-----" + "\n" + contextCMS + "\n" + "-----END CMS-----"), trusted.DataFormat.PEM);
                              tcms.save(outURI, format);
                              outURIList.push(outURI);
                              i++;
                            });
                            packageSign(files, cert, policies, format, folderOut, outURIList);
                          },
                          (error) => {
                            $(".toast-dssPerformOperation_failed").remove();
                            Materialize.toast(error, 3000, "toast-dssPerformOperation_failed");
                          },
                        );
                    },
                    (error) => {
                      $(".toast-dssOperationConfirmation_failed").remove();
                      Materialize.toast(error, 3000, "toast-dssOperationConfirmation_failed");
                    },
                  )
                  .catch((error) => {
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
                let outURIList: string[] = [];
                files.forEach((file) => {
                  const outURI = fileNameForSign(folderOut, file);
                  const tcms: trusted.cms.SignedData = new trusted.cms.SignedData();
                  const contextCMS = isSignPackage ? dataCMS.Results[i] : dataCMS;
                  tcms.import(Buffer.from("-----BEGIN CMS-----" + "\n" + contextCMS + "\n" + "-----END CMS-----"), trusted.DataFormat.PEM);
                  tcms.save(outURI, format);
                  outURIList.push(outURI);
                  i++;
                });
                packageSign(files, cert, policies, format, folderOut, outURIList);
              },
              (error) => {
                $(".toast-dssPerformOperation_failed").remove();
                Materialize.toast(error, 3000, "toast-dssPerformOperation_failed");
              },
            );
        }
      } else {
        if (setting.sign.detached) {
          policies.push("detached");
        }

        if (setting.sign.timestamp) {
          policies.splice(0, 1);
        }

        packageSign(files, cert, policies, format, folderOut);
      }
    }
  }

  resign = (files: IFile[], cert: any) => {
    const { connections, connectedList, setting, signer, tokensAuth, users, uploader, policyDSS } = this.props;
    // tslint:disable-next-line:no-shadowed-variable
    const { deleteFile, selectFile, createTransactionDSS, packageReSign } = this.props;
    const { localize, locale } = this.context;
    const { pinCode } = this.state;

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

      if (signer.dssUserID) {
        const user = users.get(signer.dssUserID);
        const tokenAuth = tokensAuth.get(signer.dssUserID);
        const isSignPackage = files.length > 1;
        const policy = policyDSS.getIn([signer.dssUserID, "policy"]).filter(
          (item: any) => item.Action === (isSignPackage ? "SignDocuments" : "SignDocument"));
        const mfaRequired = policy[0].MfaRequired;

        let originalData = "";
        let OriginalContent: string;
        const documents: IDocumentContent[] = [];
        const documentsId: string[] = [];

        files.forEach((file) => {
          const uri = file.fullpath;
          let tempURI: string = "";
          const sd: trusted.cms.SignedData = signs.loadSign(uri);
          if (sd.isDetached()) {
            tempURI = uri.substring(0, uri.lastIndexOf("."));
            if (!fileExists(tempURI)) {
              tempURI = dialog.showOpenDialog(null,
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
            if (tempURI && isSignPackage) {
              OriginalContent = fs.readFileSync(tempURI, "base64");
            } else {
              originalData = fs.readFileSync(tempURI, "base64");
            }
          }
          const Content = fs.readFileSync(uri, "base64");
          const documentContent: IDocumentContent = {
            Content,
            Name: path.basename(file.fullpath),
            OriginalContent,
          };
          documents.push(documentContent);
          documentsId.push(file.id);
        });

        if (mfaRequired) {
          createTransactionDSS(user.dssUrl,
            tokenAuth.access_token,
            buildTransaction(
              documents, signer.dssCertID, setting.sign.detached,
              isSignPackage ? DSS_ACTIONS.SignDocuments : DSS_ACTIONS.SignDocument, "cosign", originalData, pinCode),
            documentsId)
            .then(
              (data1: any) => {
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
                        data2.AccessToken, pinCode ? { "Signature": { "PinCode": pinCode } } : undefined)
                        .then(
                          (dataCMS: any) => {
                            let i: number = 0;
                            let outURIList: string[] = [];
                            files.forEach((file) => {
                              const outURI = fileNameForResign(folderOut, file);
                              const tcms: trusted.cms.SignedData = new trusted.cms.SignedData();
                              const contextCMS = isSignPackage ? dataCMS.Results[i] : dataCMS;
                              tcms.import(Buffer.from("-----BEGIN CMS-----" + "\n" + contextCMS + "\n" + "-----END CMS-----"), trusted.DataFormat.PEM);
                              tcms.save(outURI, format);
                              outURIList.push(outURI);
                              i++;
                            });
                            packageReSign(files, cert, policies, format, folderOut, outURIList);
                          },
                          (error) => {
                            $(".toast-dssPerformOperation_failed").remove();
                            Materialize.toast(error, 3000, "toast-dssPerformOperation_failed");
                          },
                        );
                    },
                    (error) => {
                      $(".toast-dssOperationConfirmation_failed").remove();
                      Materialize.toast(error, 3000, "toast-dssOperationConfirmation_failed");
                    },
                  )
                  .catch((error) => {
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
          this.props.dssPerformOperation(
            user.dssUrl + (isSignPackage ? "/api/documents/packagesignature" : "/api/documents"),
            tokenAuth.access_token,
            isSignPackage ? buildDocumentPackageDSS(documents, signer.dssCertID, setting.sign.detached, "cosign", pinCode) :
              buildDocumentDSS(files[0].fullpath, signer.dssCertID, setting.sign.detached, "cosign", originalData, pinCode))
            .then(
              (dataCMS: any) => {
                let i: number = 0;
                let outURIList: string[] = [];
                files.forEach((file) => {
                  const outURI = fileNameForResign(folderOut, file);
                  const tcms: trusted.cms.SignedData = new trusted.cms.SignedData();
                  const contextCMS = isSignPackage ? dataCMS.Results[i] : dataCMS;
                  tcms.import(Buffer.from("-----BEGIN CMS-----" + "\n" + contextCMS + "\n" + "-----END CMS-----"), trusted.DataFormat.PEM);
                  tcms.save(outURI, format);
                  outURIList.push(outURI);
                  i++;
                });
                packageReSign(files, cert, policies, format, folderOut, outURIList);
              },
              (error) => {
                $(".toast-dssPerformOperation_failed").remove();
                Materialize.toast(error, 3000, "toast-dssPerformOperation_failed");
              },
            );
        }
      } else {
        if (setting.sign.timestamp) {
          policies.splice(0, 1);
        }

        files.forEach((file) => {
          const newPath = trustedSign.resignFile(file.fullpath, cert, policies, format, folderOut);

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

      if (folderOut.length > 0) {
        if (!dirExists(folderOut)) {
          $(".toast-failed_find_directory").remove();
          Materialize.toast(localize("Settings.failed_find_directory", locale), 2000, "toast-failed_find_directory");
          return;
        }
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

          const newPath = trustedEncrypts.encryptFile(outURI, certs, policies, format, folderOut);
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
          const newPath = trustedEncrypts.encryptFile(file.fullpath, certs, policies, format, folderOut);
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
    dssResponses: state.dssResponses.entities,
    files: mapToArr(state.files.entities),
    filesInTransactionList: filesInTransactionsSelector(state),
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
    tokensDss: state.tokens.tokensDss,
    users: state.users.entities,
    transactionDSS: mapToArr(state.transactionDSS.entities),
    policyDSS: state.policyDSS.entities,
  };
}, {
  activeFile, activeSetting, createTransactionDSS, dssPerformOperation, dssOperationConfirmation,
  deleteFile, deleteRecipient, documentsReviewed,
  filePackageSelect, filePackageDelete, packageSign, packageReSign, selectFile,
  verifyCertificate, selectSignerCertificate, verifySignature,
})(SignatureAndEncryptRightColumnSettings);

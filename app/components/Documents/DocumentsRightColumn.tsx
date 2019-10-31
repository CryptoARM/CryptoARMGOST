import * as fs from "fs";
import * as path from "path";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import {
  activeFile, changeLocation, deleteFile, deleteRecipient,
  filePackageDelete, filePackageSelect, packageSign,
  removeAllFiles, removeAllRemoteFiles, selectFile,
  selectSignerCertificate, verifySignature,
} from "../../AC";
import { addDocuments, documentsReviewed, IDocument, unselectAllDocuments, unselectDocument } from "../../AC/documentsActions";
import {
  arhiveDocuments, loadAllDocuments, removeAllDocuments,
  removeDocuments, selectAllDocuments, selectDocument,
} from "../../AC/documentsActions";
import {
  activeSetting,
} from "../../AC/settingsActions";
import {
  DECRYPT, DEFAULT_DOCUMENTS_PATH, ENCRYPT, HOME_DIR, LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT,
  LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE, LOCATION_MAIN, LOCATION_SETTINGS_CONFIG,
  LOCATION_SETTINGS_SELECT, REMOVE, SIGN, UNSIGN, USER_NAME, VERIFY,
} from "../../constants";
import { activeFilesSelector, connectedSelector } from "../../selectors";
import { selectedDocumentsSelector } from "../../selectors/documentsSelector";
import { DECRYPTED, ENCRYPTED, ERROR, SIGNED, UPLOADED } from "../../server/constants";
import * as trustedEncrypts from "../../trusted/encrypt";
import { checkLicense } from "../../trusted/jwt";
import * as jwt from "../../trusted/jwt";
import * as trustedSign from "../../trusted/sign";
import { dirExists, extFile, fileCoding, mapToArr, md5 } from "../../utils";
import logger from "../../winstonLogger";
import Modal from "../Modal";
import RecipientsList from "../RecipientsList";
import SignatureInfoBlock from "../Signature/SignatureInfoBlock";
import SignerInfo from "../Signature/SignerInfo";
import DeleteDocuments from "./DeleteDocuments";
import DocumentsTable from "./DocumentsTable";
import FilterDocuments from "./FilterDocuments";

const dialog = window.electron.remote.dialog;

interface IDocumentsWindowProps {
  addDocuments: (documents: string[]) => void;
  documents: any;
  documentsLoaded: boolean;
  documentsLoading: boolean;
  isDefaultFilters: boolean;
  changeLocation: (locaion: string) => void;
  loadAllDocuments: () => void;
  filePackageSelect: (files: string[]) => void;
  removeAllDocuments: () => void;
  removeAllFiles: () => void;
  removeAllRemoteFiles: () => void;
  selectAllDocuments: () => void;
  selectDocument: (uid: number) => void;
  unselectDocument: (uid: number) => void;
  removeDocuments: (documents: any) => void;
  arhiveDocuments: (documents: any, arhiveName: string) => void;
}

interface IDocumentsWindowState {
  searchValue: string;
  showModalDeleteDocuments: boolean;
  showModalFilterDocments: boolean;
}

class DocumentsRightColumn extends React.Component<IDocumentsWindowProps, IDocumentsWindowState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: IDocumentsWindowProps) {
    super(props);

    this.state = {
      searchValue: "",
      showModalDeleteDocuments: false,
      showModalFilterDocments: false,
    };
  }

  componentDidMount() {
    $(".btn-floated").dropdown({
      alignment: "left",
      belowOrigin: false,
      gutter: 0,
      inDuration: 300,
      outDuration: 225,
    });

    $(document).ready(function () {
      $(".tooltipped").tooltip();
    });
  }

  componentWillUnmount() {
    $(".tooltipped").tooltip("remove");
  }

  render() {
    const { localize, locale } = this.context;
    const { documents, isDefaultFilters, isDocumentsReviewed, recipients, setting, settings, signer } = this.props;
    const { fileSignatures, file, showSignatureInfo } = this.state;

    return (
      <React.Fragment>
        <div className="col s10">
          <div className="desktoplic_text_item">Настройки:</div>
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
          <div className="col s10" style={{ fontSize: "75%" }}>
            <div className="collection-title">{setting.name}</div>
          </div>
        </div>

        <div className="row" />

        <div className="col s10">
          <div className="desktoplic_text_item">{localize("Sign.signer_cert", locale)}</div>
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
          (signer) ? <SignerInfo signer={signer} style={{ fontSize: "75%" }} /> :
            <div className="col s12">
              <Link to={LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE}>
                <a className="btn btn-outlined waves-effect waves-light" style={{ width: "100%" }}>
                  {localize("Settings.Choose", locale)}
                </a>
              </Link>
            </div>
        }
        <div className="row" />
        <div className="col s10">
          <div className="desktoplic_text_item">Сертификаты шифрования:</div>
          <hr />
        </div>
        <div className="col s2">
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
            <div style={{ height: "calc(100vh - 400px)" }}>
              <div className="add-certs">
                <RecipientsList recipients={recipients} handleRemoveRecipient={(recipient) => this.props.deleteRecipient(recipient.id)} />
              </div>
            </div> :
            <div className="col s12">
              <Link to={LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT}>
                <a onClick={() => {
                  this.props.activeSetting(this.props.setting.id);
                }}
                  className="btn btn-outlined waves-effect waves-light"
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
            documents && documents.length ?
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

          <div className={`col s4 waves-effect waves-cryptoarm ${this.checkEnableOperationButton(REMOVE) ? "" : "disabled_docs"}`} onClick={this.handleClickDelete}>
            <div className="col s12 svg_icon">
              <a data-position="bottom"
                data-tooltip={localize("Sign.sign_and_verify", locale)}>
                <i className="material-icons docmenu remove" />
              </a>
            </div>
            <div className="col s12 svg_icon_text">{localize("Documents.docmenu_remove", locale)}</div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  toggleDocumentsReviewed = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { documentsReviewed, isDocumentsReviewed } = this.props;

    documentsReviewed(!isDocumentsReviewed);
  }

  handleClickSign = () => {

    // tslint:disable-next-line:no-shadowed-variable
    const { activeDocumentsArr, signer, lic_error } = this.props;
    const { localize, locale } = this.context;

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

    if (activeDocumentsArr.length > 0) {
      /*const key = window.PKISTORE.findKey(signer);

      if (!key) {
        $(".toast-key_not_found").remove();
        Materialize.toast(localize("Sign.key_not_found", locale), 2000, "toast-key_not_found");

        logger.log({
          level: "error",
          message: "Key not found",
          operation: "Подпись",
          operationObject: {
            in: "Key",
            out: "Null",
          },
          userName: USER_NAME,
        });

        return;
      }*/

      const cert = window.PKISTORE.getPkiObject(signer);

      const filesForSign = [];
      const filesForResign = [];

      for (const file of activeDocumentsArr) {
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

    }
  }

  sign = (files: any, cert: any) => {
    const { addDocuments, setting, signer, unselectD } = this.props;
    // tslint:disable-next-line:no-shadowed-variable
    const { localize, locale } = this.context;
    let res = true;

    if (files.length > 0) {
      const policies = ["noAttributes"];

      const folderOut = setting.outfolder;
      let format = trusted.DataFormat.PEM;

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

      if (setting.sign.timestamp) {
        policies.splice(0, 1);
      }

      if (setting.sign.encoding !== localize("Settings.BASE", locale)) {
        format = trusted.DataFormat.DER;
      }

      files.forEach((file) => {
        const newPath = trustedSign.signFile(file.fullpath, cert, policies, format, folderOut);

        if (newPath) {
          addDocuments([newPath]);
          this.props.unselectDocument(file.id);
        } else {
          res = false;
        }
      });

      if (res) {
        $(".toast-files_signed").remove();
        Materialize.toast(localize("Sign.files_signed", locale), 2000, "toast-files_signed");
      } else {
        $(".toast-files_signed_failed").remove();
        Materialize.toast(localize("Sign.files_signed_failed", locale), 2000, "toast-files_signed_failed");
      }
    }
  }

  resign = (files: any, cert: any) => {
    const { setting } = this.props;
    // tslint:disable-next-line:no-shadowed-variable
    const { verifySignature } = this.props;
    const { localize, locale } = this.context;

    if (files.length > 0) {
      const policies = ["noAttributes"];
      const folderOut = setting.outfolder;
      let format = trusted.DataFormat.PEM;
      let res = true;

      if (folderOut.length > 0) {
        if (!dirExists(folderOut)) {
          $(".toast-failed_find_directory").remove();
          Materialize.toast(localize("Settings.failed_find_directory", locale), 2000, "toast-failed_find_directory");
          return;
        }
      }

      if (setting.sign.timestamp) {
        policies.splice(0, 1);
      }

      if (setting.sign.encoding !== localize("Settings.BASE", locale)) {
        format = trusted.DataFormat.DER;
      }

      files.forEach((file) => {
        const newPath = trustedSign.resignFile(file.fullpath, cert, policies, format, folderOut);

        if (newPath) {
          verifySignature(file.id);
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
    const { activeDocumentsArr, setting } = this.props;
    // tslint:disable-next-line:no-shadowed-variable
    const { addDocuments } = this.props;
    const { localize, locale } = this.context;

    if (activeDocumentsArr.length > 0) {
      const folderOut = setting.outfolder;
      let res = true;

      activeDocumentsArr.forEach((file) => {
        const newPath = trustedSign.unSign(file.fullpath, folderOut);
        if (newPath) {
          addDocuments([newPath]);
          this.props.unselectDocument(file.id);
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
    const { activeDocumentsArr, signatures } = this.props;
    // tslint:disable-next-line:no-shadowed-variable
    const { verifySignature } = this.props;
    const { localize, locale } = this.context;

    let res = true;

    activeDocumentsArr.forEach((file) => {
      verifySignature(file.id);
    });

    signatures.forEach((signature: any) => {
      for (const file of activeDocumentsArr) {
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
    const { addDocuments, activeDocumentsArr, setting, deleteFile, recipients } = this.props;
    const { localize, locale } = this.context;

    if (activeDocumentsArr.length > 0) {
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
        const archiveName = activeDocumentsArr.length === 1 ? `${path.parse(activeDocumentsArr[0].filename).name}.zip` : localize("Encrypt.archive_name", locale);
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
            activeDocumentsArr.forEach((file) => {
              fs.unlinkSync(file.fullpath);
            });
          }

          const newPath = trustedEncrypts.encryptFile(outURI, certs, policies, format, folderOut);
          if (newPath) {
            addDocuments([newPath]);
            this.props.unselectDocument(file.id);
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

        activeDocumentsArr.forEach((file) => {
          archive.append(fs.createReadStream(file.fullpath), { name: file.filename });
        });

        archive.finalize();
      } else {
        activeDocumentsArr.forEach((file) => {
          const newPath = trustedEncrypts.encryptFile(file.fullpath, certs, policies, format, folderOut);
          if (newPath) {
            addDocuments([newPath]);
            this.props.unselectDocument(file.id);
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
    const { addDocuments, activeDocumentsArr, setting, licenseStatus, lic_error } = this.props;
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

    if (activeDocumentsArr.length > 0) {
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

      for (const file of activeDocumentsArr) {
        try {
          const haveLocalRecipient = true;
          const haveDSSRecipient = false;
          const dssRecipient = undefined;

          filesForDecryptInLocalCSP.push(file);

          /*const ris = cipher.getRecipientInfos(uri, format);

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
          console.log(e);
        }
      }

      if (filesForDecryptInLocalCSP && filesForDecryptInLocalCSP.length) {
        filesForDecryptInLocalCSP.forEach((file) => {
          const newPath = trustedEncrypts.decryptFile(file.fullpath, folderOut);

          if (newPath) {
            addDocuments([newPath]);
            this.props.unselectDocument(file.id);
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

  handleCleanRecipientsList = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { deleteRecipient, recipients } = this.props;

    recipients.forEach((recipient) => deleteRecipient(recipient.id));
  }

  checkEnableOperationButton = (operation: string) => {
    const { documents, isDocumentsReviewed, signer, recipients } = this.props;

    if (!documents.length) {

      return false;
    }

    switch (operation) {
      case SIGN:
        if (!isDocumentsReviewed || !signer) {

          return false;
        } else {
          for (const document of documents) {
            if (document.extension === "enc") {

              return false;
            }
          }
        }

        return true;

      case VERIFY:
      case UNSIGN:
        for (const document of documents) {
          if (document.extension !== "sig") {

            return false;
          }
        }

        return true;

      case ENCRYPT:
        if (!recipients || !recipients.length) {
          return false;
        } else {
          for (const document of documents) {
            if (document.extension === "enc") {

              return false;
            }
          }
        }

        return true;

      case DECRYPT:
        for (const document of documents) {
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

  handleClickDelete = () => {
    this.props.handleClickDelete();
  }
}

export default connect((state) => {
  let signatures: object[] = [];

  mapToArr(state.signatures.entities).forEach((element: any) => {
    signatures = signatures.concat(mapToArr(element));
  });

  return {
    activeDocumentsArr: selectedDocumentsSelector(state),
    documents: selectedDocumentsSelector(state),
    documentsLoaded: state.events.loaded,
    documentsLoading: state.events.loading,
    isDefaultFilters: state.filters.documents.isDefaultFilters,
    isDocumentsReviewed: state.files.documentsReviewed,
    licenseStatus: state.license.status,
    lic_error: state.license.lic_error,
    mapCertificates: state.certificates,
    recipients: mapToArr(state.settings.getIn(["entities", state.settings.default]).encrypt.recipients)
      .map((recipient) => state.certificates.getIn(["entities", recipient.certId]))
      .filter((recipient) => recipient !== undefined),
    setting: state.settings.getIn(["entities", state.settings.default]),
    settings: state.settings.entities,
    signatures,
    signer: state.certificates.getIn(["entities", state.settings.getIn(["entities", state.settings.default]).sign.signer]),
  };
}, {
  addDocuments, arhiveDocuments, activeSetting, changeLocation, deleteRecipient, documentsReviewed,
  filePackageSelect, filePackageDelete, verifySignature, packageSign, loadAllDocuments,
  removeAllDocuments, removeAllFiles, removeAllRemoteFiles, removeDocuments,
  unselectAllDocuments, unselectDocument,
  selectAllDocuments, selectDocument, selectSignerCertificate,
})(DocumentsRightColumn);

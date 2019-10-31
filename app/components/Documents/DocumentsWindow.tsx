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
import { addDocuments, documentsReviewed, IDocument } from "../../AC/documentsActions";
import {
  arhiveDocuments, loadAllDocuments, removeAllDocuments,
  removeDocuments, selectAllDocuments, selectDocument,
} from "../../AC/documentsActions";
import {
  activeSetting,
} from "../../AC/settingsActions";
import {
  DECRYPT, DEFAULT_DOCUMENTS_PATH, ENCRYPT, LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT,
  LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE, LOCATION_MAIN, LOCATION_SETTINGS_CONFIG,
  REMOVE, SIGN, UNSIGN, USER_NAME, VERIFY,
} from "../../constants";
import { selectedDocumentsSelector } from "../../selectors/documentsSelector";
import { DECRYPTED, ENCRYPTED, ERROR, SIGNED, UPLOADED } from "../../server/constants";
import * as jwt from "../../trusted/jwt";
import { checkLicense } from "../../trusted/jwt";
import * as trustedSign from "../../trusted/sign";
import { dirExists, extFile, fileCoding, mapToArr, md5 } from "../../utils";
import logger from "../../winstonLogger";
import Modal from "../Modal";
import RecipientsList from "../RecipientsList";
import SignatureInfoBlock from "../Signature/SignatureInfoBlock";
import SignerInfo from "../Signature/SignerInfo";
import DeleteDocuments from "./DeleteDocuments";
import DocumentsRightColumn from "./DocumentsRightColumn";
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
  removeDocuments: (documents: any) => void;
  arhiveDocuments: (documents: any, arhiveName: string) => void;
}

interface IDocumentsWindowState {
  packageSignResult: any;
  searchValue: string;
  signatures: any;
  signedPackage: any;
  showModalDeleteDocuments: boolean;
  showModalFilterDocments: boolean;
}

class DocumentsWindow extends React.Component<IDocumentsWindowProps, IDocumentsWindowState> {
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

  componentWillReceiveProps(nextProps: IDocumentsWindowProps) {
    const { localize, locale } = this.context;
    const { documents, signatures } = this.props;

    if (documents.length !== nextProps.documents.length || signatures.length !== nextProps.signatures.length) {
      if (nextProps.documents && nextProps.documents.length === 1) {
        if (nextProps.signatures && nextProps.signatures.length) {
          const file = nextProps.documents[0];

          const fileSignatures = nextProps.signatures.filter((signature: any) => {
            return signature.fileId === file.id;
          });

          const showSignatureInfo = fileSignatures && fileSignatures.length > 0 ? true : false;

          this.setState({ fileSignatures, file, showSignatureInfo });

          return;
        }
      }
    }

    if (!documents || !documents.length || !nextProps.documents || !nextProps.documents.length || nextProps.documents.length > 1 || documents[0].id !== nextProps.documents[0].id) {
      this.setState({ showSignatureInfo: false, signerCertificate: null });
    }

    if (!this.props.signedPackage && nextProps.signedPackage) {
      if (nextProps.packageSignResult) {
        $(".toast-files_signed").remove();
        Materialize.toast(localize("Sign.files_signed", locale), 2000, "toast-files_signed");
      } else {
        $(".toast-files_signed_failed").remove();
        Materialize.toast(localize("Sign.files_signed_failed", locale), 2000, "toast-files_signed_failed");
      }
    }
  }

  render() {
    const { localize, locale } = this.context;
    const { documents, isDefaultFilters, isDocumentsReviewed, recipients, setting, signer } = this.props;
    const { fileSignatures, file, showSignatureInfo } = this.state;

    const classDefaultFilters = isDefaultFilters ? "filter_off" : "filter_on";

    return (
      <div className="content-noflex">
        <div className="row">
          <div className="col s8 leftcol">
            <div className="row halfbottom">
              <div className="row halfbottom" />
              <div className="col" style={{ width: "40px", paddingLeft: "40px" }}>
                <a onClick={this.addFiles.bind(this)}>
                  <i className="file-setting-item waves-effect material-icons secondary-content pulse">add</i>
                </a>
              </div>
              <div className="col" style={{ width: "calc(100% - 140px)" }}>
                <div className="input-field input-field-csr col s12 border_element find_box">
                  <i className="material-icons prefix">search</i>
                  <input
                    id="search"
                    type="search"
                    placeholder={localize("EventsTable.search_in_doclist", locale)}
                    value={this.state.searchValue}
                    onChange={this.handleSearchValueChange} />
                  <i className="material-icons close" onClick={() => this.setState({ searchValue: "" })} style={this.state.searchValue ? { color: "#444" } : {}}>close</i>
                </div>
              </div>
              <div className="col" style={{ width: "40px" }}>
                <a onClick={this.handleShowModalFilterDocuments}>
                  <i className={`file-setting-item waves-effect material-icons secondary-content`}>
                    <i className={`material-icons ${classDefaultFilters}`} />
                  </i>
                </a>
              </div>
              <div className="col" style={{ width: "40px" }}>
                <div>
                  <a className="btn-floated" data-activates="dropdown-btn-set-add-files">
                    <i className="file-setting-item waves-effect material-icons secondary-content">more_vert</i>
                  </a>
                  <ul id="dropdown-btn-set-add-files" className="dropdown-content">
                    <li><a onClick={this.handleReloadDocuments}>{localize("Common.update", locale)}</a></li>
                    <li><a onClick={this.handleSelectAllDocuments}>{localize("Documents.selected_all", locale)}</a></li>
                    <li><a onClick={this.handleOpenDocumentsFolder}>{localize("Documents.go_to_documents_folder", locale)}</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div style={{ height: "calc(100% - 56px)", position: "relative" }}>
              <div id="droppableZone" onDragEnter={(event: any) => this.dragEnterHandler(event)}
                onDrop={(event: any) => this.dropHandler(event)}
                onDragOver={(event: any) => this.dragOverHandler(event)}
                onDragLeave={(event: any) => this.dragLeaveHandler(event)}>
              </div>
              <div onDragEnter={this.dropZoneActive.bind(this)}>
                <DocumentsTable searchValue={this.state.searchValue} />
              </div>
            </div>
          </div>
          <div className="col s4 rightcol">
            <div className="row halfbottom" />

            {(showSignatureInfo && fileSignatures) ?
              (
                <React.Fragment>
                  <div className="col s12">
                    <div className="desktoplic_text_item">{localize("Sign.sign_info", locale)}</div>
                    <hr />
                  </div>
                  <div style={{ height: "calc(100vh - 100px)" }}>
                    <div className="add-certs">
                      <SignatureInfoBlock
                        signatures={fileSignatures}
                        file={file}
                      />
                    </div>
                  </div>
                  <div className="row fixed-bottom-rightcolumn">
                    <div className="col s1 offset-s4">
                      <a className="btn btn-text waves-effect waves-light" onClick={this.backView}>
                        {"< НАЗАД"}
                      </a>
                    </div>
                  </div>
                </React.Fragment>
              ) :
              <DocumentsRightColumn handleClickDelete={this.handleShowModalDeleteDocuments} />
            }

          </div>
          {this.showModalFilterDocuments()}
          {this.showModalDeleteDocuments()}
        </div>
      </div>
    );
  }

  backView = () => {
    this.setState({ showSignatureInfo: false });
  }

  addFiles() {
    // tslint:disable-next-line:no-shadowed-variable
    const { addDocuments } = this.props;

    dialog.showOpenDialog(null, { properties: ["openFile", "multiSelections"] }, (selectedFiles: string[]) => {
      if (selectedFiles) {
        const documents: string[] = [];

        selectedFiles.forEach((file) => {
          const fullpath = file;
          const stat = fs.statSync(fullpath);
          if (!stat.isDirectory()) {
            documents.push(fullpath);
          }
        });

        addDocuments(documents);
      }
    });
  }

  dragLeaveHandler(event: any) {
    event.target.classList.remove("draggedOver");

    const zone = document.querySelector("#droppableZone");
    if (zone) {
      zone.classList.remove("droppableZone-active");
    }
  }

  dragEnterHandler(event: any) {
    event.target.classList.add("draggedOver");
  }

  dragOverHandler(event: any) {
    event.stopPropagation();
    event.preventDefault();
  }

  directoryReader = (reader: any) => {
    reader.readEntries((entries: any) => {
      entries.forEach((entry: any) => {
        this.scanFiles(entry);
      });

      if (entries.length === 100) {
        this.directoryReader(reader);
      }
    });
  }

  scanFiles = (item: any) => {
    // tslint:disable-next-line:no-shadowed-variable
    const { addDocuments } = this.props;

    if (item.isDirectory) {
      const reader = item.createReader();

      this.directoryReader(reader);
    } else {
      item.file((dropfile: any) => {
        const documents: string[] = [];

        const fullpath = dropfile.path;
        const stat = fs.statSync(fullpath);

        if (!stat.isDirectory()) {
          documents.push(fullpath);
        }

        addDocuments(documents);
      });
    }
  }

  dropHandler = (event: any) => {
    event.stopPropagation();
    event.preventDefault();
    event.target.classList.remove("draggedOver");

    const zone = document.querySelector("#droppableZone");
    if (zone) {
      zone.classList.remove("droppableZone-active");
    }

    const items = event.dataTransfer.items;

    for (const item of items) {
      const entry = item.webkitGetAsEntry();

      if (entry) {
        this.scanFiles(entry);
      }
    }
  }

  dropZoneActive() {
    const zone = document.querySelector("#droppableZone");
    if (zone) {
      zone.classList.add("droppableZone-active");
    }
  }

  toggleDocumentsReviewed = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { documentsReviewed, isDocumentsReviewed } = this.props;

    documentsReviewed(!isDocumentsReviewed);
  }

  handleCleanRecipientsList = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { deleteRecipient, recipients } = this.props;

    recipients.forEach((recipient) => deleteRecipient(recipient.id));
  }

  checkEnableOperationButton = (operation: string) => {
    const { documents, isDocumentsReviewed, signer } = this.props;

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
        for (const document of documents) {
          if (document.extension === "enc") {
            return false;
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

  showModalFilterDocuments = () => {
    const { localize, locale } = this.context;
    const { showModalFilterDocments } = this.state;

    if (!showModalFilterDocments) {
      return;
    }

    return (
      <Modal
        isOpen={showModalFilterDocments}
        header={localize("Filters.filters_settings", locale)}
        onClose={this.handleCloseModalFilterDocuments}>

        <FilterDocuments onCancel={this.handleCloseModalFilterDocuments} />
      </Modal>
    );
  }

  showModalDeleteDocuments = () => {
    const { localize, locale } = this.context;
    const { documents } = this.props;
    const { showModalDeleteDocuments } = this.state;

    if (!documents || !showModalDeleteDocuments) {
      return;
    }

    return (
      <Modal
        isOpen={showModalDeleteDocuments}
        header={localize("Documents.delete_documents", locale)}
        onClose={this.handleCloseModalDeleteDocuments}>

        <DeleteDocuments
          onCancel={this.handleCloseModalDeleteDocuments}
          removeDocuments={this.handleClickDelete} />
      </Modal>
    );
  }

  handleClickSign = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { documents, filePackageSelect, removeAllFiles, removeAllRemoteFiles } = this.props;
    removeAllFiles();
    removeAllRemoteFiles();
    filePackageSelect(documents);
    this.openWindow(SIGN);
  }

  handleClickEncrypt = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { documents, filePackageSelect, removeAllFiles, removeAllRemoteFiles } = this.props;
    removeAllFiles();
    removeAllRemoteFiles();
    filePackageSelect(documents);
    this.openWindow(ENCRYPT);
  }

  handleClickDelete = () => {
    const { localize, locale } = this.context;
    const { documents } = this.props;
    const count = documents.length;

    removeDocuments(documents);
    this.handleReloadDocuments();

    const message = localize("Documents.documents_deleted1", locale) + count + localize("Documents.documents_deleted2", locale);
    Materialize.toast(message, 2000, "toast-remove_documents");

    this.handleCloseModalDeleteDocuments();
  }

  openWindow = (operation: string) => {
    // tslint:disable-next-line:no-shadowed-variable
    const { changeLocation } = this.props;

    switch (operation) {
      case SIGN:
      case VERIFY:
        changeLocation(LOCATION_MAIN);
        return;

      case ENCRYPT:
      case DECRYPT:
        changeLocation(LOCATION_MAIN);
        return;

      default:
        return;
    }
  }

  handleSearchValueChange = (ev: any) => {
    this.setState({ searchValue: ev.target.value });
  }

  handleShowModalFilterDocuments = () => {
    this.setState({ showModalFilterDocments: true });
  }

  handleCloseModalFilterDocuments = () => {
    this.setState({ showModalFilterDocments: false });
  }

  handleShowModalDeleteDocuments = () => {
    this.setState({ showModalDeleteDocuments: true });
  }

  handleCloseModalDeleteDocuments = () => {
    this.setState({ showModalDeleteDocuments: false });
  }

  handleReloadDocuments = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { documentsLoading, loadAllDocuments, removeAllDocuments } = this.props;
    removeAllDocuments();
    if (!documentsLoading) {
      loadAllDocuments();
    }
  }

  handleArhiveDocuments = () => {
    const { localize, locale } = this.context;
    const { documents } = this.props;
    let arhiveName: string = "";

    const date = new Date();
    // tslint:disable-next-line:quotemark
    // tslint:disable-next-line:max-line-length
    const dateNow = ("0" + date.getDate()).slice(-2) + "." + ("0" + (date.getMonth() + 1)).slice(-2) + "." + date.getFullYear() + "_" + ("0" + date.getHours()).slice(-2) + "." + ("0" + date.getMinutes()).slice(-2) + "." + ("0" + date.getSeconds()).slice(-2);
    arhiveName = "arhive_" + dateNow + ".zip";
    arhiveDocuments(documents, arhiveName);
    this.handleReloadDocuments();
    const message = localize("Documents.documents_arhive", locale) + arhiveName;
    Materialize.toast(message, 2000, "toast-arhive_documents");
  }

  handleSelectAllDocuments = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { selectAllDocuments } = this.props;

    selectAllDocuments();
  }

  handleOpenDocumentsFolder = () => {
    window.electron.shell.openItem(DEFAULT_DOCUMENTS_PATH);
  }
}

export default connect((state) => {
  let signatures: object[] = [];

  mapToArr(state.signatures.entities).forEach((element: any) => {
    signatures = signatures.concat(mapToArr(element));
  });

  return {
    documents: selectedDocumentsSelector(state),
    documentsLoaded: state.events.loaded,
    documentsLoading: state.events.loading,
    isDefaultFilters: state.filters.documents.isDefaultFilters,
    isDocumentsReviewed: state.files.documentsReviewed,
    lic_error: state.license.lic_error,
    packageSignResult: state.signatures.packageSignResult,
    recipients: mapToArr(state.settings.getIn(["entities", state.settings.default]).encrypt.recipients)
      .map((recipient) => state.certificates.getIn(["entities", recipient.certId]))
      .filter((recipient) => recipient !== undefined),
    setting: state.settings.getIn(["entities", state.settings.default]),
    signatures,
    signedPackage: state.signatures.signedPackage,
    signer: state.certificates.getIn(["entities", state.settings.getIn(["entities", state.settings.default]).sign.signer]),
  };
}, {
    addDocuments, arhiveDocuments, activeSetting, changeLocation, deleteRecipient, documentsReviewed,
    filePackageSelect, filePackageDelete, packageSign, loadAllDocuments,
    removeAllDocuments, removeAllFiles, removeAllRemoteFiles, removeDocuments,
    selectAllDocuments, selectDocument, selectSignerCertificate,
  })(DocumentsWindow);

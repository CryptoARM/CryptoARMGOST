import * as fs from "fs";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import {
  activeFile, filePackageDelete, filePackageSelect, removeAllRemoteFiles,
} from "../../AC";
import { deleteAllTemporyLicenses } from "../../AC/licenseActions";
import { activeFilesSelector, connectedSelector, filesInTransactionsSelector, filteredFilesSelector, loadingRemoteFilesSelector } from "../../selectors";
import { CANCELLED, ERROR, SIGN, SIGNED, UPLOADED } from "../../server/constants";
import { mapToArr } from "../../utils";
import FilterDocuments from "../Documents/FilterDocuments";
import FileSelector from "../Files/FileSelector";
import Modal from "../Modal";
import ProgressBars from "../ProgressBars";
import SignatureInfoBlock from "../Signature/SignatureInfoBlock";
import SignatureAndEncryptRightColumn from "./SignatureAndEncryptRightColumn";

const remote = window.electron.remote;
const dialog = window.electron.remote.dialog;

interface ISignatureAndEncryptWindowProps {
  activeFilesArr: any;
  isDefaultFilters: boolean;
  deleteAllTemporyLicenses: () => void;
  loadingFiles: any;
  files: any;
  filesMap: any;
  method: string;
  operationsPerformed: boolean;
  operationsPerforming: boolean;
  operationsStatus: boolean;
  packageSignResult: any;
  removeAllRemoteFiles: () => void;
  signatures: any;
  signedPackage: any;
  dssOperationIsActive: boolean;
}

interface ISignatureAndEncryptWindowState {
  currentOperation: string;
  searchValue: string;
  showModalDeleteDocuments: boolean;
  showModalFilterDocments: boolean;
}

class SignatureAndEncryptWindow extends React.Component<ISignatureAndEncryptWindowProps, ISignatureAndEncryptWindowState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: ISignatureAndEncryptWindowProps) {
    super(props);

    this.state = {
      currentOperation: "",
      searchValue: "",
      showModalDeleteDocuments: false,
      showModalFilterDocments: false,
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
  }

  componentDidUpdate(prevProps: ISignatureAndEncryptWindowProps) {
    const { localize, locale } = this.context;

    if (this.props.method === SIGN && prevProps.activeFilesArr && prevProps.activeFilesArr.length && (!this.props.activeFilesArr || !this.props.activeFilesArr.length)) {
      this.props.removeAllRemoteFiles(); 
      setTimeout( () => {
      remote.getCurrentWindow().close();
    }, 3000)

      this.props.deleteAllTemporyLicenses();
    }

    if (prevProps.operationsPerforming && !this.props.operationsPerforming && this.props.operationsPerformed) {
      if (this.props.operationsStatus) {
        $(".toast-operations_performed").remove();
        Materialize.toast(localize("Operations.operations_performed", locale), 2000, "toast-operations_performed");
      } else {
        $(".toast-operations_failed").remove();
        Materialize.toast(localize("Operations.operations_failed", locale), 2000, "toast-operations_failed");
      }
    }
  }

  componentWillReceiveProps(nextProps: ISignatureAndEncryptWindowProps) {
    const { localize, locale } = this.context;
    const { activeFilesArr, signatures, operationsPerforming } = this.props;

    if (activeFilesArr.length !== nextProps.activeFilesArr.length || signatures.length !== nextProps.signatures.length) {
      if (nextProps.activeFilesArr && nextProps.activeFilesArr.length === 1 && !nextProps.operationsPerforming) {
        if (nextProps.signatures && nextProps.signatures.length) {
          const file = nextProps.activeFilesArr[0];

          const fileSignatures = nextProps.signatures.filter((signature: any) => {
            return signature.fileId === file.id;
          });

          const showSignatureInfo = fileSignatures && fileSignatures.length > 0 ? true : false;

          this.setState({ fileSignatures, file, showSignatureInfo });

          return;
        }
      }
    }

    if (!activeFilesArr || !activeFilesArr.length || !nextProps.activeFilesArr || !nextProps.activeFilesArr.length || nextProps.activeFilesArr.length > 1 || activeFilesArr[0].id !== nextProps.activeFilesArr[0].id) {
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
    const { fileSignatures, file, showSignatureInfo } = this.state;
    const { isDefaultFilters, dssOperationIsActive, operationsPerforming } = this.props;

    const classDefaultFilters = isDefaultFilters ? "filter_off" : "filter_on";
    const disabledNavigate = this.isFilesFromSocket();
    const classDisabled = disabledNavigate ? "disabled" : "";

    if (operationsPerforming && !dssOperationIsActive) {
      return <ProgressBars />;
    }

    return (
      <div className="content-noflex">
        <div className="row">
          <div className="col s8 leftcol">
            <div className="row halfbottom">
              <div className="row halfbottom" />
              <div className="col" style={{ width: "calc(100% - 80px)" }}>
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
                <a className={`${classDisabled}`} onClick={this.handleShowModalFilterDocuments}>
                  <i className={`file-setting-item waves-effect material-icons secondary-content`}>
                    <i className={`material-icons ${classDefaultFilters}`} style={disabledNavigate ? { opacity: 0.38 } : { opacity: 1 }} />
                  </i>
                </a>
              </div>
              <div className="col" style={{ width: "40px" }}>
                <div>
                  <a className="btn-floated" data-activates="dropdown-btn-set-add-files">
                    <i className={`file-setting-item waves-effect material-icons secondary-content ${classDisabled}`}>more_vert</i>
                  </a>
                  <ul id="dropdown-btn-set-add-files" className="dropdown-content">
                    <li><a onClick={this.selectedAll}>{localize("Settings.selected_all", locale)}</a></li>
                    <li><a onClick={this.removeSelectedAll}>{localize("Settings.remove_selected", locale)}</a></li>
                    <li><a onClick={this.removeAllFiles}>{localize("Settings.remove_all_files", locale)}</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <FileSelector operation="SIGN" searchValue={this.state.searchValue} />
          </div>
          <div className="col s4 rightcol">
            <div className="row halfbottom" />

            {(showSignatureInfo && fileSignatures) ?
              (
                <React.Fragment>
                  <div className="col s12">
                    <div className="primary-text">{localize("Sign.sign_info", locale)}</div>
                    <hr />
                  </div>
                  <div style={{ height: "calc(100vh - 80px)" }}>
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
              <SignatureAndEncryptRightColumn removeAllFiles={this.removeAllFiles} />
            }

          </div>
          {this.showModalFilterDocuments()}
        </div>

        {
          disabledNavigate ? null :
            <div className="fixed-action-btn" style={{ bottom: "20px", right: "380px" }} onClick={this.addFiles.bind(this)}>
              <a className="btn-floating btn-large cryptoarm-red">
                <i className="large material-icons">add</i>
              </a>
            </div>
        }

      </div>
    );
  }

  backView = () => {
    this.setState({ showSignatureInfo: false });
  }

  selectedAll = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const {filesFilteredArr, activeFile } = this.props;

    for (const file of filesFilteredArr) {
      activeFile(file.id);
    }
  }

  removeSelectedAll = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { files, activeFile } = this.props;

    for (const file of files) {
      activeFile(file.id, false);
    }
  }

  removeAllFiles = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { filePackageDelete, filesMap } = this.props;

    const filePackage: number[] = [];
    const filesToRemove = filesMap.toJS();

    for (const file in filesToRemove) {
        filePackage.push(file);
    }

    filePackageDelete(filePackage);
  }

  addFiles() {
    // tslint:disable-next-line:no-shadowed-variable
    const { filePackageSelect } = this.props;

    dialog.showOpenDialog(null, { properties: ["openFile", "multiSelections"] }).then((result: any) => {
      if (result.filePaths) {
        const pack: any[] = [];

        result.filePaths.forEach((file) => {
          pack.push({ fullpath: file });
        });

        filePackageSelect(pack);
      }
    });
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

  handleSearchValueChange = (ev: any) => {
    this.setState({ searchValue: ev.target.value });
  }

  handleShowModalFilterDocuments = () => {
    this.setState({ showModalFilterDocments: true });
  }

  handleCloseModalFilterDocuments = () => {
    this.setState({ showModalFilterDocments: false });
  }

  isFilesFromSocket = () => {
    const { loadingFiles, operationIsRemote } = this.props;

    if (operationIsRemote || loadingFiles.length) {
      return true;
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
    activeFilesArr: mapToArr(activeFilesSelector(state, { active: true })),
    connectedList: connectedSelector(state, { connected: true }),
    connections: state.connections,
    dssOperationIsActive: state.dssResponses.entities && state.dssResponses.size,
    files: mapToArr(state.files.entities),
    filesFilteredArr: mapToArr(filteredFilesSelector(state)),
    filesInTransactionList: filesInTransactionsSelector(state),
    filesMap: filteredFilesSelector(state),
    isDefaultFilters: state.filters.documents.isDefaultFilters,
    loadingFiles: mapToArr(loadingRemoteFilesSelector(state, { loading: true })),
    method: state.remoteFiles.method,
    operationIsRemote: state.urlActions.performed || state.urlActions.performing,
    operationsPerformed: state.multiOperations.performed,
    operationsPerforming: state.multiOperations.performing,
    operationsStatus: state.multiOperations.status,
    packageSignResult: state.signatures.packageSignResult,
    signatures,
    signedPackage: state.signatures.signedPackage,
    signer: state.certificates.getIn(["entities", state.settings.getIn(["entities", state.settings.default]).sign.signer]),
  };
}, { activeFile, deleteAllTemporyLicenses, filePackageSelect, filePackageDelete, removeAllRemoteFiles })(SignatureAndEncryptWindow);

import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import {
  changeLocation, deleteRecipient, filePackageSelect, selectSignerCertificate,
} from "../../AC";
import {
  unselectAllDocuments,
} from "../../AC/documentsActions";
import {
  LOCATION_MAIN, REMOVE, SIGN,
} from "../../constants";
import { filteredDocumentsSelector, selectedDocumentsSelector, selectedFiltredDocumentsSelector } from "../../selectors/documentsSelector";
import { bytesToSize, mapToArr } from "../../utils";
import FileIcon from "../Files/FileIcon";
import SignatureInfoBlock from "../Signature/SignatureInfoBlock";

interface IDocumentsWindowProps {
  documents: any;
  my: any;
  filter: any;
  unselectAllDocuments: () => void;
}

class DocumentsRightColumn extends React.Component<IDocumentsWindowProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: IDocumentsWindowProps) {
    super(props);
  }

  componentDidMount() {
    $(".btn-floated").dropdown({
      alignment: "left",
      belowOrigin: false,
      gutter: 0,
      inDuration: 300,
      outDuration: 225,
    });

    $(document).ready(function() {
      $(".tooltipped").tooltip();
    });

    $(".collapsible").collapsible();
  }

  componentWillUnmount() {
    $(".tooltipped").tooltip("remove");

    this.props.unselectAllDocuments();
  }

  render() {
    const { localize, locale } = this.context;
    const { fileSignatures, selectedDocs, showSignatureInfo, filteredDocSelector } = this.props;

    let lastSelectDocument;

    if (selectedDocs && selectedDocs.size) {
      lastSelectDocument = filteredDocSelector.get(selectedDocs.last());
    }

    return (
      <React.Fragment>
        {
          showSignatureInfo && lastSelectDocument ?
            <React.Fragment>
              <div className="col s12">
                <div className="primary-text">{localize("Sign.sign_info", locale)}</div>
                <hr />
              </div>
              <div style={{ height: "calc(100vh - 120px)" }}>
                <div className="add-certs">
                  <SignatureInfoBlock
                    signatures={fileSignatures}
                    file={lastSelectDocument}
                    key={lastSelectDocument.id}
                  />
                </div>
              </div>
            </React.Fragment>
            : lastSelectDocument ?
              <React.Fragment>
                <div className="col s12">
                  <div className="primary-text">{localize("Documents.information_about_doc", locale)}</div>
                  <hr />
                </div>
                <div style={{ height: "calc(100vh - 120px)" }}>
                  <div className="add-certs">
                    {
                      lastSelectDocument.extension === "sig" ?
                        <div className="row">
                          <div className="col s2" style={{ width: "11%" }}>
                            <div className="status_unknown_icon" />
                          </div>
                          <div className="col s10 ">
                            <div className="col s12">
                              <div className="unknown">{localize("Sign.sign_unknown", locale)}</div>
                              <div className="collection-info">Исходный файл не найден</div>
                            </div>
                          </div>
                        </div> : null
                    }
                    <div className="row">
                      <div className="col s2" style={{ width: "11%" }}>
                        <FileIcon file={lastSelectDocument} style={{ left: "0px", position: "relative" }} />
                      </div>

                      <div className="col s10">
                        <div className="col s12">
                          <div className="truncate">{lastSelectDocument.filename}</div>
                        </div>
                        <div className="col s7">
                          <div className="collection-info truncate">{(new Date(lastSelectDocument.mtime)).toLocaleDateString(locale, {
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            month: "numeric",
                            year: "numeric",
                          })}
                          </div>
                        </div>
                        <div className="col s4">
                          <div className="collection-info truncate">{bytesToSize(lastSelectDocument.filesize)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col s12 primary-text">Свойства:</div>
                      <div className="col s12">
                        <div className="collection">
                          <div className="collection-item certs-collection certificate-info">
                            <div className="collection-title">{bytesToSize(lastSelectDocument.filesize)}</div>
                            <div className="collection-info">{localize("Documents.filesize", locale)}</div>
                          </div>

                          <div className="collection-item certs-collection certificate-info">
                            <div className="collection-title">{(new Date(lastSelectDocument.birthtime)).toLocaleDateString(locale, {
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                              month: "long",
                              year: "numeric",
                            })}</div>
                            <div className="collection-info">{localize("Documents.birthtime", locale)}</div>
                          </div>

                          <div className="collection-item certs-collection certificate-info">
                            <div className="collection-title">{(new Date(lastSelectDocument.mtime)).toLocaleDateString(locale, {
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                              month: "long",
                              year: "numeric",
                            })}</div>
                            <div className="collection-info">{localize("Documents.mtime", locale)}</div>
                          </div>

                          <div className="collection-item certs-collection certificate-info">
                            <div className="collection-title">{(new Date(lastSelectDocument.atime)).toLocaleDateString(locale, {
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                              month: "long",
                              year: "numeric",
                            })}</div>
                            <div className="collection-info">{localize("Documents.atime", locale)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment> : null
        }

        <div className="row fixed-bottom-rightcolumn" >
          <div className="col s12">
            <hr />
          </div>

          <div className={`col s8 waves-effect waves-cryptoarm ${this.checkEnableOperationButton(SIGN) ? "" : "disabled_docs"}`} onClick={this.handleClickSign}>
            <div className="col s12 svg_icon">
              <a data-position="bottom">
                <i className="material-icons docmenu send_in_sign_and_encrypt" />
              </a>
            </div>
            <div className="col s12 svg_icon_text">{localize("Documents.open_in_sign_and_encrypt", locale)}</div>
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

  handleClickSign = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { changeLocation, filtredDocuments, filePackageSelect } = this.props;
    filePackageSelect(filtredDocuments);
    changeLocation(LOCATION_MAIN);
  }

  checkEnableOperationButton = (operation: string) => {
    const { filtredDocuments } = this.props;

    if (!filtredDocuments.size) {

      return false;
    }

    switch (operation) {
      case SIGN:
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
    filteredDocSelector: filteredDocumentsSelector (state),
    activeDocumentsArr: selectedDocumentsSelector(state),
    documents: selectedDocumentsSelector(state),
    documentsMap: state.documents.entities,
    filtredDocuments: selectedFiltredDocumentsSelector (state),
    selectedDocs: state.documents.selected,
    setting: state.settings.getIn(["entities", state.settings.default]),
    settings: state.settings.entities,
    signatures,
  };
}, {
  changeLocation, deleteRecipient,
  filePackageSelect, selectSignerCertificate, unselectAllDocuments,
})(DocumentsRightColumn);

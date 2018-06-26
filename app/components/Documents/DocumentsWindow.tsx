import PropTypes from "prop-types";
import React from "react";

interface IDocumentsWindowProps {
  documentsLoaded: boolean;
  documentsLoading: boolean;
  isDefaultFilters: boolean;
  loadAllDocuments: () => void;
  removeAllDocuments: () => void;
}

interface IDocumentsWindowState {
  searchValue: string;
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
      showModalFilterDocments: false,
    };
  }

  componentDidMount() {
    $(".nav-small-btn").dropdown({
      alignment: "left",
      belowOrigin: false,
      gutter: 0,
      inDuration: 300,
      outDuration: 225,
    });
  }

  render() {
    const { localize, locale } = this.context;
    const { isDefaultFilters } = this.props;

    const classDefaultFilters = isDefaultFilters ? "filter_off" : "filter_on";

    return (
      <div className="row">
      <div className="row halfbottom" />

      <div className="col s10">
          <div className="input-field input-field-csr col s12 border_element find_box">
            <i className="material-icons prefix">search</i>
            <input
              id="search"
              type="search"
              placeholder={localize("EventsTable.search_in_table", locale)}
              value={this.state.searchValue}
              onChange={this.handleSearchValueChange} />
            <i className="material-icons close" onClick={() => this.setState({ searchValue: "" })} style={this.state.searchValue ? {color : "#444"} : {}}>close</i>
          </div>
        </div>
        <div className="col s1">
          <a className={"btn-small waves-effect waves-light"} onClick={this.handleShowModalFilterEvents}>
            <i className={"material-icons " + classDefaultFilters}>filter_list</i>
          </a>
        </div>
        <div className="col s1">
          <a className={"nav-small-btn waves-effect waves-light"} data-activates="dropdown-btn-for-documents" style={{margin: 0}}>
            <i className="nav-small-icon material-icons context_menu">more_vert</i>
          </a>
          <ul id="dropdown-btn-for-documents" className="dropdown-content">
            <li><a onClick={this.handleReloadDocuments}>{localize("Common.update", locale)}</a></li>
            <li><a onClick={() => console.log("selected_all")}>{localize("Documents.selected_all", locale)}</a></li>
            <li><a onClick={() => console.log("go_to_documents_folder")}>{localize("Documents.go_to_documents_folder", locale)}</a></li>
          </ul>
        </div>
      </div>
    );
  }

  handleSearchValueChange = (ev: any) => {
    this.setState({ searchValue: ev.target.value });
  }

  handleShowModalFilterEvents = () => {
    this.setState({ showModalFilterDocments: true });
  }

  handleCloseModalFilterEvents = () => {
    this.setState({ showModalFilterDocments: false });
  }

  handleReloadDocuments = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { documentsLoading, loadAllDocuments, removeAllDocuments } = this.props;

    removeAllDocuments();

    if (!documentsLoading) {
      loadAllDocuments();
    }
  }
}

export default DocumentsWindow;

import * as fs from "fs";
import * as path from "path";
import {
  ADD_DOCUMENTS, ARHIVE_DOCUMENTS, DEFAULT_DOCUMENTS_PATH, DOCUMENTS_REVIEWED,
  FAIL, LOAD_ALL_DOCUMENTS,
  REMOVE_ALL_DOCUMENTS, REMOVE_DOCUMENTS, SELECT_ALL_DOCUMENTS,
  SELECT_DOCUMENT, START, SUCCESS, UNSELECT_ALL_DOCUMENTS, UNSELECT_DOCUMENT, VERIFY_SIGNATURE,
} from "../constants";
import { dirExists, extFile, fileExists, md5 } from "../utils";

export interface IDocument {
  atime: Date;
  birthtime: Date;
  extension: string;
  filename: string;
  filesize: number;
  fullpath: string;
  id: string;
  mtime: Date;
}

export function loadAllDocuments() {
  return (dispatch) => {
    dispatch({
      type: LOAD_ALL_DOCUMENTS + START,
    });

    const documents: IDocument[] = [];

    setTimeout(() => {
      if (dirExists(DEFAULT_DOCUMENTS_PATH)) {
        fs.readdirSync(DEFAULT_DOCUMENTS_PATH).forEach((file) => {
          const fullpath = path.join(DEFAULT_DOCUMENTS_PATH, file);
          const extension = extFile(fullpath);
          const stat = fs.statSync(fullpath);
          if (!stat.isDirectory()) {
            documents.push({
              atime: stat.atime,
              birthtime: stat.birthtime,
              extension,
              filename: file,
              filesize: stat.size,
              fullpath,
              id: md5(fullpath),
              mtime: stat.mtime,
            });
          }
        });
      }

      dispatch({
        payload: { documents },
        type: LOAD_ALL_DOCUMENTS + SUCCESS,
      });
    }, 0);
  };
}

export function addDocuments(documentsPaths: string[]) {
  return (dispatch) => {
    dispatch({
      type: ADD_DOCUMENTS + START,
    });

    setTimeout(() => {
      const documents: IDocument[] = [];

      if (dirExists(DEFAULT_DOCUMENTS_PATH)) {
        documentsPaths.forEach((uri) => {
          const ourURI = path.join(DEFAULT_DOCUMENTS_PATH, path.basename(uri));

          try {
            if (!fileExists(ourURI)) {
              fs.writeFileSync(ourURI, fs.readFileSync(uri));
            }

            const fullpath = ourURI;
            const extension = extFile(fullpath);
            const stat = fs.statSync(fullpath);

            if (!stat.isDirectory()) {
              documents.push({
                atime: stat.atime,
                birthtime: stat.birthtime,
                extension,
                filename: path.basename(ourURI),
                filesize: stat.size,
                fullpath,
                id: md5(fullpath),
                mtime: stat.mtime,
              });
            }
          } catch (e) {
            dispatch({
              type: ADD_DOCUMENTS + FAIL,
            });
          }
        });
      }

      dispatch({
        payload: { documents },
        type: ADD_DOCUMENTS + SUCCESS,
      });
    }, 0);
  };
}

export function removeAllDocuments() {
  return {
    type: REMOVE_ALL_DOCUMENTS,
  };
}

export function selectDocument(uid: number) {
  return {
    payload: { uid },
    type: SELECT_DOCUMENT,
  };
}

export function unselectDocument(uid: string) {
  return {
    payload: { uid },
    type: UNSELECT_DOCUMENT,
  };
}

export function removeDocuments(documents: any) {
  // tslint:disable-next-line:forin
  for (const key in documents) {
    try {
      fs.unlinkSync(documents[key].fullpath);
    } catch (e) {
      //
    }
  }

  return {
    type: REMOVE_DOCUMENTS,
  };
}

// tslint:disable-next-line:variable-name
export function arhiveDocuments(documents: any, arhive_name: string) {
  const archive = window.archiver("zip");
  const output = fs.createWriteStream(window.DEFAULT_DOCUMENTS_PATH + "/" + arhive_name);

  archive.pipe(output);

  // tslint:disable-next-line:forin
  for (const key in documents) {
    // console.log(documents[key].fullpath);
    // console.log(documents[key].filename);
    archive.append(fs.readFileSync(documents[key].fullpath), { name: documents[key].filename });
  }
  archive.finalize();
  //output.close();
  return {
    type: ARHIVE_DOCUMENTS,
  };
}

export function unselectAllDocuments() {
  return {
    type: UNSELECT_ALL_DOCUMENTS,
  };
}

export function selectAllDocuments() {
  return {
    type: SELECT_ALL_DOCUMENTS,
  };
}

export function documentsReviewed(reviewed: boolean) {
  return {
    payload: { reviewed },
    type: DOCUMENTS_REVIEWED,
  };
}

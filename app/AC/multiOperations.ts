import * as chardet from "chardet";
import * as fs from "fs";
import * as il from "iconv-lite";
import * as path from "path";
import { push } from "react-router-redux";
import * as unzipper from "unzipper";
import {
  AES_128, AES_192, AES_256, ARCHIVATION_OPERATION, BASE64,
  DEFAULT_DOCUMENTS_PATH, DEFAULT_TEMP_PATH, DER,
  DES, DES3, ENCRYPTION_OPERATION, FAIL,
  GOST_28147, GOST_R3412_2015_K, GOST_R3412_2015_M,
  HOME_DIR,
  LOCATION_RESULTS_MULTI_OPERATIONS, MULTI_DIRECT_OPERATION,
  MULTI_REVERSE_OPERATION, SELECT_ALL_DOCUMENTS_IN_OPERAIONS_RESULT,
  SELECT_ARCHIVED_DOCUMENTS_IN_OPERAIONS_RESULT,
  SELECT_DOCUMENT_IN_OPERAIONS_RESULT,
  SELECT_ENCRYPTED_DOCUMENTS_IN_OPERAIONS_RESULT,
  SELECT_SIGNED_DOCUMENTS_IN_OPERAIONS_RESULT, SIGNING_OPERATION, START,
  SUCCESS,
  UNSELECT_ALL_DOCUMENTS_IN_OPERAIONS_RESULT,
  UNSELECT_DOCUMENT_IN_OPERAIONS_RESULT,
} from "../constants";
import { IOcspModel, ISignModel, ITspModel } from "../reducer/settings";
import * as trustedEncrypts from "../trusted/encrypt";
import * as signs from "../trusted/sign";
import { dirExists, extFile, fileExists, md5 } from "../utils";
import { filePackageDelete, IFile, removeAllFiles } from "./index";

interface ISignParams {
  signModel: ISignModel;
  tspModel: ITspModel;
  ocspModel: IOcspModel;
}

const getTempDirectoryFiles = () => {
  const files: string[] = [];
  if (dirExists(DEFAULT_TEMP_PATH)) {
    fs.readdirSync(DEFAULT_TEMP_PATH).forEach((file) => {
      const fullpath = path.join(DEFAULT_TEMP_PATH, file);

      files.push(fullpath);
    });
  }

  return files;
};

export function multiOperationStart(
  operationsToStart: any,
) {
  return (dispatch: (action: {}) => void, getState: () => any) => {
    dispatch({
      payload: { operations: operationsToStart },
      type: MULTI_DIRECT_OPERATION + START,
    });
  };
}

export function multiDirectOperation(
  files: IFile[],
  setting: any,
  signer: any,
  recipients: any,
) {
  return (dispatch: (action: {}) => void, getState: () => any) => {
    dispatch({
      payload: { operations: setting.operations },
      type: MULTI_DIRECT_OPERATION + START,
    });

    const filesForRemoveFromTemp = getTempDirectoryFiles();

    let packageResult = true;
    const directResult: any = {};
    const directFiles: any = {};
    const filesId: any[] = [];

    setTimeout(async () => {
      const { operations, outfolder } = setting;
      const { encryption_operation, save_copy_to_documents,
        save_result_to_folder, signing_operation } = operations;

      let { archivation_operation } = operations;

      // Always archive files if set detached sign and encryption
      if (signing_operation && setting.sign.detached && encryption_operation) {
        archivation_operation = true;
      }

      let signedFiles: any[] = [];

      files.forEach((file: any) => {
        directFiles[file.id] = { original: { ...file.toJS(), operation: 4 } };
        filesId.push(file.id);
      });

      directResult.results = [];
      directResult.operations = operations.toJS();

      if (save_copy_to_documents && !signing_operation && !archivation_operation && !encryption_operation) {
        files.forEach((file: IFile) => {
          const copyUri = path.join(DEFAULT_DOCUMENTS_PATH, path.basename(file.fullpath));

          if (!fileExists(copyUri)) {
            fs.copyFileSync(file.fullpath, copyUri);
          }
        });
      }

      if (signing_operation) {
        const policies: string[] = [];

        if (setting.sign.detached) {
          policies.push("detached");
        }

        const params: ISignParams | null = {
          ocspModel: setting.ocsp.toJS(),
          signModel: setting.sign.toJS(),
          tspModel: setting.tsp.toJS(),
        };

        let format = trusted.DataFormat.PEM;
        if (setting.sign.encoding !== BASE64) {
          format = trusted.DataFormat.DER;
        }

        files.forEach((file: any) => {
          let newPath = "";
          const newoutfolder = archivation_operation || encryption_operation ? DEFAULT_TEMP_PATH : save_result_to_folder ? outfolder : "";

          if (file.fullpath.split(".").pop() === "sig") {
            newPath = signs.resignFile(file.fullpath, signer, policies, params, format, newoutfolder);
          } else {
            newPath = signs.signFile(file.fullpath, signer, policies, params, format, newoutfolder);
          }

          if (newPath) {
            if (!archivation_operation && !encryption_operation) {
              if (save_copy_to_documents) {
                const copyUri = path.join(DEFAULT_DOCUMENTS_PATH, path.basename(newPath));

                if (!fileExists(copyUri)) {
                  fs.copyFileSync(newPath, copyUri);
                }
              }

              if (setting.sign.detached) {
                let copyUriOriginalFile = path.join(DEFAULT_DOCUMENTS_PATH, path.basename(file.fullpath));

                if (!fileExists(copyUriOriginalFile)) {
                  fs.copyFileSync(file.fullpath, copyUriOriginalFile);
                }

                if (save_result_to_folder && outfolder) {
                  copyUriOriginalFile = path.join(outfolder, path.basename(file.fullpath));

                  if (!fileExists(copyUriOriginalFile)) {
                    fs.copyFileSync(file.fullpath, copyUriOriginalFile);
                  }
                }
              }
            }

            const newFileProps = getFileProps(newPath);

            signedFiles.push({ ...newFileProps, originalId: file.id, originalFullpath: file.fullpath });

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
          } else {
            packageResult = false;

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
          }
        });
      } else {
        signedFiles = [];
        files.forEach((file: any) => signedFiles.push(file.toJS()));
      }

      let archiveName = "";
      let archivedFiles: any[] = [];

      if (archivation_operation && packageResult) {
        const newoutfolder = encryption_operation ? DEFAULT_TEMP_PATH : save_result_to_folder ? outfolder : "";

        let filesForArchive: any[] = signedFiles.slice(0);

        if (signing_operation && setting.sign.detached) {
          filesForArchive = filesForArchive.concat(files);
        }

        try {
          archiveName = await archiveFiles(filesForArchive, newoutfolder);
          if (!encryption_operation && save_copy_to_documents) {
            const copyUri = path.join(DEFAULT_DOCUMENTS_PATH, path.basename(archiveName));

            if (!fileExists(copyUri)) {
              fs.copyFileSync(archiveName, copyUri);
            }
          }

          archivedFiles = [getFileProps(archiveName)];

          const newFileProps = getFileProps(archiveName);

          directResult.results.push({
            id: Date.now() + Math.random(),
            in: filesForArchive,
            operation: ARCHIVATION_OPERATION,
            out: {
              ...newFileProps,
              operation: 2,
            },
            result: true,
          });

          for (const signedFile of signedFiles) {
            const currentId = signedFile.originalId ? signedFile.originalId : signedFile.id;

            directFiles[currentId] = {
              ...directFiles[currentId],
              archivation_operation: {
                out: {
                  ...newFileProps,
                  operation: 2,
                },
                result: true,
              },
            };
          }
        } catch (error) {

          directResult.results.push({
            id: Date.now() + Math.random(),
            in: filesForArchive,
            operation: ARCHIVATION_OPERATION,
            out: {
              operation: 2,
            },
            result: false,
          });
          packageResult = false;
          dispatch({
            payload: { status: packageResult, directResult },
            type: MULTI_DIRECT_OPERATION + FAIL,
          });

        }

      } else {
        archivedFiles = [...signedFiles];
      }
      if (archivation_operation && !packageResult) {
        directResult.results.push({
          id: Date.now() + Math.random(),
          in: signedFiles.slice(0),
          operation: ARCHIVATION_OPERATION,
          out: {
            operation: 2,
          },
          result: false,
        });
        packageResult = false;
        dispatch({
          payload: { status: packageResult, directResult },
          type: MULTI_DIRECT_OPERATION + FAIL,
        });
      }
      let encryptedFiles: any[] = [];

      if (encryption_operation) {
        const policies = { deleteFiles: setting.encrypt.delete, archiveFiles: setting.encrypt.archive };

        let encAlg = trusted.EncryptAlg.GOST_28147;
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

          case DES:
            encAlg = trusted.EncryptAlg.DES;
            break;
          case DES3:
            encAlg = trusted.EncryptAlg.DES3;
            break;
          case AES_128:
            encAlg = trusted.EncryptAlg.AES_128;
            break;
          case AES_192:
            encAlg = trusted.EncryptAlg.AES_192;
            break;
          case AES_256:
            encAlg = trusted.EncryptAlg.AES_256;
            break;
        }

        let format = trusted.DataFormat.PEM;
        if (setting.encrypt.encoding !== BASE64) {
          format = trusted.DataFormat.DER;
        }

        let filesForEncrypt: any[] = [];

        if (signing_operation && setting.sign.detached && !archivation_operation) {
          filesForEncrypt = files.slice(0);
        } else {
          filesForEncrypt = archivedFiles.slice(0);
        }

        filesForEncrypt.forEach((file) => {
          let newoutfolder = "";

          if (save_result_to_folder) {
            newoutfolder = outfolder;
          } else if (!archivation_operation && !setting.sign.detached && file.originalFullpath) {
            newoutfolder = path.dirname(file.originalFullpath);
          } else if (archivation_operation) {
            newoutfolder = HOME_DIR;
          } else {
            newoutfolder = "";
          }

          const newPath = trustedEncrypts.encryptFile(file.fullpath, recipients, policies, encAlg, format, newoutfolder);
          const currentId = file.originalId ? file.originalId : file.id;

          if (newPath) {
            if (save_copy_to_documents) {
              const copyUri = path.join(DEFAULT_DOCUMENTS_PATH, path.basename(newPath));

              if (!fileExists(copyUri)) {
                fs.copyFileSync(newPath, copyUri);
              }
            }

            if (!archivation_operation && setting.encrypt.delete && file && file.originalFullpath) {
              try {
                fs.unlinkSync(file.originalFullpath);
              } catch (e) {
                console.log(e);
              }
            }

            const newFileProps = getFileProps(newPath);

            directResult.results.push({
              id: Date.now() + Math.random(),
              in: { ...file },
              operation: ENCRYPTION_OPERATION,
              out: {
                ...newFileProps,
                operation: 1,
              },
              result: true,
            });

            encryptedFiles.push(newFileProps);

            if (archivation_operation) {
              for (const signedFile of signedFiles) {
                const currentIdSigned = signedFile.originalId ? signedFile.originalId : signedFile.id;

                directFiles[currentIdSigned] = {
                  ...directFiles[currentIdSigned],
                  encryption_operation: {
                    out: {
                      ...newFileProps,
                    },
                    result: true,
                  },
                };

                if (setting.encrypt.delete) {
                  if (signedFile && signedFile.originalFullpath) {
                    try {
                      fs.unlinkSync(signedFile.originalFullpath);
                    } catch (e) {
                      console.log(e);
                    }
                  }

                  try {
                    fs.unlinkSync(signedFile.fullpath);
                  } catch (e) {
                    console.log(e);
                  }
                }
              }
            } else {
              directFiles[currentId] = {
                ...directFiles[currentId],
                encryption_operation: {
                  out: {
                    ...newFileProps,
                    operation: 1,
                  },
                  result: true,
                },
              };
            }
          } else {
            packageResult = false;

            directResult.results.push({
              id: Date.now() + Math.random(),
              in: { ...file },
              operation: ENCRYPTION_OPERATION,
              out: null,
              result: false,
            });

            if (archivation_operation) {
              for (const signedFile of signedFiles) {
                const currentIdSigned = signedFile.originalId ? signedFile.originalId : signedFile.id;

                directFiles[currentIdSigned] = {
                  ...directFiles[currentIdSigned],
                  encryption_operation: {
                    result: false,
                  },
                };
              }
            } else {
              directFiles[currentId] = {
                ...directFiles[currentId],
                encryption_operation: {
                  result: false,
                },
              };
            }
          }
        });

      } else {
        encryptedFiles = [...archivedFiles];
      }

      directResult.files = directFiles;

      dispatch(filePackageDelete(filesId));

      for (const fileForRemove of filesForRemoveFromTemp) {
        try {
          fs.unlinkSync(fileForRemove);
        } catch (e) {
          console.log(e);
        }
      }

      dispatch({
        payload: { status: packageResult, directResult },
        type: MULTI_DIRECT_OPERATION + SUCCESS,
      });

      dispatch(push(LOCATION_RESULTS_MULTI_OPERATIONS));
    }, 0);
  };
}

interface IPackageResult {
  packageResult: boolean;
}

export function multiReverseOperation(
  files: IFile[],
) {
  return (dispatch: (action: {}) => void, getState: () => any) => {
    dispatch({
      type: MULTI_REVERSE_OPERATION + START,
    });

    const filesForRemoveFromTemp = getTempDirectoryFiles();

    const packageResult = { packageResult: true };
    const reverseResult: any = {};
    let reverseFiles: any = {};

    reverseResult.results = [];

    setTimeout(async () => {
      const newFiles = files.map((file: any) => {
        const jsObjFile = file.toJS();

        reverseFiles[file.id] = { original: { ...jsObjFile, originalId: jsObjFile.id, operation: 4 } };

        return jsObjFile;
      });

      for (const newFile of newFiles) {
        await reverseOperations(newFile, reverseFiles, packageResult, reverseResult);
      }

      reverseResult.files = reverseFiles;

      dispatch(removeAllFiles());

      for (const fileForRemove of filesForRemoveFromTemp) {
        try {
          fs.unlinkSync(fileForRemove);
        } catch (e) {
          console.log(e);
        }
      }

      dispatch({
        payload: { status: packageResult.packageResult, reverseResult },
        type: MULTI_REVERSE_OPERATION + SUCCESS,
      });

      dispatch(push(LOCATION_RESULTS_MULTI_OPERATIONS));
    }, 0);
  };
}

const reverseOperations = async (file: any, reverseFiles: any, packageResult: IPackageResult, reverseResult: any) => {
  if (file) {
    if (file.extension === "enc") {
      const newPath = trustedEncrypts.decryptFile(file.fullpath, DEFAULT_TEMP_PATH);
      const currentId = file.originalId ? file.originalId : file.id;

      if (newPath) {
        const newFileProps = { ...getFileProps(newPath), originalId: file.id };

        reverseResult.results.push({
          in: { ...file },
          operation: "decryption_operation",
          out: {
            ...newFileProps,
            operation: 3,
          },
          result: true,
        });

        reverseFiles[currentId] = {
          ...reverseFiles[currentId],
          decryption_operation: {
            out: {
              ...newFileProps,
              operation: 3,
            },
            result: true,
          },
        };

        if (newFileProps.extension === "enc" || newFileProps.extension === "sig" || newFileProps.extension === "zip") {
          await reverseOperations(newFileProps, reverseFiles, packageResult, reverseResult);
        }
      } else {
        packageResult.packageResult = false;

        reverseResult.results.push({
          id: Date.now() + Math.random(),
          in: { ...file },
          operation: "decryption_operation",
          out: null,
          result: false,
        });

        reverseFiles[currentId] = {
          ...reverseFiles[currentId],
          decryption_operation: {
            result: false,
          },
        };
      }
    } else if (file.extension === "sig") {
      const newPath = signs.unSign(file.fullpath, DEFAULT_TEMP_PATH);
      const currentId = file.originalId ? file.originalId : file.id;

      if (newPath) {
        const newFileProps = { ...getFileProps(newPath), originalId: file.id };

        reverseResult.results.push({
          id: Date.now() + Math.random(),
          in: { ...file },
          operation: "unsign_operation",
          out: {
            ...newFileProps,
            operation: 1,
          },
          result: true,
        });

        reverseFiles[currentId] = {
          ...reverseFiles[currentId],
          unsign_operation: {
            out: {
              ...newFileProps,
              operation: 1,
            },
            result: true,
          },
        };

        if (newFileProps.extension === "enc" || newFileProps.extension === "sig" || newFileProps.extension === "zip") {
          await reverseOperations(newFileProps, reverseFiles, packageResult, reverseResult);
        }
      } else {
        packageResult.packageResult = false;

        reverseResult.results.push({
          id: Date.now() + Math.random(),
          in: { ...file },
          operation: "unsign_operation",
          out: null,
          result: false,
        });

        reverseFiles[currentId] = {
          ...reverseFiles[currentId],
          unsign_operation: {
            result: false,
          },
        };
      }
    } else if (file.extension === "zip") {
      await uzipAndWriteSync(file, reverseFiles, packageResult, reverseResult);
    }

    return reverseFiles;
  } else {
    return reverseFiles;
  }
};

async function uzipAndWriteSync(file: any, reverseFiles: any, packageResult: IPackageResult, reverseResult: any) {
  const buffer = fs.readFileSync(file.fullpath);
  const directory = await unzipper.Open.buffer(buffer);

  const unzipedFiles = [];

  for (const fileInZip of directory.files) {
    // if some legacy zip tool follow ZIP spec then this flag will be set
    const isUnicode = fileInZip.isUnicode;

    const encoding = chardet.detect(fileInZip.pathBuffer);

    // decode "non-unicode" filename from OEM Cyrillic character set
    const fileName = isUnicode ? fileInZip.path : il.decode(fileInZip.pathBuffer, encoding && encoding === "UTF-8" ? encoding : "cp866");

    try {
      await new Promise((resolve, reject) => fileInZip.stream()
        .pipe(fs.createWriteStream(path.join(DEFAULT_TEMP_PATH, fileName)))
        .on("error", reject)
        .on("finish", resolve),
      );

      const newFileProps = { ...getFileProps(path.join(DEFAULT_TEMP_PATH, fileName)) };

      unzipedFiles.push({ ...newFileProps, operation: 2 });

      if (newFileProps.extension === "sig" || newFileProps.extension === "enc" || newFileProps.extension === "zip") {
        reverseOperations(newFileProps, reverseFiles, packageResult, reverseResult);
      }
    } catch (e) {
      //
    }
  }

  reverseResult.results.push({
    id: Date.now() + Math.random(),
    in: { ...file },
    operation: "unzip_operation",
    out: {
      operation: 2,
      unzipedFiles,
    },
    result: true,
  });

  const currentId = file.originalId ? file.originalId : file.id;

  reverseFiles[currentId] = {
    ...reverseFiles[currentId],
    unzip_operation: {
      out: {
        operation: 2,
        unzipedFiles,
      },
      result: true,
    },
  };
}

const getFileProps = (fullpath: string) => {
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
};

async function archiveFiles(files: any[], folderOut: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let outURI: string;
    const archiveName = files.length === 1 ? `${files[0].filename}.zip` : "archived.zip";
    if (folderOut.length > 0) {
      outURI = path.join(folderOut, archiveName);
    } else {
      outURI = path.join(HOME_DIR, archiveName);
    }

    let indexFile: number = 1;
    let newOutUri: string = outURI;

    while (fileExists(newOutUri)) {
      const parsed = path.parse(outURI);
      newOutUri = path.join(parsed.dir, parsed.name + "_(" + indexFile + ")" + parsed.ext);
      indexFile++;
    }

    outURI = newOutUri;

    const output = fs.createWriteStream(outURI);
    const archive = window.archiver("zip");

    output.on("close", () => {
      resolve(outURI);
    });

    archive.on("error", () => {
      reject("Error archive");
    });

    archive.pipe(output);

    files.forEach((file) => {
      const stream = fs.createReadStream(file.fullpath);
      stream.on("error", () => {
          output.end();
          fs.unlinkSync (newOutUri);
          reject("error");
        },
      );
      archive.append(stream, { name: file.filename });
    });

    archive.finalize();
  });
}

export function selectDocument(uid: number) {
  return {
    payload: { uid },
    type: SELECT_DOCUMENT_IN_OPERAIONS_RESULT,
  };
}

export function unselectDocument(uid: string) {
  return {
    payload: { uid },
    type: UNSELECT_DOCUMENT_IN_OPERAIONS_RESULT,
  };
}

export function unselectAllDocuments() {
  return {
    type: UNSELECT_ALL_DOCUMENTS_IN_OPERAIONS_RESULT,
  };
}

export function selectAllDocuments() {
  return {
    type: SELECT_ALL_DOCUMENTS_IN_OPERAIONS_RESULT,
  };
}

export function selectSignedDocuments() {
  return {
    type: SELECT_SIGNED_DOCUMENTS_IN_OPERAIONS_RESULT,
  };
}

export function selectArchivedDocuments() {
  return {
    type: SELECT_ARCHIVED_DOCUMENTS_IN_OPERAIONS_RESULT,
  };
}

export function selectEncryptedDocuments() {
  return {
    type: SELECT_ENCRYPTED_DOCUMENTS_IN_OPERAIONS_RESULT,
  };
}

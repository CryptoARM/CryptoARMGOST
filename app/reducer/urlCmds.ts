import {
  START, URL_CMD,
} from "../constants";

const defaultCmd = {
  command: "",
  id: "",
  url: "",
};

export default (urlCmds = defaultCmd, action: any) => {
  const { type, payload } = action;

  switch (type) {
    case URL_CMD + START:
      return {
        ...urlCmds,
        ...payload.urlCommand,
      };
  }

  return urlCmds;
};

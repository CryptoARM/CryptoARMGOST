import {
  FAIL, START, SUCCESS, URL_CMD,
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

    case URL_CMD + SUCCESS:
    case URL_CMD + FAIL:
      return {
        command: "",
        id: "",
        url: "",
      };
  }

  return urlCmds;
};

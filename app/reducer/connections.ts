import { OrderedMap, Record } from "immutable";
import { ADD_CONNECTION, ADD_LICENSE, DELETE_ALL_TEMPORY_LICENSES, REMOVE_CONNECTION, SET_CONNECTED, SET_DISCONNECTED } from "../constants";

const ConnectionModel = Record({
  connected: false,
  id: null,
  socket: null,
});

const LicenseModel = Record({
  id: null,
  license: null,
});

const DefaultReducerState = Record({
  entities: OrderedMap({}),
  licenses: OrderedMap({}),
});

export default (connections = new DefaultReducerState(), action) => {
  const { type, payload } = action;

  switch (type) {
    case ADD_CONNECTION:
      return connections.setIn(["entities", payload.id], new ConnectionModel({
        id: payload.id,
        socket: payload.socket,
      }));

    case ADD_LICENSE:
      return connections.setIn(["licenses", payload.id], new LicenseModel({
        id: payload.id,
        license: payload.license,
      }));

    case DELETE_ALL_TEMPORY_LICENSES:
      return connections.setIn(["licenses"], OrderedMap({}));

    case REMOVE_CONNECTION:
      return connections.deleteIn(["entities", payload.id]);

    case SET_CONNECTED:
      return connections.setIn(["entities", payload.id, "connected"], true);

    case SET_DISCONNECTED:
      return connections.setIn(["entities", payload.id, "connected"], false);
  }

  return connections;
};

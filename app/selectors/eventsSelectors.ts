import { createSelector } from "reselect";
import {
  CERTIFICATE_GENERATION, CERTIFICATE_IMPORT, CRL_IMPORT,
  CSR_GENERATION, DECRYPT, DELETE_CERTIFICATE,
  DELETE_CONTAINER, ENCRYPT, PKCS12_IMPORT, SIGN, UNSIGN, ADD_SERVICE, DELETE_SERVICE, SENT_SERVICE,REQUEST_CERTIFICATE,
} from "../constants";

export const eventsGetter = (state: any) => state.events.entities;
export const filtersGetter = (state: any) => state.filters;

export const filteredEventsSelector = createSelector(eventsGetter, filtersGetter, (events, filters) => {
  const { dateFrom, dateTo, level, operations, operationObjectIn, operationObjectOut, userName } = filters.events;

  return events.filter((event: any) => {
    try {
      return event.userName.match(userName) &&
        event.operationObject && typeof event.operationObject.in === "string" && event.operationObject.in.match(operationObjectIn) &&
        event.operationObject.out.match(operationObjectOut) &&
        (level === "all" ? true : event.level.match(level)) &&
        (dateFrom ? (new Date(event.timestamp)).getTime() >= (new Date(dateFrom)).getTime() : true) &&
        (dateTo ? (new Date(event.timestamp)).getTime() <= (new Date(dateTo.setHours(23, 59, 59, 999))).getTime() : true) &&
        (
          operations[SIGN] && event.operation === "Подпись" ||
          operations[UNSIGN] && event.operation === "Снятие подписи" ||
          operations[ENCRYPT] && event.operation === "Шифрование" ||
          operations[DECRYPT] && event.operation === "Расшифрование" ||
          operations[DELETE_CERTIFICATE] && event.operation === "Удаление сертификата" ||
          operations[DELETE_CONTAINER] && event.operation === "Удаление контейнера" ||
          operations[CERTIFICATE_GENERATION] && event.operation === "Генерация сертификата" ||
          operations[CSR_GENERATION] && event.operation === "Генерация запроса на сертификат" ||
          operations[CERTIFICATE_IMPORT] && event.operation === "Импорт сертификата" ||
          operations[CRL_IMPORT] && event.operation === "Импорт CRL" ||
          operations[ADD_SERVICE] && event.operation === "Добавление сервиса" ||
          operations[DELETE_SERVICE] && event.operation === "Удаление сервиса" ||
          operations[SENT_SERVICE] && event.operation === "Отправлен запрос на регистрацию в УЦ" ||
          operations[REQUEST_CERTIFICATE] && event.operation === "Запрос на сертификат успешно создан" ||
          operations[PKCS12_IMPORT] && event.operation === "Импорт PKCS12" ||
          (
            !operations[SIGN] && !operations[UNSIGN] && !operations[ENCRYPT] &&
            !operations[DECRYPT] && !operations[DELETE_CERTIFICATE] && !operations[DELETE_CONTAINER] &&
            !operations[CERTIFICATE_GENERATION] && !operations[CSR_GENERATION] &&
            !operations[CERTIFICATE_IMPORT] && !operations[CRL_IMPORT] && !operations[PKCS12_IMPORT] && !operations[ADD_SERVICE]
            && !operations[DELETE_SERVICE] && !operations[SENT_SERVICE]
          )
        );
    } catch (e) {
      return false;
    }
  });
});

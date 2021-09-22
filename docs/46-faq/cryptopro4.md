---
slug: "/post8"
title: "Настройка работы приложения на unix системах с КриптоПро CSP 4"
sort: "08"
--- 

Приложение КриптоАРМ ГОСТ выше версии 2 не работает с КриптоПро CSP 4.

Признак - нет никаких сертификатов на вкладке **Сертификаты**.

Для решения проблемы:

1. Установите пакет cprocsp-rsa из дистрибутива КриптоПро: 
   - для линукс: в терминале выполните команду **sudo dpkg -i \<путь к файлу>/cprocsp-rsa-\<...>.deb**
   - для MacOS: при установке КриптоПро CSPнадо выбрать пакет cprocsp-rsa. Если Криптопро был установленн, то нужно переустановить с нужным пакетом.

2. MacOS:   
   - скачайте скрипт https://drive.google.com/file/d/11Ts3wshs0-Fy7mc5NACKEb1x7fEu9oAy/view?usp=sharing,
   - в терминале ввести команду: chmod u+x \<путь к скрипту\>/script.sh
   - sudo \<путь к скрипту\>/script.sh

Linux:   
   - скачайте скрипт (https://drive.google.com/file/d/11Ts3wshs0-Fy7mc5NACKEb1x7fEu9oAy/view?usp=sharing),
   - в терминале ввести команду chmod u+x \<путь к скрипту\>/script.sh
   - sudo bash \<путь к скрипту\>/script.sh

***Важно!*** В результату выполнения команды должно быть сообщение Operations done.

Или, если скрипт не удается запустить.

1. В конфигурационном файле КриптоПро (/etc/opt/cprocsp/config.ini) от администратора добавьте блоки:

-   **Для Linux:**

    (этот после блока [Defaults\\Provider\\"Crypto-Pro RSA CSP"])

    [Defaults\\Provider\\"Crypto-Pro Enhanced RSA and AES CSP"]

    "Image Path" = "/opt/cprocsp/lib/amd64/librsaenh.so"

    "Function Table Name" = "CPRSA_GetFunctionTable"

    Type = 24

    (Этот после блока [Defaults\\"Provider Types"\\"Type 001"])

    [Defaults\\"Provider Types"\\"Type 024"]

    Name = "Crypto-Pro Enhanced RSA and AES CSP"

    TypeName = "RSA Full and AES"

-   **Для MacOS:**

    (этот после блока [Defaults\\Provider\\"Crypto-Pro RSA CSP"])

    [Defaults\\Provider\\"Crypto-Pro RSA CSP and AES CSP"]

    "Image Path" = "/opt/cprocsp/lib/librsaenh.dylib"

    "Function Table Name" = "CPRSA_GetFunctionTable"

    type = 24

    (Этот после блока [Defaults\\"Provider Types"\\"Type 001"])

    [Defaults\\"Provider Types"\\"Type 024"]

    Name = "Crypto-Pro RSA CSP and AES CSP"

    TypeName = "RSA Full (Signature and Key Exchange)"


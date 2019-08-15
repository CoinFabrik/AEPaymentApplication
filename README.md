# AeUniverse

Ecosystem of applications for the AEUniverse Conference.

## Project Structure

* **client** Client/Merchant application to be used by assistants to connect to the Point-of-Sale service.Should run under Base-Aepp


## Prerequisites

The Aepp-SDK is a constantly evolving software base and at this time is **not considered ready for production**. For that reason, we choose to lock development on a fixed version, unless a showstopper bug is encountered and it's already fixed in a newer release.
  
## TODO:

* Check timeout scenarios on every async call
* Include  fees (estimation ? ) at deposit balance check
* Chequear error handling en aeternity.createChannel (try/catch ?) [no hace catch --why????]
* ScanQR.vue: Error handling y alerts. 
* Handling global de mensajes y eventos de disconnect en canal
* Debemos dar info de TX de open/close ( txid por ejemplo con link para verificar en explorer ? )
* Test de dos o tres mensajes de compra seguidos
* Test de mensajes de compra en toda la app (deberian ser recibidos solo en los lugares correctos)
* Check de gas , cual se deberia usar como "promedio" (ahora 1000000)
* Chequear **todos ** los lugares de conversion de unidades (de AEttos a AE) dado que hacemos inputs de Numbers por limitaciones del SDK. Alternativa; manejar BigNumber y pasar Strings de integers de hasta 18 digitos de precision, COMO DEBERIA SER.
* "Confirm" cuando el merchant envia el mensaje, ALERT o view separado? 
* Unificar toda la palabreria (PoS, HUB, customer,merchant,etc)
* Polling de balances en menu principal?? CHOTO.  Mirar bien todos los updates.



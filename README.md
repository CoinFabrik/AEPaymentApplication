# AeUniverse

Ecosystem of applications for the AEUniverse Conference.

## Project Structure

* **client** Client application to be used by assistants to connect to the Point-of-Sale service.Should run under Base-Aepp

* **posclient** Client application to be used by sellers.

* **posservice** Backend application that coordinates buyers and sellers.

## Prerequisites

The Aepp-SDK is a constantly evolving software base and at this time is **not considered ready for production**. For that reason, we choose to lock development on a fixed version, unless a showstopper bug is encountered and it's already fixed in a newer release.
  
## TODO:

* Check timeout scenarios on every async call
* Include  fees (estimation ? ) at deposit balance check 
* Chequear error handling en aeternity.createChannel (try/catch ?) [no hace catch --why????]
* Handling global de mensajes y eventos de disconnect en canal
* Debemos dar info de TX de open/close ( txid por ejemplo con link para verificar en explorer ? )
* Test de dos o tres mensajes de compra seguidos
* Test de mensajes de compra en toda la app (deberian ser recibidos solo en los lugares correctos)



# Æternity Mobile Payment Application

This is the mobile payment application for the Æternity platform. Requires the Payment Hub to operate.


## Project Structure

* **client** Client/Merchant application to be used by assistants to connect to the Point-of-Sale service. 


## Prerequisites

* The payment Hub project.
* NodeJS (10.0?)
* Mobile Base-Aepp (from Version 190905 requires 0.10.0 for proper QR scanning)

## Installing and running

The payment application can run in two roles: Merchant or CLient/Customer.   

For development, use the scripts `customer-base` or `merchant-base` to serve the Vue project at 8080/8081 ports respectively, in https.

```
npm run customer-base
``` 

```
npm run merchant-base
```

For building production versions,

```
npm run build-merchant
``` 

```
npm run build-customer
``` 

## QR Codes

Sample onboarding and payment QR codes can be retrieved from:

https://aehub.coinfabrik.com:3000
https://aehub.coinfabrik.com:3000/products





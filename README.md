# AE Payment Application

This is a payment application built on **AEternity blockchain** state channels. Before putting our hands to work, let's understand the different components of the system: 

 * AEternity node (any public node can be used or you can deploy one yourself)
 * Payment Aepps
 * Payment Hub

To start let's focus on the environment where our featured applications will be running; the **Base-Aepp**. This is the Aeternity blockchain official application where complete features of this blockchain will be available, eg: creating accounts, sending and receiving transactions, etc. It also allows adding specially built applications to interact with the blockchain in custom ways as it is shown in this example. 

## Payment Aepps

Two featured applications have been developed to work together each one has a different purpose: one is for merchants and the other for customers.

To test them either you should follow the [AEternity Payments Application handbook guide](https://github.com/CoinFabrik/AEPaymentApplication/blob/master/docs/AEternity%20Payments%20Application%20Handbook.md). 

This tutorial will take you through a series of instructions to test the Aepps in a simple and straightforward way. We suggest having two mobile phones at the same time while testing them, otherwise, you would not be able to test it smoothly. However, if this is not possible, remember that you can test the Aepps separately, and you can use the Base-Aepp inside your web-browser [here](https://base.aepps.com/) instead of one phone. 

## Payment Hub

This component allows Aepps to connect and distribute payments among them. The Aepps automatically connect to it. However it is possible for you to deploy your own Payment-Hub in which case you'll have to modify the address that the Aepps will connect to, and recompile them. 

For starters, we recommend reading and testing the [AEhub tutorial](https://github.com/CoinFabrik/AEPaymentApplication/blob/master/docs/AEhub.md). This guide will allow you to start your Payment Hub in your computer. 

To conclude, once you are ready to complete the process to start your own AEHub payment application, you must follow the host setup and hub configuration guide, including the reverse proxy configuration to get any phone connected to your server.



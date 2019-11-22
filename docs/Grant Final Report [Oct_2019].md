# Grant Final Report [Oct/2019]

Two months before the [AEternity Universe One Conference](https://aeternityuniverse.com/), [CoinFabrik](https://www.coinfabrik.com/) was asked to build the payments application that would be used in that conference. 

[TOC]

## Requirements

The app would be built on top of and focused on AEternity State-Channel technologies. It should include a mobile phone application allowing users to register as merchants or customers and perform payments. The application should allow customers to perform payments even when they are offline provided they already established their state channels. Moreover, it should allow users to check their past activity.

The application architecture should rely on a "payment-hub" component which handles merchants and customers connections in a way that only one connection is required for any of these clients. This hub must allow to: receive payments on behalf of merchants, validate purchases, inform involved parties, track balances and provide activity history. It should also distribute received payments with the related merchants, when required (we call it *"clearance"*).

![diagram](https://i.imgur.com/7U1Ml7T.png)

Beyond the application development, we were asked to test platform scalability and performance.

## Summary of Development 

The development was performed mostly by Hernan Di Pietro and David Weil as main developers and included partial dedication collaboration from Fabian Mariño, Andres Adjiman and Franco Scucchiero. 

Development includes:

- **Payment Hub**: [AEhub source code](https://gitlab.com/coinfabrik.com/aehub)
    1. Accepts connections from Merchants and Customers.
    2. Keeps track of channels' state providing fast reconnection (for mobile clients).
    3. Performs Payment-Request validation. 
    4. Keeps track of all payments.
    5. Provides merchants balances.

- **Merchant App component for Base-Aepp**: [Apps source code](https://gitlab.com/hernandp/ae-mobile-payment)
    1. Connects to _Payment Hub_ through state channels.
    2. Creates Payment-Request specifying amount and item description.
    3. Gets notified when the customer confirms or rejects the payment.
    4. Checks past activity.
    5. Closes the state channel.

- **Customer App component for Base-Aepp**
    1. Connects to _Payment Hub_ through state channels setting an initial deposit.
    2. Scans Payment-Request, which can be confirmed or rejected.
    3. Checks past activity.
    4. Allows user to increase its channel deposit.
    5. Closes the state channel, so that the remaining funds go to the wallet.
   

We also prepared tools allowing us to perform scalability tests. With those tests we confirmed that we can have over 400 state channels connected and operating safely.

The estimated development time of two months resulted short. We were faced with unexpected difficulties which slowed down the development process and forced us to redesign our initial approach. These difficulties were of three kinds: problems to use the platform, some missing functionalities, and issues which we shared and discussed with the community/development teams/forums.

Most of the issues were handled and could be solved. Below we provide a list of those difficulties for which there are no solution yet available as far as we know, and suggestions for improvements.

In order to have the main feature built on state channel technology, we decided to leave out, due to time restrictions, the following modules: 
 * *Offline-payments* which weren't available at the time.
 * *Clearance* which we considered to be easier to perform  on-chain (as explained below) than to use state channel for final payout. 
 * *Close-channel disputes* which we thought wasn't central for the demo and should pose no challenge to be implemented.

## Challenges

This is a list of difficulties we came across while building the specified application. Some would be perceived as not important if more information were available. 

In general, although the project documentation is extensive, we think that different components could be even more useful if they had, for example, more readable logs, more descriptive error codes, data de/serialization functions availability and instrospection.


### State channels: Creation API - need for an async creation process

#### Description: 
The current way to create a state channel from Javascript SDK is to issue the channel constructor and wait for state progression by listening to a specific event.

However, if disconnection occurs before it gets to _connected_ state, the channel creation process will be aborted; and _you cannot at this time restablish a channel in such state._

Due to energy optimizations in current phone operating systems, apps are stopped and restarted later on, resulting fatal for the process described above.

#### Workaround:
In fact, our experience is that you can mitigate this by forcing the state channel application to avoid sleeping by e.g. wasting CPU cycles in a trivial background task (which leads to side-effects like wasting energy, etc).

#### Solution: 
A proper solution should be expected in a post 5.0.0 release. 


### State channels: Creation issues

#### Description: 
AEternity nodes occasionally do not allow to create new state channels, neither for new nor for addresses already in use. Sometimes the problem can be resolved by restarting the node or just waiting some time.

#### Workaround: 
This lead us to re-design client apps by switching them to an "on-demand" behavior. If a state channel was successfuly created, it will be preemptively disconnected and restablished only when it had to perform some action. This restablish process was perfectly reliable and blazing fast. With this new approach, possible disconnections (which may occur frequently in mobile platforms) are avoided and the channel creation need is minimized.


### State channels: No predefined way to reject state updates. Non-perfect workarounds available

#### Description:
The current Javascript SDK API requires the user to define (or reuse) multiple functions that will be used during the entire state channel's life cycle to allow to accept and sign state channel updates in different circumstances.

In all cases there is no defined way to reject a received update. Therefore, different things may happen according to the particular situation, e.g.: FSM may enter an unknown state and the state channel becomes unusable; or, the channel will enter a timeout state where the user will have to wait a non-user defined timeout to continue its usage.

This situation is also reproduced when using state channels inside the Base-Aepp.

#### Proposed workarounds:
- Reject an update by creating a conflict in the FSM. This was supposed to get the FSM to its previous valid state. We couldn't make it work reliably.
- Wait some internal timeout in order to the FSM automatically reject the new (partially signed) state. This was an extended timeout which made it unusable in our app.

#### Solution:
Later node versions of the 5.0 series provide an API which accepts update rejection.


### State channels: No way to identify two different token transfers of the same amount

#### Description:
In general, the state channel party who receives tokens is not able to distinguish two token transfers of the same amount. In case of a Payment Hub, payments of the same amount from one customer cannot be distinguished. Therefore, there is no direct way to assign each payment to the correponding merchant. 

#### Workaround: 
In our case, we implemented a notification system (over unstructured messages provided by the state channels), which allowed us to specify what the customer is buying, to which merchant, etc.. Still, the token-transfer inside the state channel isn't associated to these messages except by the order in which they are received, but it is enough for the Payment Hub to assign the right merchant.

#### Solution:
It was agreed it would be useful to allow to include metadata in transfers, which will be available in future SDK versions.


### State channels: No way to relate a sign request with a state update?

#### Description: 
Receiving a payment is a multi-step procedure in which you want to be sure where it comes from and that it was effectively applied.

Consider the scenario where a user is making a token transfer over a state channel. If everything goes right, the counterparty will receive two notifications: a signature request and after that a state update notification.

1. Sign request: With the signature request we are able to check which kind of update is being applied to the current chain state. In this case, we verify it is a transfer of tokens "to" us and how many tokens are being transferred.

2. Notification: When the state change notification comes in, you are not able to see what was exactly changed from previous saved state.


The way to relate the notification with the sign-request is that they should happen one next to the other, without other events in between. In particular if you don't ever receive new state notification you can't be sure what happened with what you signed in 1.

Here is the data received to be signed and the final state which doesn't match the signed data:

Sign request:
```
[Nest] 5:57 PM [customer] ch_dA5MBQ16QNHg|tag: update_ack 
    tx: tx_+EY5AqEGUhkBVsq/4Yz6z3ifE1pOuWBGX4uvMLPRhkPJ6jw/bxoFoATKjFioq+kW+
PkkI6OcSdKSquXfwc4+nGj6dQRY+ygAtT0hhQ==
[Nest] 5:57 PM [customer] ch_dA5MBQ16QNHg|tag: update_ack/5: 
    {"tag":"57","VSN":"2","channelId":"ch_dA5MBQ16QNHgkPBCLL3ESXjCwxjvDyJpfQ
tqLd6rh7vfWTBBp",
    "round":"5",
    "stateHash":"st_BMqMWKir6Rb4+SQjo5xJ0pKq5d/Bzj6caPp1BFj7KADcV6lm"}
[Nest] 5:57 PM [customer] ch_dA5MBQ16QNHg|update_ack # 
    th_u72zbmsDBjaDz1AhJfc3t5MhDLwUxYekzhSVrBB6wVCiahBqM -
    signed:tx_+JALAfhCuEBdX1GYS8dQsbavXd4Z6HZvmfMQmNwfcZMeozo1amqKsACwal3kx
CUo0st71hGXE/UpuowzVoYfgnVENqLDceEHuEj4RjkCoQZSGQFWyr/hjPrPeJ8TWk65YEZfi68w
s9GGQ8nqPD9vGgWgBMqMWKir6Rb4+SQjo5xJ0pKq5d/Bzj6caPp1BFj7KAAgk5XW
```
returned the signed state: `tx_+JALAfhCuEB..`

Where the new state received:
```
 / channel: ch_dA5MBQ16QNHgkPBCLL3ESXjCwxjvDyJpfQtqLd6rh7vfWTBBp
 \ state: tx_+NILAfiEuEADvHh5q8XyZIvs9a2Do5iun88o6FY+1h8yU36iZBdSAvfuYB+GX
t2bNBgTA0fKqZM5iHlHkZgkrEqM95quoX0IuEBdX1GYS8dQsbavXd4Z6HZvmfMQmNwfcZMeozo1
amqKsACwal3kxCUo0st71hGXE/UpuowzVoYfgnVENqLDceEHuEj4RjkCoQZSGQFWyr/hjPrPeJ8
TWk65YEZfi68ws9GGQ8nqPD9vGgWgBMqMWKir6Rb4+SQjo5xJ0pKq5d/Bzj6caPp1BFj7KAABuz
9L
```
is: `tx_+NILAfi..` which mismatches with the one above. 

#### Workaround:
Associate the sign request with the state update incoming immediately after. 

#### Solution:
 * One solution is to unpack the received txs in steps 1 and 2, to check they are actually the same when signatures are removed. SDK may provide this verification function.
 * Another solution would be that the SDK provides a unique tag which would be available in steps 1 and 2, allowing the user to relate them.


### State channels: Usability and user interface

#### Description:

All state channel actions anyone wants to perform require both parties **to be online** and **to sign every change**. 

While that is not a problem when customer and merchant are both operating a purchase online, this may represent one in other cases.

When the user triggers the action, whatever it is, the other party (in our case a server application) will instantly respond, and channel state update will be expected and won't look suspicious.

On the other hand, there are different scenarios where the user needs to accept and sign state channel state updates with no impact to his balance (and do not incentivize him to be online):
 - Payment Hub trying to *withdraw* its off-chain balance (received from customers)
 - Payment Hub making new *deposits* to state channel (for later payments to merchants)

In every case having to have the state channel party online to perform any actions requires us to implement a queue where we can keep our actions until users are online.

Another issue is that users need to sign a few state channel updates which are not in "human-readable" format. Therefore, they may accept and sign them, even in the case of malicious updates.


#### Partial Workaround:

For the sake of practicality, we decided that merchants' payments should be made with transfers to their addresses instead to transfers in-channel, however we couldn't find a workaround for the hub withdraw scenario.

#### Summary / Comments:
* It is fundamental for the user to understand what is he actually signing, which must be displayed in the user interface in a readable manner.

* In our application it would be useful that customer could allow its wallet (Base-Aepp) to automatically sign Payment Hub to withdraw (part of) its own off-chain balance (as customer balance wouldn't be affected by that operation) which will be later transferred to corresponding merchants.

* Can this be extended to other channel actions which doesn't affect counterparty's balance?


### Base-Aepp: No easy way to detect in-base aepp navigation events

#### Description: 
The web application framework is powerful but having some events available would make it easier to develop with it. At current state, development must be done in a preemptive way: state must be constantly saved to have it ready or accessible if the app is shutdown at any time. If your application performs many different tasks which may take a long time, you must be sure to invoke them in a way which will always perform app-state update.

#### Solution: 
A possible approach would be to implement an event-callback which let's the application know that it will be navigated out to another Base-Aepp screen and whenever OS informs Base-Aepp that Base-Aepp will be closed (like: [developer.android.com/../Activity.html#onStop()](https://developer.android.com/reference/android/app/Activity.html#onStop())).


### Base-Aepp: Events to detect address change

#### Description: 
A nice feature of Base-Aepp is the ability to change the current account without the need to reload the running embedded app. However it is the responsibility of that app to detect the change of the current account. And this could lead to different problems, like, e.g: signing transactions with different accounts than expected.

#### Solution: 
It would be necessary to receive a callback notifying about the change.


### Base-Aepp: Events to detect important settings change

#### Description: 
Like in the previous item, there is no way to identify when the user changed any setting like for example: node address or node network or network name.

#### Solution: 
It would be necessary to receive a callback notifying about the settings changes.


### Base-Aepp: Notification system for hosted applications

#### Description: 
Some operations may take longer than expected, e.g. send a transaction (on-chain), so it could be useful to provide a mechanism to let the user know when the operation finishes, and whether it was completed succesfully or not.

#### Solution: 
It would be necessary to include a callback allowing apps to trigger a system Toast to notify the user.

Change log

0.8.0 (190822)
--------------

+ First testing Alpha release. 

0.8.2 (190826)
--------------
+ Revamped internal handling of channel events
+ Cleaned up Payment process: logic factored-out from view and moved to PaymentProcessor class
+ Friendlier text messages in many screens 
+ Removed unnecessary Onboarding "allow this wallet" dialog
+ UI enhancements 
+ Transaction history 
+ Handling of CANCELED payment notification 
+ Handling of Customer trying to purchase with insufficient channel funds 
+ Two decimal digits shown in user interface for AE amounts

KNOWN ISSUES: 
+ Payment process can  time-out due to a bug we are analyzing.


0.8.5 (190828)
--------------
+ Fixed: Sometimes "Waiting transaction" screens at Deposit or Withdraw stuck at 100%
+ Fixed: Hide QR if build flag VUE_APP_DISABLEQRSCANCODES=1
+ Fixed: QR stops functioning if an invalid QRcode is scanned
+ Fixed: Onboarding QR format validation 
+ Hub now communicates channel options at onboarding stage, preventing misconfiguration.
+ Heartbeat protocol with Hub to mantain permanent connection
+ Merchant receives a payment message for every successful purchase.

KNOWN ISSUES: 
+ Camera does not work in iOS devices
+ Payment process can  time-out due to a bug we are analyzing.
+ Cancelling transactions through Base-Aepp dialog may enter inconsistent state.
+ UI Scaling does not work well in low vertical res screens, this is a WIP

0.8.6 (190830)
--------------
+ CLOSE channel request acts as an application exit: will reset all state and require to do re-login process from start
+ Fixed issue where you cannot login on iOS with QR-click instead of camera
+ Node connection timeout implemented at startup.
+ App will ask user to add funds to wallet if balance is zero.
+ Application will always store the latest usable state and return to proper screen when refreshing or going back and forth to other base-aepps screens:
  - If we didnt went thru Scan QR, we are for a clean startup. Wait for connection to wallet.
  - If we already scanned QR, but didnt went thru User Register, go to Register.
  - If we already scanned QR plus we already got user name from hub, go to channel Opening.
  - If we did QR + user name + channel opening, go to Main Menu.

KNOWN ISSUES:
+ If you dont get camera access while scanning QRs, you may need to accept camera permission in main base Aepp first.
+ Payment process can  time-out due to a bug we are analyzing.
+ Transparent channel reconnection if it goes to DISCONNECT state
+ Cancelling transactions through Base-Aepp dialog may enter inconsistent state.

0.8.8 (190904)
--------------
+ An opened channel will re-open on disconnect, if there is any available state
+ Enhanced navigation. Application will always store the latest usable state and return to proper screen.
+ Main Menu shows registered-user name
+ Router navigation fix on reload.
+ Close / Deposit can be cancelled at user request.

UI changes: 

+ UI updates
+ (New) Global Style CSS
+ (removed) Title Dividers
+ SweetAlert2 “OK button” restyle for matching color pallet
+ AEHeader tweaks & logo replacement
+ Tx Fee estimate in Bold
+ QR Scan screens Tweaks
+ Text Elements Tweaks AeInput reduced bottom spacing
+ home buttons > responsive iphone 5 and X
+ home button group margins in low resolutions (iPhone 5)
+  restyle AeButton neutral (white) > Cancel Button
+ Wallet Balance widget tweaks
+ History “Add Tx” button > Rounded

0.9.5 (190910)
------------------
**NOTE** This version requires base-aepp >= 0.10.0.

+ A new operation mode is available: OnDemand connection, where channels are not kept open but used on-demand by leave/connection operations.  Application can be built using this mode using **VUE_APP_ONDEMAND_CONNECTION_MODE=1** in `.env` file or environment variable.  Ondemand mode should work until all reconnection/restablish/leave/disconnect operation issues are ironed out (see for example issue #651 in aepp-js-sdk).

+ Merchant in OnDemand Mode will wait for customer scanning and processing of payment; after a timeout it will go disconnected again.
+ New QR Scanner through the base-aepp. Should work on all platforms.
+ Removed Payment Codes fallback.
+ Registered name cannot be empty
+ Deposit, Withdraw and Purchase Amounts cannot be zero or negative.
+ After user registration, we'll check if there is a channel opened with saved state to reconnect.
+ If channel opening fails, user will be offered to retry or cancel and open a new channel.
+ Fixed channel open status display.
+ More UI tweaks.

KNOWN ISSUES:

+ Merchant funds may not updated.
+ Transaction history for customer may not show entries.
+ Deposit/Withdrawal are BROKEN in Connect Ondemand Mode https://www.pivotaltracker.com/n/projects/2124891/stories/167944617
+ Page refresh is BROKEN in always-connected mode due to channel object "rehydration" issues (ref:  issue #651 in aepp-js-sdk); also in Merchant app while waiting for payment, Refresh will doom current open channel object!
+ Cancelling transactions through Base-Aepp dialog may cause channel to enter inconsistent state.

0.9.7 (190912)
--------------
**NOTE** This version requires base-aepp >= 0.10.1.

+ First version compliant for Node V5.0.0 
+ Balance in favor of Merchant peer now displayed properly at Main Menu.
+ Fixes in "My Activity" section for Merchants.
+ Main Menu  button fixes in OnDemand mode.
+ Channel opening sequence can be cancelled by user.
+ In On-demand Mode, Leave operation request now properly waits for final DISCONNECTED state.
+ Touches and little fixes on UI and navigation.


KNOWN ISSUES:

+ Scrolling seems to be locked by container iframe, causing keyboard to display over the UI.  Switch to floating keyboard if possible to address this.
+ In some screens you may not be able to enter payment concept due to space constraints.
+ When OnDemand mode is active, Withdraw and Deposit are not available (see  https://www.pivotaltracker.com/n/projects/2124891/stories/167944617)
+ Page Refresh may cause problems if a channel operation is underway. This should be fixed with 4.7.0 and reconnection mechanism (not included yet)
+ Do not switch subaccounts except before channel opening.
+ Cancelling transactions through Base-Aepp dialog may cause channel to enter inconsistent state.

0.9.8 (190913)
--------------
**NOTE** This version requires base-aepp >= 0.10.1.

+ Based on SDK 4.7.0
+ Fixes handling the user request of Cancelling channel open process.
+ On Open and Close, Tx Hash is available on screen. Can be copied to clipboard by clicking on it.
+ Main Menu shows "loader" while querying balances.

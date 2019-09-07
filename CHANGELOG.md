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

0.9.0-WIP (190906)
------------------
**NOTE** This version requires base-aepp >= 0.10.0.

+ New QR Scanner through the base-aepp. Should work on all platforms.
+ Removed Payment Codes fallback.
+ Registered name cannot be empty
+ Deposit, Withdraw and Purchase Amounts cannot be zero or negative.
+ After user registration, we'll check if there is a channel opened with saved state to reconnect.
+ If channel opening fails, user will be offered to retry or cancel and open a new channel.


KNOWN ISSUES:
+ Transparent channel reconnection if it goes to DISCONNECT state
+ Cancelling transactions through Base-Aepp dialog may enter inconsistent state.
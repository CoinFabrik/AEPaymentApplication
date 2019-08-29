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

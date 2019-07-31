/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI
---------------------------------------------------------------------------------- */
const jstools = require("./jstools");
const myjschannel = require("./myjschannel");
const MyChannel = myjschannel.MyChannel;
/*-----------------------------------------------------------------------------------
    UTIL FUNCTIONS
---------------------------------------------------------------------------------- */

(async function () {
    let pub = await jstools.get_public("hub"); //"ak_dfLvALARoMJs4kvKDkvjdf6Crvs9pAqJYEv3WsxMHM9hNw4DK"
    let peer = await MyChannel.Initiator(pub);
    if (peer==null)
        return;
    await peer.init();
    await peer.initChannel();

    await peer.wait_state("OPEN");

    hb(peer).then(console.log).catch(console.error);

    await peer.update(10);
    //await peer.shutdown();
    //await wait_state("DISCONNECTED");
    //h = await peer.height();
    //console.log("height:", h, "Balance:", await peer.balance({height: h}));
})();

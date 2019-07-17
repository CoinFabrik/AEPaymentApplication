/* eslint-disable no-console */
import Aepp from '@aeternity/aepp-sdk'

const aeternity = {
    network: null,
    client: null,
    address: null,
    height: null
}

aeternity.connectToBaseApp = async function () {
    console.log(process.env)
    if (process.env.VUE_APP_MOCK_BASEAEPP_CONNECTION == 1) {
        return { status: true, error: null }
    }

    if (window.parent !== window) {
        try {
            aeternity.client = await Aepp();
            return { status: true, error: null };
        } catch (err) {
            console.log(err);
            return { status: false, error: err };
        }
    }
    else 
    {
        return { status: false, error: "Please run this application under the Base AEpp Wallet!" };
    }
}

export default aeternity;
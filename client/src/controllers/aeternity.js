/* eslint-disable no-console */

const {
    Aepp,
    Channel,
    Crypto,
    Universal
} = require('@aeternity/aepp-sdk');

const aeternity = {
    network: null,
    client: null,
    address: null,
    pk: null,
    height: null,
    api_server_proto: null,
    api_server_port: null,
    api_server_address: null,
}

aeternity.connectToBaseApp = async function () {

    if (process.env.VUE_APP_MOCK_BASEAEPP_CONNECTION === "1") {
        return { status: true, error: null }
    }
    if (process.env.VUE_APP_USE_TEST_ENV === "1") {
        //
        // Forgae Testing Nodes Setup
        //

        aeternity.api_server_address = process.env.VUE_APP_TEST_API_SERVER_ADDRESS;
        aeternity.api_server_port = process.env.VUE_APP_TEST_API_SERVER_PORT;
        aeternity.api_server_proto = process.env.VUE_APP_TEST_API_SERVER_PROTO;

        const params = {
            networkId: 'ae_devnet',
            url: aeternity.getApiServerUrl(),
            internalUrl: aeternity.getApiServerUrl(),
            keypair: {
                publicKey: process.env.VUE_APP_TEST_WALLET_ADDRESS,
                secretKey: process.env.VUE_APP_TEST_WALLET_PK
            },
            compilerUrl: null
        }

        try {
            console.log ("Initiating test Universal object with params:");
            console.log(params);

            aeternity.client = await Universal(params);
            return { status: true, error: null };
        } catch (err) {
            console.log(err);
            return { status: false, error: err }
        }
    } else {
        if (window.parent !== window) {
            try {
                aeternity.client = await Aepp();
                return { status: true, error: null };
            } catch (err) {
                console.log(err);
                return { status: false, error: err };
            }
        }
        else {
            return { status: false, error: "Please run this application under the Base AEpp Wallet!" };
        }
    }
}

aeternity.getAddress = function () {
    return aeternity.address;
}

aeternity.getPk = function () {
    return aeternity.client.pk;
}

aeternity.getApiServerUrl = function () {
    return aeternity.api_server_proto + '://' + aeternity.api_server_address + ':' + aeternity.api_server_port
}

export default aeternity;
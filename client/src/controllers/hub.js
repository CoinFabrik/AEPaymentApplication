/* eslint-disable no-console */

import axios from 'axios'

class HubConnection {
  constructor(hubUrl, userAddress) {
    this.hubUrl = hubUrl;
    this.address = userAddress;
  }

  async getMerchantName() {
    try {
      const resp = await axios.get(this.hubUrl + '/merchantId/' + this.address);
      return { success: true, name: resp.name };
    } catch (error) {
      console.warn("getMerchantName request returned: ", error);
      if (error.response) {
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return { success: false, code: error.response.status };
      } else if (error.request) {
        return { success: false, request: error.request };
      } else {
        return { success: false, error: error };
      }
    }
  }

  async registerMerchant(name) {
    try {
      const resp = await axios.put(name);
      return true;
    } catch (err) {
      console.log(err);
    }
  }
}

export default HubConnection;
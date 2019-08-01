/* eslint-disable no-console */

import axios from 'axios'

class HubConnection {
  constructor(hubUrl, userAddress) {
    this.hubUrl = hubUrl;
    this.address = userAddress;
  }

  handleError(error) {
    console.warn("Request returned: ", error);
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      return { success: false, code: error.response.status };
    } else if (error.request) {
      console.log(error.request);
      return { success: false, request: error.request };
    } else {
      return { success: false, error: error };
    }
  }

  async getMerchantName() {
    try {
      const resp = await axios.get(this.hubUrl + '/merchantId/' + this.address);
      return { success: true, name: resp.name };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async registerMerchant(name) {
    try {
      await axios.put(name);
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export default HubConnection;
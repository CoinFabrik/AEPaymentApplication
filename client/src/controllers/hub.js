/* eslint-disable no-console */

import axios from 'axios'

class HubConnection {
  constructor(hubUrl, userAddress) {
    if (hubUrl === undefined || userAddress === undefined) {
      throw new Error("Hub constructor cannot have undefined parameters");
    }
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

  async notifyClientOnboarding(amount) {
    try {
      let output = await axios.get(this.hubUrl + '/client/' + this.address + '/' + amount);
      // console.log(JSON.stringify(output));
      return { success: true, address: output.data.address };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async notifyMerchantOnboarding(amount, name) {
    try {
      let output = await axios.get(this.hubUrl + '/merchant/' + this.address + '/' + amount + '/' + name);
      // console.log(JSON.stringify(output));
      return { success: true, address: output.data.address };
    } catch (error) {
      return this.handleError(error);
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
/* eslint-disable no-console */

import axios from 'axios'

class HubConnection {
  constructor(hubIp, userAddress) {
    if (hubIp === undefined || userAddress === undefined) {
      throw new Error("Hub constructor cannot have undefined parameters");
    }
    this.hubIp = hubIp;
    this.address = userAddress;
  }

  handleError(error) {
    console.warn("Request returned: ", error);
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      return { success: false, code: error.response.status, error };
    } else if (error.request) {
      console.log(error.request);
      return { success: false, request: error.request, error };
    } else {
      return { success: false, error };
    }
  }

  async getRegisteredName(role) {
    if (role === "client" || role === "merchant") {
      try {
        let res = await axios.get(this.hubIp + '/' + role + '/' + this.address);
        return { success: true, name: res.data.name };
      } catch (error) {
        return this.handleError(error);
      }
    } else {
      throw new Error("Unknown role: ") + role;
    }
  }

  async getHubBalance() {
    try {
      let res = await axios.get(this.hubIp + '/balance/' + this.address);
      return { success: true, balance: res.data.balance };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async storeProductData(data, uuid) {
    try {
      await axios.post(this.hubIp + '/products/store', { uuid, data });
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async fetchProductData(uuid) {
    try {
      let res = await axios.get(this.hubIp + '/products/' + uuid);
      return { success: true, data: res.data.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async notifyUserOnboarding(amount, name, role) {
    if (role === "client" || role === "merchant") {
      try {
        let output = await axios.get(this.hubIp + '/' + role + '/' + this.address + '/' + amount + '/' + name);
        // console.log(JSON.stringify(output));
        return { success: true, address: output.data.address, node: output.data.node };
      } catch (error) {
        return this.handleError(error);
      }
    } else {
      throw new Error("Unknown role: ") + role;
    }
  }
}

export default HubConnection;
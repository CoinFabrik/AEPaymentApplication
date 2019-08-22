<template>
  <div class="qr-code-reader">
    <div v-if="browserReader" v-show="cameraAllowed" class="video-wrapper">
      <video ref="qrCodeVideo" />
    </div>
  </div>
</template>

<script>
/* eslint-disable no-console */

import { BrowserQRCodeReader } from "@zxing/library/esm5/browser/BrowserQRCodeReader";
export default {
  name: "QrCodeReader",
  data: () => ({
    cameraAllowed: false,
    browserReader: new BrowserQRCodeReader()
  }),
  watch: {
    async cameraAllowed(value) {
      if (!value) {
        this.stopReading();
        return;
      }
      let scanData = await this.scan();
      this.$emit("hasData", scanData.text);
    }
  },
  async mounted() {
    if (navigator.permissions) {
      try {
        const status = await navigator.permissions.query({ name: "camera" });
        this.cameraAllowed = status.state !== "denied";
        status.onchange = () => {
          this.cameraAllowed = status.state !== "denied";
        };
      } catch (err) {
        console.warn(
          "queryCameraPermissions failed: " +
            err.toString() +
            " -- Trying alternative getUserMedia method"
        );
      }
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      console.log("Obtained mediaStream by getUserMedia method");
      mediaStream.getTracks().forEach(track => track.stop());
      this.cameraAllowed = true;
    } catch (e) {
      console.log("getUserMedia method failed: " + e.toString());
      this.cameraAllowed = false;
    }
    if (!this.cameraAllowed) {
      this.$displayError(
        "Oops!",
        "We don't have permission to access your camera. Please review your security settings and try again.",
        () => {
          this.$router.back();
        }
      );
    }
  },
  beforeDestroy() {
    this.stopReading();
  },
  methods: {
    async scan() {
      return await this.browserReader.decodeFromInputVideoDevice(
        undefined,
        this.$refs.qrCodeVideo
      );
    },
    stopReading() {
      this.browserReader.reset();
    },
    cancelReading() {
      this.stopReading();
      this.$emit("error", new Error("Cancelled by user"));
    }
  }
};
</script>

<style>
.qr-code-reader {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 100vh;
}
.permission-denied {
  text-align: center;
  line-height: 1.56;
  padding: 0 20px;
  margin: auto;
  font-size: 18px;
}
.video-wrapper {
  flex-grow: 1;
  overflow: hidden;
  position: relative;
}
video {
  padding: 2px;
  border: grey 1px solid;
  object-fit: cover;
  width: 100%;
  height: 100%;
}
</style>

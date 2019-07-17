<template>
  <div class="qr-code-reader">
    <div
      v-if="browserReader"
      v-show="cameraAllowed"
      class="video-wrapper"
    >
      <video ref="qrCodeVideo" />
    </div>
    <div
      v-if="!cameraAllowed"
      class="permission-denied"
    >
      Please enable access to your camera for the mobile browser
      that you are using to open the Base æpp Wallet.
    </div>
  </div>
</template>

<script>
import { BrowserQRCodeReader } from '@zxing/library/esm5/browser/BrowserQRCodeReader';
export default {
  name: "QrCodeReader",
  props: {
    //resolve: { type: Function, required: true },
    //reject: { type: Function, required: true },
  },
  data: () => ({
    cameraAllowed: false,
    browserReader: new BrowserQRCodeReader(),
  }),
  watch: {
    async cameraAllowed(value) {
      if (!value) {
        this.stopReading();
        return;
      }
      this.resolve(await this.scan());
    },
  },
  async mounted() {
    if (navigator.permissions) {
      const status = await navigator.permissions.query({ name: 'camera' });
      this.cameraAllowed = status.state !== 'denied';
      status.onchange = () => {
        this.cameraAllowed = status.state !== 'denied';
      };
      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStream.getTracks().forEach(track => track.stop());
      this.cameraAllowed = true;
    } catch (e) {
      this.cameraAllowed = false;
    }
  },
  beforeDestroy() {
    this.stopReading();
  },
  methods: {
    async scan() {
      return await this.browserReader.decodeFromInputVideoDevice(
          undefined,
          this.$refs.qrCodeVideo,
        ).getText();
    },
    stopReading() {
      this.browserReader.reset();
    },
    cancelReading() {
      this.stopReading();
      this.reject(new Error('Cancelled by user'));
    },
  },
};
</script>
<!--
<style lang="scss" scoped>
//@import '../styles/globals/functions.scss';
.qr-code-reader {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 100vh;
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
    video {
      object-fit: cover;
      position: absolute;
      width: 100%;
      height: 100%;
    }
  }
}
</style>
-->
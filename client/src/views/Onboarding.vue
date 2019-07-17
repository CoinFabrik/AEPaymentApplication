<template>
    <div class="onboarding">
      <div>
        <AeText>To access AE Universe Services, please scan the "Onboarding" QR Code at your nearest AEUniverse Conference Stand</AeText>
      </div>
      <div id="scan_qr_container">
        <QrCodeReader />
      </div>
    </div>
</template>

<script>

import QrCodeReader from "../components/QrCodeReader.vue"
import {
  AeText
} from "@aeternity/aepp-components";
export default {
  name: "Onboarding",
  components: {
    AeText,
    QrCodeReader
  },
  data() {
    return {
    };
  },
  computed: {
  },
  methods: {
  }
};
</script>

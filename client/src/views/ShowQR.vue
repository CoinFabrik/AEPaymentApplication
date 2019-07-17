<template>
  <div class="hello">
    <AeMain>
      <AeText>This is the QR Code for your AEternity Address</AeText>
    </AeMain>
  </div>
</template>

<script>
import Aepp from '@aeternity/aepp-sdk/es/ae/aepp';
import "@aeternity/aepp-components/dist/aepp.global.css";
import "@aeternity/aepp-components/dist/aepp.components.css";
import {
  AeMain,
  AeText,
  AeAddress,
  AeButton,
  AeCard,
  AeQrCode
} from "@aeternity/aepp-components";

export default {
  name: 'Scan',
  props: {
    msg: String
  }
}
</script>
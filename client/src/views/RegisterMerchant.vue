<template>
  <div class="register-merch">
    <AeText>Before we begin, you need to register a name to identify yourself or your business.</AeText>
    <AeText
      face="sans-s"
    >This name will appear in your customers display when they buy your products</AeText>
    <AeInput ref="inputName" @input="onNameInput" placeholder="Your personal or business identity name"></AeInput>

    <AeButton face="round" fill="primary" extend @click="confirm()">Confirm</AeButton>
  </div>
</template>

<script>
import { AeText, AeButton, AeInput } from "@aeternity/aepp-components";

export default {
  name: "RegisterMerchant",
  components: {
    AeButton,
    AeText,
    AeInput
  },
  props: {},
  data() {
    return {
      nameInput: ""
    };
  },
  computed: {
    isValidInput() {
      return this.nameInput.length > 0;
    }
  },
  methods: {
    confirm() {
      this.$store.commit("setMerchantName", this.nameInput);
      this.$router.replace({
        name: "deposit",
        params: {
          initialDeposit: true
        }
      });
    },
    onNameInput(v) {
      this.nameInput = v;
    }
  },
  mounted () {
  //  this.$nextTick(() => this.$refs.inputName.focus())
  }
};
</script>
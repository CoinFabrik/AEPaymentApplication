<template>
  <b-container class="history-view">
    <AeText
      class="title"
      fill="primary"
    >
      Transaction History
    </AeText>
    <b-row>
      <div class="column">
        <AeText weight="bold">
          Date
        </AeText>
      </div>
      <div class="column">
        <AeText weight="bold">
          To/From
        </AeText>
      </div>
      <div class="column">
        <AeText weight="bold">
          Amount
        </AeText>
      </div>
    </b-row>
    <div class="scroll">
      <AeList>
        <div
          v-for="tx in history"
          :key="tx.txid"
        >
          <AeListItem fill="neutral">
            <div class="column">
              {{ tx.date }}
            </div>
            <div class="column">
              {{ tx.to }}
            </div>
            <div class="column">
              {{ tx.amount }}
            </div>
          </AeListItem>
        </div>
        <AeButton
          face="round"
          fill="secondary"
          @click="addMoreItems"
        >
          +
        </AeButton>
      </AeList>
      <AeButton
        v-if="isIOS()"
        class="backButton"
        face="round"
        fill="primary"
        extend
        @click="goBack"
      >
        ←
      </AeButton>
    </div>
  </b-container>
</template>

<script>
  import {
    AeText,
    AeList,
    AeListItem,
		AeButton
	} from "@aeternity/aepp-components";

  export default {
    name: "History",
    components: {
      AeText,
      AeList,
      AeListItem,
			AeButton
		},
		data: () => {
			return {
				history: [
				],
			}
		},
    computed: {
      getAddress: function () { return "xxxxxx"; },
		},
    methods: {
			addMoreItems: function() {
				this.history.push(
					{
            txid: 'tx_2bbbbbbbbbbbbbbbbb913923089',
            date: '9/4/19 10:30',
            to: 'ak_addr3',
            amount: 4.999
          }
				)
			},
      goBack: function() {
        this.$router.go(-1);
			},
			isIOS: function() {
				if(/iPhone/i.test(navigator.userAgent)) {
					return true
				}
			},
    }
  };
</script>

<style>
  .column {
    flex: 1;
  }
	.backButton {
		position: fixed !important;
		left: 0px;
		bottom:0px;
	}
	#progress-el {
		background-color: #FF0D6A !important;
	}
	.scroll {
		overflow: scroll;
		max-height: 50vh;
		padding-bottom: 20;
	}
</style>
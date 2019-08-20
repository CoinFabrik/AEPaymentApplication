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
          v-for="tx in getTxHistory"
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
    computed: {
      getAddress: function () { return "xxxxxx"; },
      getTxHistory: function () {
        return [
          {
            txid: 'tx_2390230923098230892308923089',
            date: '8/4/19 18:26',
            to: 'ak_addr1',
            amount: 0.3091
          },
          {
            txid: 'tx_aaaaaaaaaa098230892308923089',
            date: '8/4/19 19:00',
            to: 'ak_addr2',
            amount: 10.3
          },
          {
            txid: 'tx_2bbbbbbbbkkkk923089',
            date: '9/4/19 10:30',
            to: 'ak_addr3',
            amount: 4.5
          },
          {
            txid: 'tx_2390230923yyyyy2308923089',
            date: '8/4/19 18:26',
            to: 'ak_addr1',
            amount: 0.3091
          },
          {
            txid: 'tx_aaaaaaaaaa098230mmmmm089',
            date: '8/4/19 19:00',
            to: 'ak_addr2',
            amount: 10.3
          },
          {
            txid: 'tx_mmmmmmbbbbbbbbbbbbbb92308923089',
            date: '9/4/19 10:30',
            to: 'ak_addr3',
            amount: 4.5
          },
          {
            txid: 'tx_23902309230982ssss30892308923089',
            date: '8/4/19 18:26',
            to: 'ak_addr1',
            amount: 0.3091
          },
          {
            txid: 'tx_aaaaaaaxssss92308923089',
            date: '8/4/19 19:00',
            to: 'ak_addr2',
            amount: 10.3
          },
          {
            txid: 'tx_2bbbbbbbbbbb3f0s092308923089',
            date: '9/4/19 10:30',
            to: 'ak_addr3',
            amount: 4.5
          },
          {
            txid: 'tx_2390230923098230892308923089X',
            date: '8/4/19 18:26',
            to: 'ak_addr1',
            amount: 0.3091
          },
          {
            txid: 'tx_aaaaaaaaaa09823089230892Z',
            date: '8/4/19 19:00',
            to: 'ak_addr2',
            amount: 10.3
          },
          {
            txid: 'tx_2bbbbbbbbbbbbbbbbb913923089',
            date: '9/4/19 10:30',
            to: 'ak_addr3',
            amount: 4.999
          }
        ]
      }
    },
    methods: {
			addMoreItems: function() {

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
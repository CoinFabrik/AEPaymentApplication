<template>
  <b-container class="history-view">
    <AeText fill="primary">Transaction History</AeText>
    <b-row>
      <div class="column">
        Date
      </div>
      <div class="column">
        To/From
      </div>
      <div class="column">
        Amount
      </div>
    </b-row>
    <AeView>
      <AeList>
        <div v-for="tx in getTxHistory" v-bind:key="tx.txid">
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
      </AeList>
    </AeView>
		<AeButton class="backButton" face="round" fill="primary" extend v-on:click="goBack">←</AeButton>
  </b-container>

</template>

<script>
  import {
    AeText,
    AeList,
    AeListItem,
		AeView,
		AeButton
  } from "@aeternity/aepp-components";

  export default {
    name: "History",
    components: {
      AeText,
      AeList,
      AeListItem,
			AeView,
			AeButton
    },
    methods: {
      goBack: function() {
        this.$router.go(-1);
      }
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
            amount: 4.5
          }
        ]
      }
    }
  };
</script>

<style>
  .row {

  }

  .column {
    flex: 50%;
  }
	.backButton {
		position: absolute !important;
		left: 0px;
		bottom:0px;
	}
</style>
<template>
  <b-container class="history-view">
    <ViewTitle title="My Activity" />
    <div v-show="isLoading">
      <AeText>Loading...</AeText>
      <AeLoader />
    </div>
    <div v-show="!isLoading && history.length === 0">
      <AeText>You don't have any channel transactions yet</AeText>
    </div>
    <b-row v-show="!isLoading && history.length > 0">
      <div class="column-header">
        <AeText weight="500" face="sans-s">Date</AeText>
      </div>
      <div class="column-header">
        <AeText weight="500" face="sans-s">Name</AeText>
      </div>
      <div class="column-header">
        <AeText weight="500" face="sans-s">Amount</AeText>
      </div>
    </b-row>
    <div class="scroll">
      <AeList>
        <div v-for="tx in history" :key="tx.uuid">
          <AeListItem fill="neutral" @click="launchPopUp(tx)">
            <div class="column">{{ tx.shortDate }}</div>
            <div class="column">{{ tx.name }}</div>
            <div class="column">{{ tx.amount }}</div>
          </AeListItem>
        </div>
        <b-modal id="authorize-modal" centered hide-footer hide-header>
          <div class="d-block text-center">
            <AeText weight="bold" face="sans-l">Summary</AeText>
            <br />
            <b-row>
              <b-col>
                <AeText align="left" weight="500">Name</AeText>
              </b-col>
              <b-col>
                <AeText>{{ modal.name && modal.name.trim().length > 0 ? modal.name : "N/A" }}</AeText>
              </b-col>
            </b-row>

            <b-row>
              <b-col>
                <AeText align="left" weight="500">Address</AeText>
              </b-col>
              <b-col>
                <AeText>{{ modal.peer && modal.peer.trim().length > 0 ? this.prettyAddr(modal.peer) : "N/A"}}</AeText>
              </b-col>
            </b-row>

            <b-row>
              <b-col>
                <AeText align="left" weight="500">Amount</AeText>
              </b-col>
              <b-col>
                <AeText>{{ modal.amount }} Æ</AeText>
              </b-col>
            </b-row>

            <b-row>
              <b-col>
                <AeText align="left" weight="500">Concept</AeText>
              </b-col>
              <b-col>
                <AeText>{{ modal.item && modal.item.trim().length > 0 ? modal.item : "N/A"}}</AeText>
              </b-col>
            </b-row>

            <b-row>
              <b-col>
                <AeText align="left" weight="500">Date</AeText>
              </b-col>
              <b-col>
                <AeText>{{ modal.longDate }}</AeText>
              </b-col>
            </b-row>

            <br />
            <b-row>
              <b-col>
                <AeButton face="round" fill="primary" @click="$bvModal.hide('authorize-modal')">Ok</AeButton>
              </b-col>
            </b-row>
          </div>
        </b-modal>
      </AeList>
    </div>
    <!-- <div class="fixedButton">
      <AeButton face="icon" fill="primary" @click="addItems(history.length)">
        <ae-icon name="plus" />
      </AeButton>
    </div> -->
    <ViewButtonSection :buttons="[{name:'Back', action: goBack, cancel:true}]" />
  </b-container>
</template>

<script>
import aeternity from "../controllers/aeternity";
import HubConnection from "../controllers/hub";
import BigNumber from "bignumber.js";
import { trimAddress } from "../util/tools";
let hub;
export default {
  name: "History",
  data: () => {
    return {
      history: [],
      modal: {},
      isLoading: true
    };
  },
  async mounted() {
    this.isLoading = true;
    hub = new HubConnection(
      this.$store.state.hubUrl,
      await aeternity.getAddress()
    );
    await this.addItems();
    this.isLoading = false;
  },
  methods: {
    prettyAddr: function(addr) {
      return trimAddress(addr);
    },
    addItems: async function(to, from) {
      try {
        let res = await hub.getTxHistory(process.env.VUE_APP_ROLE, to, from);
        if (!res.success) {
          this.$swal
            .fire({
              type: "error",
              title: "Oops",
              html: "We could not fetch your history at this time. <br>Error: "+ res.error + " <br>To: " + to + " <br>From: " + from
            })
            .then(this.$router.replace("main-menu"));
        }
        console.log(res);

        if (res.txhistory) {
          res.txhistory.map(function(val, index) {
            res.txhistory[index].amount = new BigNumber(
              res.txhistory[index].amount
            )
              .dividedBy(BigNumber(10 ** 18))
              .toFixed(2, BigNumber.ROUND_UP);
          });
          this.history.push(...res.txhistory);
        }
      } catch (e) {
        this.$swal
          .fire({
            type: "error",
            title: "Oops",
            text:
              "We could not fetch your history at this time. Reason:" +
              e.toString()
          })
          .then(this.$router.replace("main-menu"));
      }
    },
    goBack: function() {
      this.$router.replace("main-menu");
    },
    isIOS: function() {
      if (/iPhone/i.test(navigator.userAgent)) {
        return true;
      }
    },
    launchPopUp: function(tx) {
      this.modal = tx;
      this.$bvModal.show("authorize-modal");
    }
  }
};
</script>

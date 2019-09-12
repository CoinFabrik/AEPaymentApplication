<template>
  <b-container class="history-view">
    <ViewTitle title="Transaction History" />
    <b-row>
      <div class="column">
        <AeText weight="500" face="sans-s">Date</AeText>
      </div>
      <div class="column">
        <AeText weight="500" face="sans-s">Name</AeText>
      </div>
      <div class="column">
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
                <AeText align="left" weight="500">Place</AeText>
              </b-col>
              <b-col>
                <AeText>{{ modal.name }}</AeText>
              </b-col>
            </b-row>
            <b-row>
              <b-col>
                <AeText align="left" weight="500">Items</AeText>
              </b-col>
              <b-col>
                <div v-for="item in modal.item" :key="item.what">
                  <AeText>{{ item.amount }} - {{ item.what }}</AeText>
                </div>
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
    <div class="fixedButton">
      <AeButton face="icon" fill="primary" @click="addItems(history.length)">
        <ae-icon name="plus" />
      </AeButton>
    </div>
    <ViewButtonSection v-if="isIOS()" :buttons="[{name:'Back', action: goBack, cancel:true}]" />
  </b-container>
</template>

<script>
import aeternity from '../controllers/aeternity'
import HubConnection from "../controllers/hub";
import BigNumber from "bignumber.js";
let hub;
export default {
  name: "History",
  data: () => {
    return {
      history: [],
      modal: {}
    };
  },
  async mounted() {
    hub = new HubConnection(this.$store.state.hubUrl, await aeternity.getAddress());
    await this.addItems();
  },
  methods: {
    addItems: async function(to, from) {
      try {
        let res = await hub.getTxHistory(process.env.VUE_APP_ROLE, to, from);
        if (!res.success) {
          this.$swal
            .fire({
              type: "error",
              title: "Sorry",
              text: "We could not fetch your history at this time. "
            })
            .then(this.$router.replace("main-menu"));
        }
        console.log(res);

        res.txhistory.map(function(val, index) {
          res.txhistory[index].amount = new BigNumber(
            res.txhistory[index].amount
          )
            .dividedBy(BigNumber(10 ** 18))
            .toFixed(2);
        });
        this.history.push(...res.txhistory);
      } catch (e) {
        this.$swal
          .fire({
            type: "error",
            title: "Sorry",
            text:
              "We could not fetch your history at this time. Reason:" +
              e.toString()
          })
          .then(this.$router.replace("main-menu"));
      }
    },
    goBack: function() {
      this.$router.back();
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

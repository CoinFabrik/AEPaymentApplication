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
          Name
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
          :key="tx.uuid"
        >
          <AeListItem
            fill="neutral"
            @click="launchPopUp(tx)"
          >
            <div class="column">
              {{ tx.shortDate }}
            </div>
            <div class="column">
              {{ tx.name }}
            </div>
            <div class="column">
              {{ tx.amount }}
            </div>
          </AeListItem>
        </div>
        <b-modal
          id="authorize-modal"
          centered
          hide-footer
          hide-header
        >
          <div class="d-block text-center">
            <AeText
              weight="bold"
              face="sans-l"
            >
              Summary
            </AeText>
            <br>
            <b-row>
              <b-col>
                <AeText
                  align="left"
                  weight="500"
                >
                  Place
                </AeText>
              </b-col>
              <b-col>
                <AeText>
                  {{ modal.name }}
                </AeText>
              </b-col>
            </b-row>
            <b-row>
              <b-col>
                <AeText
                  align="left"
                  weight="500"
                >
                  Items
                </AeText>
              </b-col>
              <b-col>
                <div
                  v-for="item in modal.item"
                  :key="item.what"
                >
                  <AeText>
                    {{ item.amount }} - {{ item.what }}
                  </AeText>
                </div>
              </b-col>
            </b-row>
            <b-row>
              <b-col>
                <AeText
                  align="left"
                  weight="500"
                >
                  Date
                </AeText>
              </b-col>
              <b-col>
                <AeText>
                  {{ modal.longDate }}
                </AeText>
              </b-col>
            </b-row>
            <br>
            <b-row>
              <b-col>
                <AeButton
                  face="round"
                  fill="primary"
                  @click="$bvModal.hide('authorize-modal')"
                >
                  Ok
                </AeButton>
              </b-col>
            </b-row>
          </div>
        </b-modal>
        <AeButton
          face="round"
          fill="secondary"
          @click="addItems(history.length)"
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

	import getTxHistory from './../controllers/requests';

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
				modal: {
				}
			}
		},
		mounted() {
			this.addItems();
		},
    methods: {
			addItems: function(to, from) {
				getTxHistory(to, from).then((res) => {
					this.history.push(...res);
				});
			},
      goBack: function() {
        this.$router.go(-1);
			},
			isIOS: function() {
				if(/iPhone/i.test(navigator.userAgent)) {
					return true
				}
			},
			launchPopUp: function(tx) {
				this.modal = tx;
				this.$bvModal.show('authorize-modal')
			}
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
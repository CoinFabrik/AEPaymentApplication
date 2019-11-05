<template>
  <b-container>
    <AePanel style="padding:0.5rem; height=110%;" @click="on-click">
      <b-row align-v="center">
        <b-col>
          <AeText
            fill="secondary"
            weight="600"
            align="left"
            face="sans-s"
          >
            Wallet Balance
          </AeText>
        </b-col>
        <b-col>
          <ae-amount v-show="!loading"
            class="amount"
            align="left"
            :value="walletBalance"
            unit="Æ"
            size="small"
            clear="right"
          />
          <AeLoader v-show="loading" />
        </b-col>
      </b-row>
      <AeDivider />
      <b-row align-v="center">
        <b-col>
          <AeText
            fill="secondary"
            weight="600"
            align="left"
            face="sans-s"
          >
            Channel Balance
          </AeText>
        </b-col>
        <b-col>
          
          <ae-amount v-show="!loading"
            class="amount"
            :value="channelBalance"
            unit="Æ"
            size="small"
          />
          <AeLoader v-show="loading" />
        </b-col>
      </b-row>
    </AePanel>
  </b-container>
</template>


<script>
	export default {
		name: "ViewBalances",
		props: ['walletBalance', 'channelBalance', 'loading', 'on-click'],
	};
</script>

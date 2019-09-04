<template>
  <b-container>
    <AePanel>
      <AeText
        fill="secondary"
        weight="600"
        align="left"
        face="sans-s"
      >
        Wallet Balance
      </AeText>
      <ae-amount
        class="amount"
        align="left"
        :value="walletBalance"
        unit="Æ"
        size="small"
        clear="right"
      />
      <AeDivider />
      <AeText
        fill="secondary"
        weight="600"
        align="left"
        face="sans-s"
      >
        Channel Balance
      </AeText>
      <ae-amount
        class="amount"
        :value="channelBalance"
        unit="Æ"
        size="small"
      />
    </AePanel>
  </b-container>
</template>


<script>
	export default {
		name: "ViewBalances",
		props: ['walletBalance', 'channelBalance'],
	};
</script>


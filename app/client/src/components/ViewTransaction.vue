<template>
  <AePanel
    id="tx_confirm_panel"
    fill="secondary"
  >
    <b-row align-v="center">
      <b-col>
        <AeText
          fill="secondary"
          weight="600"
          align="left"
          face="sans-s"
        >
          Amount
        </AeText>
      </b-col>
      <b-col>
        <AeText
          align="right"
          face="sans-s"
          class="amount"
        >
          {{ (amount * 1.0).toFixed(2) }} AE
        </AeText>
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
          Fee
        </AeText>
      </b-col>
      <b-col>
        <AeText
          align="right"
          face="sans-s"
          class="amount"
        >
          {{ fee }} AE
        </AeText>
      </b-col>
    </b-row>
  </AePanel>
</template>

<script>
	export default {
		name: "ViewTransaction",
		props: ['amount', 'fee'],
	};
</script>

<template>
  <AePanel
    id="tx_confirm_panel"
    fill="secondary"
  >
    <b-row>
      <b-col>
      <AeText
        align="left"
        weight="bold"
        fill="secondary"
      >
        Amount
      </AeText>
      </b-col>
      <b-col>
      <AeText
        align="right"
        face="sans-s"
      >
        {{ (amount * 1.0).toFixed(2) }} AE
      </AeText>
      </b-col>
    </b-row>
    <AeDivider />
    <b-row>
      <b-col>
        <AeText
          align="left"
          weight="bold"
          fill="secondary"
        >
          Fee
        </AeText>
        </b-col>
        <b-col>
        <AeText
          align="right"
          face="sans-s"
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
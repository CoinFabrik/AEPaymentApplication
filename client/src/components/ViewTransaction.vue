<template>
  <AePanel
    id="tx_confirm_panel"
    fill="secondary"
  >
    <AeText
      align="left"
      weight="bold"
      fill="secondary"
    >
      Amount
    </AeText>
    <AeText
      align="right"
      face="sans-s"
    >
      {{ (amount * 1.0).toFixed(2) }} AE
    </AeText>
    <AeDivider />
    <AeText
      align="left"
      weight="bold"
      fill="secondary"
    >
      Fee
    </AeText>
    <AeText
      align="right"
      face="sans-s"
    >
      {{ fee }} AE
    </AeText>
  </AePanel>
</template>

<script>
	export default {
		name: "ViewTransaction",
		props: ['amount', 'fee'],
	};
</script>
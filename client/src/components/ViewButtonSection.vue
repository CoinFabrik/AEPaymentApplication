<template>
  <div class="footer buttonsection">
    <div v-if="buttons.length == 2">
      <b-row class="no-padding">
        <b-col>
          <AeButton
            class="marginal"
            face="round"
            extend
            :fill="buttons[0]['fill'] ? buttons[0]['fill'] : 'primary'"
            @click="buttons[0]['action']"
          >
            {{ buttons[0]['name'] }}
          </AeButton>
        </b-col>
        <b-col>
          <AeButton
            class="marginal"
            face="round"
            extend
            :disabled="buttons[1]['disabled']"
            :fill="buttons[1]['fill'] ? buttons[1]['fill'] : 'primary'"
            @click="buttons[1]['action']"
          >
            {{ buttons[1]['name'] }}
          </AeButton>
        </b-col>
      </b-row>
    </div>
    <div v-if="buttons.length == 4">
      <div
        v-if="getHeight() > 500"
        class="mb-2"
      >
        <b-row class="no-padding">
          <b-col>
            <AeButton
              class="marginal"
              face="round"
              extend
              :fill="buttons[0]['fill'] ? buttons[0]['fill'] : 'primary'"
              @click="buttons[0]['action']"
            >
              {{ buttons[0]['name'] }}
            </AeButton>
            <AeButton
              class="marginal"
              face="round"
              extend
              :disabled="buttons[1]['disabled']"
              :fill="buttons[1]['fill'] ? buttons[1]['fill'] : 'primary'"
              @click="buttons[1]['action']"
            >
              {{ buttons[1]['name'] }}
            </AeButton>

            <AeButton
              class="marginal"
              face="round"
              extend
              :fill="buttons[2]['fill'] ? buttons[2]['fill'] : 'primary'"
              @click="buttons[2]['action']"
            >
              {{ buttons[2]['name'] }}
            </AeButton>
            <AeButton
              class="marginal"
              face="round"
              extend
              :disabled="buttons[3]['disabled']"
              :fill="buttons[3]['fill'] ? buttons[3]['fill'] : 'primary'"
              @click="buttons[3]['action']"
            >
              {{ buttons[3]['name'] }}
            </AeButton>
          </b-col>
        </b-row>
      </div>
      <div
        v-else
        class="mb-4"
      >
        <b-row class="no-padding">
          <b-col>
            <AeButton
              class="marginal"
              face="round"
              extend
              :fill="buttons[0]['fill'] ? buttons[0]['fill'] : 'primary'"
              @click="buttons[0]['action']"
            >
              {{ buttons[0]['name'] }}
            </AeButton>
          </b-col>
          <b-col>
            <AeButton
              class="marginal"
              face="round"
              extend
              :disabled="buttons[1]['disabled']"
              :fill="buttons[1]['fill'] ? buttons[1]['fill'] : 'primary'"
              @click="buttons[1]['action']"
            >
              {{ buttons[1]['name'] }}
            </AeButton>
          </b-col>
        </b-row>
        <b-row class="no-padding">
          <b-col>
            <AeButton
              class="marginal"
              face="round"
              extend
              :fill="buttons[2]['fill'] ? buttons[2]['fill'] : 'primary'"
              @click="buttons[2]['action']"
            >
              {{ buttons[2]['name'] }}
            </AeButton>
          </b-col>
          <b-col>
            <AeButton
              class="marginal"
              face="round"
              extend
              :disabled="buttons[3]['disabled']"
              :fill="buttons[3]['fill'] ? buttons[3]['fill'] : 'primary'"
              @click="buttons[3]['action']"
            >
              {{ buttons[3]['name'] }}
            </AeButton>
          </b-col>
        </b-row>
      </div>
    </div>
    <div v-if="buttons.length === 1">
      <AeButton
        class="marginal"
        face="round"
        extend
        :disabled="buttons[0]['disabled']"
        :fill="buttons[0]['fill'] ? buttons[0]['fill'] : 'primary'"
        @click="buttons[0]['action']"
      >
        {{ buttons[0]['name'] }}
      </AeButton>
    </div>
  </div>
</template>


<script>
	export default {
		name: "ViewButtonSection",
		props: ['buttons'],
		methods: {
			getHeight() {
				return window.innerHeight;
			}
		}
	};
</script>

<style scoped>
	.buttonsection {
		margin-bottom: 2vh !important;
		position: fixed;
	}
	.marginal {
		margin-top: 10px
	}
	.no-padding {
		padding-bottom: 0px !important;
	}
</style>

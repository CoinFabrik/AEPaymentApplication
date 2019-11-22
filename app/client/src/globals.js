
import Vue from 'vue'
import VueSweetalert2 from 'vue-sweetalert2'
Vue.use(VueSweetalert2)

export default {
    computed: {
        $isMerchantAppRole: function () {
            return process.env.VUE_APP_ROLE === "merchant";
        },
        $isClientAppRole: function () {
            return process.env.VUE_APP_ROLE === "client";
        },
        $isOnDemandMode: function() {
            return parseInt(process.env.VUE_APP_ONDEMAND_CONNECTION_MODE) ===  1;
        }
    },
    methods: {
        async $displayError(title, text, onCloseCallback) {
            Vue.swal.fire({
                allowOutsideClick: false,
                heightAuto: false,
                type: "error",
                title,
                text,
                onClose: onCloseCallback
            });
        }
    }
};

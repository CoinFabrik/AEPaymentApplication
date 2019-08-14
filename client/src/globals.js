
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
        }
    },
    methods: {
        $displayError(title, text) {
            Vue.swal.fire({
                type: "error",
                title: "Oops!",
                text
            });
        }
    }
};

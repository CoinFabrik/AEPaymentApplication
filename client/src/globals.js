export default {
    computed: {
        $isMerchantAppRole: function () {
            return process.env.VUE_APP_ROLE === "merchant";
        },
        $isClientAppRole: function () {
            return process.env.VUE_APP_ROLE === "client";
        }
    },
};

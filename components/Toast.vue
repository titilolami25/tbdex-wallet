<template>
  <div v-if="visible" class="fixed bottom-4 right-4 bg-gray-800 text-white py-2 px-4 rounded shadow-md">
    {{ message }}
  </div>
</template>

<script>
export default {
  data() {
    return {
      visible: false,
      message: '',
    };
  },
  methods: {
    showToast(msg) {
      this.message = msg;
      this.visible = true;
      setTimeout(() => {
        this.visible = false;
      }, 3000);
    },
  },
};
</script>

<style scoped>
/* Additional styles */
</style>

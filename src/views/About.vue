<template>
  <div class="about">
    <h1>This is an about page </h1>
    {{mes}}
  </div>
</template>
<script>
import axios from 'axios';
export default {
  data() {
    return {
      mes: 'about page',
    };
  },
  methods: {
    init() {
      axios.get('/user/user').then((data) => {
        debugger;
      });
    },
  },
  created() {
    this.init();
  },
};
</script>

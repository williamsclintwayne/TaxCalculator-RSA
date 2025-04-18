<template>
  <v-app>
    <v-main>
      <!-- 1. Use your actual component name -->
      <TaxCertificateGenerator />
    </v-main>
  </v-app>
</template>

<script>
// 2. Correct import syntax (remove 'default' keyword)
import TaxCertificateGenerator from './components/TaxCertificateGenerator.vue'

export default {
  name: 'App',

  // 3. Register your actual component
  components: {
    TaxCertificateGenerator
  },

  // 4. Data function (keep empty if unused)
  data: () => ({
    // 
  }),
}
</script>


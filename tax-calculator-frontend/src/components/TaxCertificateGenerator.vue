<template>
    <v-container class="pa-4" max-width="700px">
      <v-card elevation="8" class="pa-6">
        <h2 class="mb-4">South African Tax Certificate Generator</h2>
  
        <v-form ref="form" v-model="formValid" lazy-validation>
          <v-text-field
            v-model="form.fullName"
            label="Full Name"
            :rules="[v => !!v || 'Full Name is required']"
            required
          />
  
          <v-text-field
            v-model="form.taxRefNumber"
            label="Tax Reference Number (Optional)"
            :rules="[v => !!v || 'Tax Reference Number is required']"
            required
          />
  
          <v-text-field
            v-model.number="form.taxYear"
            label="Tax Year"
            type="number"
            :rules="[v => v >= 2020 || 'Enter a valid tax year']"
            required
          />
  
          <v-text-field
            v-model.number="form.monthlySalary"
            label="Monthly Salary (R)"
            type="number"
            :rules="[v => v >= 0 || 'Must be positive']"
            required
          />
  
          <v-text-field
            v-model.number="form.annualBonus"
            label="Annual Bonus (R)"
            type="number"
            :rules="[v => v >= 0 || 'Must be positive']"
          />
  
          <v-text-field
            v-model.number="form.retirementAnnuityContributions"
            label="Retirement Annuity Contributions (R)"
            type="number"
            :rules="[v => v >= 0 || 'Must be positive']"
          />
  
          <v-text-field
            v-model.number="form.medicalTaxCredits"
            label="Medical Tax Credits (Monthly R)"
            type="number"
            :rules="[v => v >= 0 && v <= 3500 || 'Must be between 0 and 3500']"
          />
  
          <v-text-field
            v-model.number="form.taxableIncome"
            label="Taxable Income (R)"
            type="number"
            :rules="[v => v >= 0 || 'Must be positive']"
            required
          />
  
          <v-text-field
            v-model.number="form.totalTaxPayable"
            label="Total Tax Payable (R)"
            type="number"
            :rules="[v => v >= 0 || 'Must be positive']"
            required
          />
  
          <v-text-field
            v-model.number="form.monthlyTax"
            label="Monthly Tax (R)"
            type="number"
            :rules="[v => v >= 0 || 'Must be positive']"
            required
          />
  
          <v-text-field
            v-model="emailTo"
            label="Email to send certificate (optional)"
            type="email"
            :rules="[v => !v || /.+@.+\..+/.test(v) || 'E-mail must be valid']"
          />
  
          <v-row class="mt-6" justify="space-between">
            <v-btn
              color="primary"
              :loading="loading"
              :disabled="loading || !formValid"
              @click="generatePdf"
            >
              Generate & Download PDF
            </v-btn>
  
            <v-btn
              color="secondary"
              :loading="emailLoading"
              :disabled="emailLoading || !emailTo || !lastGeneratedPdf"
              @click="emailPdf"
            >
              Email PDF
            </v-btn>
          </v-row>
        </v-form>
  
        <v-alert
          v-if="message"
          :type="messageType"
          class="mt-4"
          dismissible
          @input="message = ''"
        >
          {{ message }}
        </v-alert>
      </v-card>
    </v-container>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    data() {
      return {
        form: {
          fullName: "",
          taxRefNumber: "",
          taxYear: new Date().getFullYear(),
          monthlySalary: 0,
          annualBonus: 0,
          retirementAnnuityContributions: 0,
          medicalTaxCredits: 0,
          taxableIncome: 0,
          totalTaxPayable: 0,
          monthlyTax: 0,
        },
        emailTo: "",
        loading: false,
        emailLoading: false,
        message: "",
        messageType: "info",
        lastGeneratedPdf: null,
        formValid: false,
      };
    },
    watch: {
      form: {
        handler() {
          // Calculate taxable income dynamically
          const annualIncome = this.form.monthlySalary * 12 + this.form.annualBonus;
          const deductions = this.form.retirementAnnuityContributions + this.form.medicalTaxCredits * 12;
          this.form.taxableIncome = Math.max(0, annualIncome - deductions);

          // Calculate total tax payable (example logic, replace with actual tax calculation)
          const taxRate = 0.18; // Example tax rate
          this.form.totalTaxPayable = this.form.taxableIncome * taxRate;

          // Calculate monthly tax
          this.form.monthlyTax = this.form.totalTaxPayable / 12;
        },
        deep: true,
      },
    },
    methods: {
      async generatePdf() {
        if (!this.$refs.form.validate()) {
          this.message = "Please fix validation errors.";
          this.messageType = "warning";
          return;
        }
  
        this.loading = true;
        this.message = "";
  
        try {
          console.log('Form data being sent:', this.form);
          const response = await this.$axios.post(
            "TaxCertificate/generate-pdf", // Removed hardcoded base URL
            this.form,
            { responseType: "blob" }
          );
  
          const blob = new Blob([response.data], { type: "application/pdf" });
          this.lastGeneratedPdf = blob;
  
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          const safeFileName = this.form.fullName.replace(/\s+/g, "_");
          link.download = `${safeFileName}_TaxCertificate_${this.form.taxYear}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
  
          this.message = "PDF generated and downloaded successfully.";
          this.messageType = "success";
        } catch (error) {
          console.error(error);
          if (error.response && error.response.data) {
            const reader = new FileReader();
            reader.onload = () => {
              console.error('Server error details:', reader.result);
            };
            reader.readAsText(error.response.data);
          }
          this.message = "Failed to generate PDF.";
          this.messageType = "error";
        } finally {
          this.loading = false;
        }
      },
  
      async emailPdf() {
        if (!this.emailTo) {
          this.message = "Please enter a valid email address.";
          this.messageType = "warning";
          return;
        }
  
        if (!this.lastGeneratedPdf) {
          this.message = "Please generate the PDF before emailing.";
          this.messageType = "warning";
          return;
        }
  
        this.emailLoading = true;
        this.message = "";
  
        try {
          const base64 = await this.blobToBase64(this.lastGeneratedPdf);
  
          await axios.post("/api/TaxCertificate/send-email", {
            email: this.emailTo,
            pdfBase64: base64,
          });
  
          this.message = "Tax certificate emailed successfully.";
          this.messageType = "success";
        } catch (error) {
          console.error(error);
          if (error.response && error.response.data) {
            const reader = new FileReader();
            reader.onload = () => {
              console.error('Server error details:', reader.result);
            };
            reader.readAsText(error.response.data);
          }
          this.message = "Failed to send email.";
          this.messageType = "error";
        } finally {
          this.emailLoading = false;
        }
      },
  
      blobToBase64(blob) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result.split(",")[1];
            resolve(base64data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      },
    },
  };
  </script>
  
  <style scoped>
  .v-card {
    background: linear-gradient(145deg, #f0f4f8, #d9e2ec);
    border-radius: 12px;
  }
  </style>

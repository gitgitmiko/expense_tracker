<template>
  <div :class="['app', { 'night-mode': nightMode }]">
    <!-- Toggle Button for Night Mode in Top Right Corner -->
    <div class="toggle-container">
      <button @click="toggleNightMode" class="btn toggle-btn">
        <i :class="nightMode ? 'fas fa-sun' : 'fas fa-moon'"></i>
      </button>
    </div>
    
    <h1>Expense Tracker</h1>

    <!-- Container for Form, Filter, and Table -->
    <div class="container">
      <!-- Add Expense Form -->
      <section class="add-expense-section">
        <h2>Add Expense</h2>
        <form @submit.prevent="addExpense" class="expense-form">
          <div class="form-group">
            <input v-model="newExpense.amount" type="number" placeholder="Amount" required />
          </div>
          <div class="form-group">
            <input v-model="newExpense.description" type="text" placeholder="Description" />
          </div>
          <div class="form-group">
            <input v-model="newExpense.date" type="date" required />
          </div>
          <button type="submit" class="btn">Add Expense</button>
        </form>
      </section>

      <!-- Filter Section -->
      <section class="filter-section">
        <div class="month-selector">
          <label for="month">Month: </label>
          <select id="month" v-model="selectedMonth" @change="filterExpenses">
            <option value="" disabled>Select Month</option>
            <option v-for="(month, index) in months" :key="index" :value="index + 1">{{ month }}</option>
          </select>
        </div>
        <div class="year-selector">
          <label for="year">Year: </label>
          <select id="year" v-model="selectedYear" @change="filterExpenses">
            <option value="" disabled>Select Year</option>
            <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
          </select>
        </div>
      </section>

      <!-- Salary Input -->
      <section class="salary-section">
        <div class="form-group">
          <input v-model="salary" type="number" placeholder="Enter Salary" />
        </div>
      </section>

      <!-- Expense Table -->
      <section class="expense-table-section">
        <div class="expense-table">
          <div class="expense-table-header">
            <div class="expense-table-cell">Amount</div>
            <div class="expense-table-cell">Description</div>
            <div class="expense-table-cell">Date</div>
          </div>
          <ul class="expense-list">
            <li v-for="expense in filteredExpenses" :key="expense.id" class="expense-item">
              <div class="expense-table-cell">{{ formatRupiah(expense.amount) }}</div>
              <div class="expense-table-cell">{{ expense.description }}</div>
              <div class="expense-table-cell date-cell">{{ formatDate(expense.date) }}</div>
            </li>
          </ul>
          <div class="expense-table-footer">
            <div class="footer-item">
              <strong>Total Expenses:</strong> {{ formatRupiah(totalExpenses) }}
            </div>
            <div class="footer-item">
              <strong>Salary:</strong> {{ formatRupiah(salary) }}
            </div>
            <div class="footer-item">
              <strong>Remaining:</strong> {{ formatRupiah(remaining) }}
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Export Button -->
    <button @click="exportToExcel" class="btn export-btn">Export to Excel</button>
  </div>
</template>

<script>
import axios from 'axios';
import * as XLSX from 'xlsx';

export default {
  data() {
    return {
      expenses: [],
      newExpense: {
        amount: '',
        description: '',
        date: ''
      },
      selectedMonth: 0,
      selectedYear: 0,
      months: [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      years: [], // To be populated with current and past years
      selectedMonth: this.getCurrentMonth(),
      selectedYear: this.getCurrentYear(),
      salary: 6800000, // Initialize salary
      nightMode: false // Initialize night mode state
    };
  },
  computed: {
    filteredExpenses() {
      return this.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const expenseMonth = expenseDate.getMonth() + 1;
        const expenseYear = expenseDate.getFullYear();

        const monthMatches = this.selectedMonth === 0 || expenseMonth === this.selectedMonth;
        const yearMatches = this.selectedYear === 0 || expenseYear === this.selectedYear;

        return monthMatches && yearMatches;
      });
    },
    totalExpenses() {
      return this.filteredExpenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
    },
    remaining() {
      return this.salary - this.totalExpenses;
    }
  },
  created() {
    this.populateYears();
    this.fetchExpenses(); // Fetch expenses when component is created
  },
  methods: {
    getCurrentMonth() {
      return new Date().getMonth() + 1; // January is 0, so we add 1
    },
    getCurrentYear() {
      return new Date().getFullYear();
    },
    populateYears() {
      const currentYear = new Date().getFullYear();
      this.years = Array.from({ length: 5 }, (_, i) => currentYear - i); // Last 5 years
    },
    async fetchExpenses() {
      try {
        const response = await axios.get('http://localhost/expense-tracker-backend/get_expenses.php');
        console.log(response.data);
        this.expenses = response.data;
      } catch (error) {
        console.error('Error fetching expenses:', error);
      }
    },
    async addExpense() {
      try {
        await axios.post('http://localhost/expense-tracker-backend/add_expense.php', this.newExpense, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          transformRequest: [(data) => {
            const params = new URLSearchParams();
            for (const key in data) {
              params.append(key, data[key]);
            }
            return params.toString();
          }]
        });
        this.newExpense = { amount: '', description: '', date: '' };
        this.fetchExpenses();
      } catch (error) {
        console.error('Error adding expense:', error);
      }
    },
    filterExpenses() {
      console.log('Selected month:', this.selectedMonth);
      console.log('Selected year:', this.selectedYear);
    },
    formatDate(date) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(date).toLocaleDateString(undefined, options);
    },
    formatRupiah(amount) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    },
    getFormattedDate() {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0'); // January is 0
      const year = now.getFullYear();
      return `${day}-${month}-${year}`;
    },
    generateYears() {
      const currentYear = new Date().getFullYear();
      for (let year = currentYear; year >= currentYear - 5; year--) {
        this.years.push(year);
      }
    },
    exportToExcel() {
      // Create a new workbook and add a worksheet
      const wb = XLSX.utils.book_new();
      
      // Prepare the data
      const data = this.filteredExpenses.map(expense => ({
        Amount: this.formatRupiah(expense.amount),
        Description: expense.description,
        Date: this.formatDate(expense.date)
      }));

      // Add a summary row for Total Salary and Remaining Amount
      data.push({});
      data.push({
        Amount: `Total Salary: ${this.formatRupiah(this.salary)}`,
        Description: `Total Expenses: ${this.formatRupiah(this.totalExpenses)}`,
        Date: `Remaining: ${this.formatRupiah(this.remaining)}`
      });

      // Convert data to worksheet
      const ws = XLSX.utils.json_to_sheet(data);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

      // Get formatted date for file name
      const formattedDate = this.getFormattedDate();

      // Write the workbook to a file
      XLSX.writeFile(wb, `Expenses_Report_${formattedDate}.xlsx`);
    },
    toggleNightMode() {
      this.nightMode = !this.nightMode;
    }
  },
  mounted() {
    this.fetchExpenses();
    this.generateYears();
  }
};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');

body, html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-family: 'Roboto', sans-serif;
  background-color: white;
}

@media (max-width: 768px) {
  .app {
    padding: 10px;
    max-width: 100%;
  }
}

.app {
  color: #2c3e50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  max-width: 800px;
  background-color: white;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  border-radius: 8px;
  position: relative;
}

.app.night-mode {
  background-color: #2c3e50;
  color: white;
}

h1 {
  font-size: 2.5em;
  color: inherit;
  margin-bottom: 20px;
}

.toggle-container {
  position: absolute;
  top: 20px;
  right: 20px;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.add-expense-section,
.filter-section,
.salary-section,
.expense-table-section {
  margin-bottom: 30px;
  width: 100%;
}

h2 {
  margin-bottom: 15px;
  font-size: 1.5em;
  color: inherit;
  text-align: center;
}

.expense-form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form-group {
  margin-bottom: 10px;
  width: 100%;
}

input,
select {
  width: 100%;
  padding: 10px;
  margin-top: 5px;
  font-size: 1em;
  color: inherit;
  background-color: inherit;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.btn {
  padding: 10px 15px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}

.btn:hover {
  background-color: #2980b9;
}

.expense-table {
  width: 100%;
  border-collapse: collapse;
}

.expense-table-header,
.expense-table-footer {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-weight: bold;
  background-color: #f9f9f9;
  width: 100%;
  text-align: center;
  color: inherit;
}

.app.night-mode .expense-table-header,
.app.night-mode .expense-table-footer {
  background-color: #34495e;
  color: white;
}

.expense-list {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

.expense-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #ccc;
  text-align: center;
}

.expense-table-cell {
  flex: 1;
}

.date-cell {
  text-align: center;
}

.footer-item {
  padding: 10px 0;
  width: 100%;
  text-align: center;
}

.total-container {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  background-color: #f9f9f9;
  border-top: 1px solid #ccc;
  width: 100%;
}

.app.night-mode .total-container {
  background-color: #34495e;
  color: white;
}

.total-container div {
  flex: 1;
  text-align: center;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5em;
  color: inherit;
}

.app.night-mode .toggle-btn {
  color: white;
}

.export-btn {
  margin-top: 20px;
}

</style>

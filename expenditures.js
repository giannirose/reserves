    // Function to format numbers with commas and as integers
    function formatNumberWithCommas(number) {
      return number.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    }

    // Access the json file
    const requestSource = 'data.json';
    const request = new Request(requestSource);

    // Function to fetch and display JSON data
    async function fetchAndDisplayJSON() {
      try {
        // Make the json values available
        const response = await fetch(requestSource);
        const data = await response.json();
        // eaderRow will name 30 years
        const headerRow = document.getElementById('headerRow');
        let currentYear = data.currentYear;

        // Add the first <th> element with the currentYear and a11y feature scope "col"
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = currentYear;
        headerRow.appendChild(th);

        // Add 29 subsequent <th> elements, incrementing the currentYear by one each time
        for (let i = 0; i < 29; i++) {
          currentYear++;
          const th = document.createElement('th');
          th.scope = 'col';
          th.textContent = currentYear;
          headerRow.appendChild(th);
        }

        // Define tbody cells as those below the thead element
        const tableBody = document.getElementById('componentsTable').getElementsByTagName('tbody')[0];

        // Initialize an array to store the sum of each column
        const columnSums = new Array(30).fill(0);

        let lastRow; // Variable to keep track of the last row created

        // Define the json array keywords as category and array items as items
        for (const [category, items] of Object.entries(data)) {
          // Ignore the first listed key/value pairs
          if (category !== 'headline' && category !== 'inflationRate' && category !== 'taxableRate' && category !== 'currentYear' && category !== 'initialAnnualContribution' && category !== 'initialProjectEndingReserves' && category !== 'initialAnnualInterest') {
            // Add a row for the category
            const categoryRow = tableBody.insertRow();
            const categoryCell = document.createElement('th');
            categoryCell.scope = 'row';
            categoryCell.colSpan = 31; // Adjust the colspan to match the number of columns
            categoryCell.textContent = category;
            categoryCell.className = 'category-head';
            categoryRow.appendChild(categoryCell);

            // Add rows for each item in the category- the json arrays
            for (const [key, value] of Object.entries(items)) {
              value.forEach(item => {
                const row = tableBody.insertRow();
                lastRow = row; // Update the last row created
                const cellDescription = document.createElement('th');
                cellDescription.scope = 'row';
                cellDescription.textContent = key;
                row.appendChild(cellDescription);

                for (let i = 0; i < 30; i++) {
                  const year = data.currentYear + i; // Define the progressing years as year
                  const currentYear = data.currentYear;
                  const baseCost = (item['unit-cost'] * item['quantity'] * item['qualifier']) / 100; // Actual current cost of item
                  const inflationRate = data.inflationRate;
                  // const dateInService = item['date-in-service'];
                  // const usefulLife = item['useful-life'];
                  // const adjustment = item['adjustment'];
                  const dateInService = parseInt(item['date-in-service']) || 0;
                  const usefulLife = parseInt(item['useful-life']) || 0;
                  const adjustment = parseInt(item['adjustment']) || 0;
                  const replacementYear = dateInService + usefulLife + adjustment;

                  let fullyFunded = ""; // Initialize fullyFunded to empty by default
                  if ((year - replacementYear) % usefulLife === 0) {
                    fullyFunded = baseCost * Math.pow((1 + inflationRate), (year - currentYear));
                  }

                  const cellFullyFunded = row.insertCell();
                  cellFullyFunded.textContent = formatNumberWithCommas(fullyFunded);

                  if ((year - replacementYear) % usefulLife === 0) {
                    cellFullyFunded.classList.add('ff-cell-color'); // Add the CSS class
                  }

                  // Calculate the column totals based on the condition
                  if ((year - replacementYear) % usefulLife === 0) {
                    columnSums[i] += parseFloat(cellFullyFunded.textContent.replace(/,/g, ''));
                  }
                }
              });
            }
          }
        }

        // Add the class "last-row" to the last row created
        if (lastRow) {
          lastRow.classList.add('last-row');
        }

        // Calculate the total sums for cells that meet the condition ((year - replacementYear) % usefulLife === 0)
        const totalRow = document.createElement('tr');
        totalRow.id = 'totalRow';
        const totalCell = document.createElement('th');
        totalCell.scope = 'row';
        totalCell.textContent = 'Total';
        totalRow.appendChild(totalCell);

        for (let i = 0; i < 30; i++) {
          const cellTotal = totalRow.insertCell();
          cellTotal.textContent = formatNumberWithCommas(columnSums[i]);
        }

        // Append the total row to the last row created
        if (lastRow) {
          lastRow.parentNode.insertBefore(totalRow, lastRow.nextSibling);
        }

      } catch (error) {
        console.error('Error fetching or displaying JSON data:', error);
      }
    }

    // Call the function to fetch and display JSON data
    fetchAndDisplayJSON();
// Function to format numbers with commas and as integers
function formatNumberWithCommas(number) {
  return number.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function formatPercentages(number) {
  return number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + '%'; // Add percentage sign
}

const requestSource = 'data.json';
const requestYearly = 'yearData.json';
const requestInterest = 'yearInterest.json';
const request = new Request(requestSource);
const requestYear = new Request(requestYearly);
const requestInterestFile = new Request(requestInterest);

// Function to fetch and display JSON data
async function fetchAndDisplayJSON() {
  try {
    // Make the json values available
    const [response, yearResponse, interestResponse] = await Promise.all([
      fetch(requestSource),
      fetch(requestYearly),
      fetch(requestInterestFile)
    ]);

    const data = await response.json();
    const yearData = await yearResponse.json();
    const yearInterest = await interestResponse.json();

    // Define tbody cells as those below the thead element
    const tableBody = document.getElementById('componentsTable').getElementsByTagName('tbody')[0];
    let lastRow; // Variable to keep track of the last row created

    // Initialize total currentCost, totalFullyFunded, and an array to store the sum of each column
    let totalCurrentCost = 0;
    let totalFullyFunded = 0;
    let annualContribution = yearData.yearByYearAnnualContribution['2025'] || data.initialAnnualContribution;
    let annualInterest = yearInterest.yearByYearInterest['2025'] || data.initialAnnualInterest;
    let annualExpenditure = 0;
    let endingReserves = 0;
    let interestEarned = 0;
    let percentFunded = 0;
    let previousAnnualContribution = annualContribution;
    let previousAnnualInterest = annualInterest;

    const columnSums = new Array(30).fill(0);

    // Loop through the years and calculate total currentCost and fullyFunded
    for (let i = 0; i < 31; i++) {
      const year = (data.currentYear - 1) + i;
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = year;
      tr.appendChild(th);

      // Initialize total adjusted cost and total fully funded cost for the year
      let totalAdjustedCost = 0;
      let fullyFunded = 0;
      let totalFullyFundedForYear = 0;
      let totalAnnualExpenditure = 0;
      let yearInterestEarned = 0;
      let contributionChange = '';
      let forcedAnnualContribution = '';
      let forcedAnnualInterest = '';

      for (const [category, items] of Object.entries(data)) {
        // Ignore the first listed key/value pairs
        if (category !== 'headline' && category !== 'inflationRate' && category !== 'taxableRate' && category !== 'currentYear') {
          for (const [key, value] of Object.entries(items)) {
            value.forEach(item => {
              const currentCost = (item['unit-cost'] * item['quantity'] * item['qualifier']) / 100; // Actual current cost of item
              const inflationRate = data.inflationRate;
              const adjustedCost = currentCost * ((1 + inflationRate) ** (year - data.currentYear)); // Formula increases current year by inflation rate per year
              totalAdjustedCost += adjustedCost;

              // Calculate fully funded cost
              const usefulLife = parseInt(item['useful-life']) || 0;
              const adjustment = parseInt(item['adjustment']) || 0;
              const dateInService = parseInt(item['date-in-service']) || 0;
              const replacementYear = dateInService + usefulLife + adjustment;
               let fullyFunded;
              if ((year - replacementYear) % usefulLife === 0) {
                fullyFunded = currentCost * Math.pow((1 + inflationRate), (year - data.currentYear));
              } else {
                fullyFunded = (currentCost * Math.pow((1 + inflationRate), (year - data.currentYear)) * ((year + usefulLife - replacementYear) % usefulLife)) / usefulLife;
              }
        
              totalFullyFundedForYear += fullyFunded;


              // Calculate Annual Contribution
              const currentYear = data.currentYear;
              const taxableRate = data.taxableRate;

              // Check if a forced annual contribution exists for this year
              if (yearData.yearByYearAnnualContribution && yearData.yearByYearAnnualContribution[year]) {
                annualContribution = yearData.yearByYearAnnualContribution[year];
                forcedAnnualContribution = annualContribution;
               // console.log(yearByYearAnnualContribution[year]);
              } else if (i > 0) {
                annualContribution = previousAnnualContribution * (1 + inflationRate);
              }

              // Calculate Annual Expenditure
              if ((year - replacementYear) % usefulLife === 0) {
                annualExpenditure = currentCost * Math.pow((1 + inflationRate), (year - currentYear));
                totalAnnualExpenditure += annualExpenditure;
               // console.log(annualExpenditure)
              }

              // Calculate Project Ending Reserves
              if (i === 0) {
                // For the first year, use the initial reserves
                endingReserves = data.initialProjectEndingReserves;
              } else {
                const previousEndingReserves = parseFloat(tableBody.querySelector(`tr:nth-child(${i}) td:nth-child(7)`).textContent.replace(/,/g, '') || 0);
              
                // Calculate Annual Interest                
                const yearAnnualExpenditure = parseFloat(tableBody.querySelector(`tr:nth-child(${i}) td:nth-child(5)`).textContent.replace(/,/g, '') || 0);
                if (yearInterest.yearByYearInterest && yearInterest.yearByYearInterest[year]) {
                  yearInterestEarned = yearInterest.yearByYearInterest[year];
                } else {
                  // While I believe (1 - taxableRate is correct), I use taxableRate alone for better results
                  yearInterestEarned = inflationRate * (taxableRate) * (previousEndingReserves + (0.5 * (annualContribution - yearAnnualExpenditure)));
                  // Ensure the yearly interest is not negative
                  yearInterestEarned = Math.max(0, yearInterestEarned);
                  console.log(yearAnnualExpenditure);
                }
              }
              
              // Calculate Percent Funded
              percentFunded = endingReserves / totalFullyFundedForYear;

              // Calculate Contribution % Change
              if (i > 0) {
                contributionChange = (annualContribution / previousAnnualContribution - 1) * 100;
              }
            });
          }
        }
      }

      // Add currentCost to the second column, except for the first entry
      const tdCurrentCost = document.createElement('td');
      tdCurrentCost.textContent = (i === 0) ? '' : formatNumberWithCommas(totalAdjustedCost);
      tr.appendChild(tdCurrentCost);

      // Add fully funded cost to the third column
      const tdFullyFunded = document.createElement('td');
      tdFullyFunded.textContent = (i === 0) ? '' : formatNumberWithCommas(totalFullyFundedForYear);
      tr.appendChild(tdFullyFunded);

      // Add Annual Contribution to the fourth column
      const tdAnnualContribution = document.createElement('td');
      tdAnnualContribution.textContent = (i === 0) ? '' : formatNumberWithCommas(annualContribution);
      tr.appendChild(tdAnnualContribution);

      // Add Annual Expenditure to the fifth column
      const tdAnnualExpenditure = document.createElement('td');
      tdAnnualExpenditure.textContent = (i === 0) ? '' : formatNumberWithCommas(totalAnnualExpenditure);
      tr.appendChild(tdAnnualExpenditure);

      // Add Annual Interest to the sixth column
      const tdInterestEarned = document.createElement('td');
      // tdInterestEarned.textContent = isNaN(yearInterestEarned) ? '0' : formatNumberWithCommas(yearInterestEarned);
      tdInterestEarned.textContent = (i === 0) ? '' : formatNumberWithCommas(yearInterestEarned);
      tr.appendChild(tdInterestEarned);

      // Add the Project Ending Reserves to the respective column
      if (i === 0) {
        const initialReserves = data.initialProjectEndingReserves;
        endingReserves = initialReserves;
        const tdEndingReserves = document.createElement('td');
        tdEndingReserves.textContent = formatNumberWithCommas(initialReserves);
        tr.appendChild(tdEndingReserves);
      } else {
        endingReserves += annualContribution + yearInterestEarned - totalAnnualExpenditure;
        const tdEndingReserves = document.createElement('td');
        tdEndingReserves.textContent = formatNumberWithCommas(endingReserves);
        tr.appendChild(tdEndingReserves);
      }

      // Add the Percent Funded to the respective column
      const tdPercentFunded = document.createElement('td');
      tdPercentFunded.textContent = (i === 0) ? '' : formatPercentages(percentFunded * 100);
      tr.appendChild(tdPercentFunded);

      // Add Contribution % Change to the respective column
      const tdContributionChange = document.createElement('td');
      tdContributionChange.textContent = (i === 0) ? '' : formatPercentages(contributionChange);
      tr.appendChild(tdContributionChange);

      // Add Force Annual Contribution to the respective column
      const tdForceAnnualContribution = document.createElement('td');
      tdForceAnnualContribution.textContent = forcedAnnualContribution ? formatNumberWithCommas(forcedAnnualContribution) : '';
      tr.appendChild(tdForceAnnualContribution);

            // Add Annual Interest to the sixth column
            const tdForceInterestEarned = document.createElement('td');
            tdForceInterestEarned.textContent = (i === 0) ? '' : formatNumberWithCommas(yearInterestEarned);
            tr.appendChild(tdForceInterestEarned);

      // Update previous annual contribution for the next iteration
      previousAnnualContribution = annualContribution;

            // Update previous annual contribution for the next iteration
            previousAnnualInterest = annualInterest;

      tableBody.appendChild(tr); // Append the row to the table body
    }

  } catch (error) {
    console.error('Error fetching or displaying JSON data:', error);
  }
}

// Call the function to fetch and display JSON data
fetchAndDisplayJSON();
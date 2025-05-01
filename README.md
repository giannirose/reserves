# reserves
Create a reserves study calculator- a 30-year reserves study typical for an HOA
## JSON Files
There is one key .json file for the calculator- the data.json file.

This file has a few global parameters up top, and then the individual categories, in which are listed the arrays of information for each item.
### yearData and yearInterest json files
In addition, there is the yearData.json file and the yearInterest.json file.

These enable the entering of HOA Contributions (Dues) for a given year. On the cash flow page, there is also the option of using a percent increase, for instance, to set the contributions. An amount entered in the yearData.json file will take precedence and set the contributions on the cash flow page to the amount entered in the file.

Likewise, amounts entered in the yearInterest.json file will take precedence over the formula used to typically calculate interest. I have seen various reserves studies that use different calculations and so wanted to leave this option for an organization to enter calculations from a prefered method.
## Javascript .js files
The javascript files retrieve data from the .json files and then perform calculations and looping to render the amounts on the page.
## HTML .html files
The .html files render the typical pages of a reserves study:
- Categorized Components
- Current Cost
- Fully Funded
- Expenditures
- Cash Flow

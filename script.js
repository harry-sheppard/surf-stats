var originalData = []; // Store the original data globally
var myChart = null;    // Store the chart instance globally
var selectedGraph = 0; // Track the currently selected graph

document.getElementById('fileInput').addEventListener('change', function(event) {
	var file = event.target.files[0];
    
     console.log("File selected");
    
    if (file) {
        var fileName = file.name;
        // Check if the file name ends with '.csv' (case insensitive)
        if (!fileName.toLowerCase().endsWith('.csv')) {
            alert('Please upload a valid CSV file.');
            // Optionally clear the input field
            event.target.value = "";
            return;
        }
        
        console.log("Valid file uploaded");
        // Parse CSV rows/columns into data objects
        convertData(file);
    }
});

function convertData(file) {
    var reader = new FileReader();

    reader.onload = function(e) {
        var content = e.target.result;

        // Parse CSV into rows and columns
        var rows = content.split('\n').map(function(row) {
            return row.split(',');
        });

        // Filter out empty rows
        rows = rows.filter(function(row) {
            return row.some(function(cell) {
                return cell.trim() !== "";
            });
        });

		// Convert rows (skipping header) into objects.
        //  - For key 'Year': extract the year from the date string.
        //  - For key 'MHeight1': convert to number.
        //  - For key 'Time': convert to Date.
        //  - For key 'Height0': convert to number.
        //const keys = ['Year', 'MHeight1', 'Time', 'Height0', 'MHeight2', 'lati', 'longi', 'MHeight3'];
		const keys = ['Time', 'Height0', 'Year', 'MHeight1', 'MHeight2', 'FitCoefficients', 'lati', 'longi', 'MHeight3']
        
        // Convert rows (skipping header) into objects.
        const data = rows.slice(1).map(row => {
            return Object.fromEntries(
                keys.map((key, i) => {
                    // Safeguard: if the cell doesn't exist, use an empty string
                    const cell = row[i] || "";
                    const trimmed = cell.trim();
                    if (key === 'Time') {
                        // For column 'Time', convert to Date
                        return [key, new Date(trimmed)];
                    } else {
                        // For all other columns, convert to a number
                        return [key, parseFloat(trimmed)];
                    }
                })
            );
        }).filter(row => {
            // Optionally, filter out rows with missing values
            return keys.every(key => row[key] !== null && row[key] !== "");
        });
        
        // Store data globally
        originalData = [...data];
        console.log("Data row [1]:", originalData[1]);
		// Compute the min and max wave heights.

        // Show UI controls and hide the file upload button
        document.getElementById("selectorContainer").style.display = "block";
        document.getElementById("fileButton").style.display = "none";
        
        // Setup initial graph and controls
        setupGraph(selectedGraph);
        displayControls(selectedGraph);
    };

    reader.readAsText(file);
}


// Dropdown to select Graph
document.getElementById("graphSelect").addEventListener("change", function() {
    selectedGraph = parseInt(document.getElementById("graphSelect").value);
    setupGraph(selectedGraph);
    displayControls(selectedGraph);
});

// Update graph when date inputs change (GraphID 0)
document.getElementById("minDate").addEventListener("change", function() {
    setupGraph(selectedGraph);
});
document.getElementById("maxDate").addEventListener("change", function() {
    setupGraph(selectedGraph);
});

// Update graph when slider values change (GraphID 1)
document.getElementById("minSlider").addEventListener("input", function() {
	displayMinValue();
    setupGraph(selectedGraph);
});
document.getElementById("maxSlider").addEventListener("input", function() {
	displayMaxValue();
    setupGraph(selectedGraph);
});

function displayMinValue() {
	const minValue = document.getElementById("minSlider").value;
    document.getElementById("minSliderOutput").textContent = minValue;
}

function displayMaxValue() {
	const maxValue = document.getElementById("maxSlider").value;
    document.getElementById("maxSliderOutput").textContent = maxValue;
}

// Show/hide controls based on the selected graph.
function displayControls(graphID) {
    console.log("displayControls", true);
    if (graphID === 0) {
        document.getElementById("dateRangeContainer").style.display = "block";
        document.getElementById("slidersContainer").style.display = "none";
    } else if (graphID === 1) {
        document.getElementById("dateRangeContainer").style.display = "none";
        document.getElementById("slidersContainer").style.display = "block";
		displayMinValue();
		displayMaxValue();
    } else {
        document.getElementById("dateRangeContainer").style.display = "none";
        document.getElementById("slidersContainer").style.display = "none";
    }
}
    
function setupGraph(selectedID) {
    console.log("Setting up graph with ID:", selectedID);
	
	let container_width, container_height;
    if (selectedID === 0) {
        document.getElementById("chartContainer").style.width = "1000px";
		document.getElementById("chartContainer").style.height = "600px";
		document.getElementById("colourbar").style.display = "none";
		
    } else if (selectedID === 1 || selectedID === 2) {
        document.getElementById("chartContainer").style.width = "900px";
		document.getElementById("chartContainer").style.height = "600px";
		document.getElementById("colourbar").style.display = "none";
		
    } else if (selectedID === 3) {
		document.getElementById("chartContainer").style.width = "575px";
		document.getElementById("chartContainer").style.height = "750px";
		document.getElementById("colourbar").style.display = "inline-block";
		
    }
	document.getElementById("chartContainer").style.margin = "0 auto";
	
    
    const minValue = getMin(selectedID);
    const maxValue = getMax(selectedID);
    const dataToDisplay = toRange(originalData, selectedID, minValue, maxValue);
    const newConfig = configureGraph(selectedID, dataToDisplay);

    // Update the existing chart if possible, otherwise create a new chart
    if (myChart && myChart.config.type === newConfig.type) {
        myChart.data = newConfig.data;
        myChart.options = newConfig.options;
        myChart.update();
		myChart.resize();
    } else {
        if (myChart) {
            myChart.destroy();
        }
        const ctx = document.getElementById("myChart").getContext('2d');
        myChart = new Chart(ctx, newConfig);

		document.getElementById("myChart").style.display = "block";
    }
	myChart.resize();
	
}
    
function getMin(graphID) {
    if (graphID === 0) {
         const minVal = document.getElementById("minDate").value;
         return minVal ? new Date(minVal) : new Date(-8640000000000000);
    } else if (graphID === 1) {
         const minVal = document.getElementById("minSlider").value;
         return minVal ? parseFloat(minVal) : -Infinity;
    } else if (graphID === 2) {
         return 0;
    } else if (graphID === 3) {
         return 0;
    }
}

function getMax(graphID) {
    if (graphID === 0) {
         const maxVal = document.getElementById("maxDate").value;
         return maxVal ? new Date(maxVal) : new Date(8640000000000000);
    } else if (graphID === 1) {
         const maxVal = document.getElementById("maxSlider").value;
         return maxVal ? parseFloat(maxVal) : Infinity;
    } else if (graphID === 2) {
         return Infinity;
    } else if (graphID === 3) {
         return Infinity;
    }
}

function toRange(data, graphID, min, max) { 

	if (graphID === 2) {
        // Ignore x filtering altogether - data is static and needs none
        return data.map(point => ({
            y: point.MHeight2,
			fit: point.FitCoefficients
        }));
    }

    let xColumn, yColumn;
    if (graphID === 0) {
        xColumn = 'Time';
        yColumn = 'Height0';
    } else if (graphID === 1) {
        xColumn = 'Year';
        yColumn = 'MHeight1';
    } else if (graphID === 3) {
        xColumn = 'lati';
        yColumn = 'longi';
		height = 'MHeight3'
    } else {
        console.log("Unexpected Graph ID", graphID);
    }
    
	const filteredData = data.filter(point => point[xColumn] >= min && point[xColumn] <= max);
    
    if (graphID === 3) {
        // Assuming each data point has a property 'MHeight3'
        let minWave = 0 //Math.min(...filteredData.map(d => d.MHeight3));
        let maxWave = 22.6 //Math.max(...filteredData.map(d => d.MHeight3));
        let colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, 6]);
        
        // Map the filtered data to include a 'colour' property based on MHeight3
		return filteredData.map(point => ({
			x: point[xColumn],
			y: point[yColumn],

			MHeight3: point.MHeight3,
			colour: colorScale(point.MHeight3)
		}));
	} else {
        return filteredData.map(point => ({
            x: point[xColumn],
            y: point[yColumn],
            colour: 0
        }));
    }
}


        

function configureGraph(graphID, dataToDisplay) {
	
    if (graphID === 0) {    
        return {
            type: "scatter",
            data: {
                datasets: [
                    {
                        label: 'Heights',
                        data: dataToDisplay,
                        backgroundColor: "rgb(75, 140, 192)",
						radius: 2,
						hitRadius: -1						
                    }
                ]
            },
            options: {
				maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'day' },
						title: {
							display: true,
							align: 'center',
							text: 'Time',
							font: {
								size: 14,
								weight: 'bold',
							  },
						}
                    },
					y: {
                        min: 0,
						max: 11,
						title: {
							display: true,
							align: 'center',
							text: 'Wave Height (m)',
							font: {
								size: 14,
								weight: 'bold',
							  },
						}
					}
                }
            }
        };
    } else if (graphID === 1) {
        return {
            type: "bar",
            data: {
                labels: dataToDisplay.map(point => point.x), // Years
                datasets: [
                    {
                        label: 'Mean Height per Year',
                        data: dataToDisplay.map(point => point.y), //Heights at those Years
                        backgroundColor: "rgba(30, 75, 192, 0.7)",
						borderColor: "rgba(30, 110, 192, 1)",
                        barThickness: "flex"
                    }
                ]
            },
            options: {
				maintainAspectRatio: false,
				scales: {
                    x: {
						title: {
							display: true,
							align: 'center',
							text: 'Year',
							font: {
								size: 14,
								weight: 'bold',
							  },
						}
                    },
					y: {
						title: {
							display: true,
							align: 'center',
							text: 'Mean Wave Height (m)',
							font: {
								size: 14,
								weight: 'bold',
							  },
						}
					}
                }
			}
        };
    } else if (graphID === 2) {
		
		labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		const sineData = labels.map((label, index) => {
			// FITTED SINE PARAMETERS
			return 2.395404338373839 + 0.9182211868355915*Math.cos(2*Math.PI*0.08288835710777323*index + 0.11913255797545985)
		});
		
		return {
			type: "line",
			data: {
				labels: labels,
				datasets: [
					{
						label: 'Mean Height',
						data: dataToDisplay.map(point => point.y), // Heights per month
						backgroundColor: "rgba(30, 90, 192, 1)",
						borderColor: "rgba(30, 110, 192, 0.1)",
						fill: false,
					},
					{
						label: 'Fitted Sine',
						data: sineData, // Precomputed sine values
						borderColor: "rgb(10, 192, 192)",
						fill: true,
						pointRadius: 0,  // Optionally remove the points
					}
				]
			},
			options: {
				maintainAspectRatio: false,
				scales: {
					x: {
						title: {
							display: true,
							align: 'center',
							text: 'Month',
							font: {
								size: 14,
								weight: 'bold',
							  },
						}
					},
                    y: {
                        min: 0,
						max: 4,
						title: {
							display: true,
							align: 'center',
							text: 'Mean Wave Height (m)',
							font: {
								size: 14,
								weight: 'bold',
							  },
						}

					}
				}
			}
		}; 
	} else if (graphID === 3) {
		return {
			type: "scatter",
			data: {
				datasets: [
					{
						label: 'Height At Lat/Long',
						data: dataToDisplay.map(point => ({
						  x: point.y,
						  y: point.x,
						  MHeight3: point.MHeight3
						})),
						backgroundColor: dataToDisplay.map(point => point.colour),
						pointStyle: 'rect',
						radius: 2.8,
						hitRadius: 1
					}
				]
			},
			options: {
				maintainAspectRatio: false,
				plugins: {
					tooltip: {
					  callbacks: {
						label: function(context) {
						  return 'Height: ' + context.raw.MHeight3;
							}
						}
					}
				},
				scales: {
					y: {
                        min: 42,
						max: 57,
						title: {
							display: true,
							align: 'center',
							text: 'Latitude',
							font: {
								size: 14,
								weight: 'bold',
							  }
						},
						ticks: {
							callback: function (value, index, ticks) {
								return value.toLocaleString() + String.fromCharCode(176, 78);
							},
							stepSize: 1
						},
					},
                    x: {
                        min: -11,
						max: 0,
						title: {
							display: true,
							align: 'center',
							text: 'Longitude',
							font: {
								size: 14,
								weight: 'bold',
							  },
						},
						
						ticks: {
							callback: function (value, index, ticks) {
								return Math.abs(value).toLocaleString() + String.fromCharCode(176, 87);
							},
							stepSize: 1
						}
						
					}
				}
			}
		}; 
	}
}
    
function isDateFormat(value) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/;
    return dateRegex.test(value);
}

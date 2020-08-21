function loadJSON(callback) {

    let xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open("GET", "samples.json", true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}

function init() {
    loadJSON(function(response) {
        const sampleData = JSON.parse(response);

        const dropDown = d3.select("#selDataset");
        dropDown.selectAll("option")
            .data(sampleData.names)
            .enter()
            .append("option")
            .text(d => d)
            .property("value", d => d);

        optionChanged(dropDown.property("value"));

        d3.select("#selDataset").on("change", optionChanged(dropDown.property("value")));

        // d3.selectAll("#selDataset").on("change", updatePage(sampleData));
        
        
    });
}

function optionChanged(subjectID) {
    console.log(subjectID);
    loadJSON(function(response) {
        const sampleData = JSON.parse(response);
        // const subjectID = d3.select("#selDataset").property("value");
        console.log(subjectID);
        const sampleSelected = sampleData.samples.filter(sample => sample.id === String(subjectID))[0]; // TODO: change this for the dropdown
        // console.log(sample940);
        
        const sampleIndexed = sampleSelected.otu_labels.map(function(otuLabel, index) {
            let sampleObj = {
            otu_id: sampleSelected.otu_ids[index],
            sample_value: sampleSelected.sample_values[index],
            otu_label: otuLabel,
            otu_family: otuLabel.split(";").slice(0, Math.max(otuLabel.split(";").length - 1, 1))
                .reduce((a, b) => a + ", " + b)
        };
            return sampleObj
        });

        // console.log(sampleIndexed[0].otu_family);

        const topTen = sampleIndexed.sort((a, b) => b.sample_value - a.samplevalue).slice(0, 10)
        .sort((a,b) => a.sample_value - b.sample_value);
        // console.log(topTen);

        const trace1 = {
            x: topTen.map(sample => sample.sample_value),
            y: topTen.map(function(sample) {
                let genus = sample.otu_label.split(";");
                return `${sample.otu_id}: ${genus[genus.length-1]}`
            }),
            type: "bar",
            orientation: "h",
            text: topTen.map(sample => sample.otu_label)
        };
        const data1 = [trace1];

        const layout1 = {
            title: `Top 10 Bacteria - Subject ${sampleSelected.id}`,
            xaxis: {
                tickangle: -45
            },
            yaxis: {
                zeroline: false,
                automargin: true
            },
            bargap: 0.05,
            font: {
                size: 9
            }
        };

        Plotly.newPlot("bar1", data1, layout1);

        const otuAggregate = sampleData.samples.map(function(subject) {
            let aggData = []
            // console.log(subject);
            subject.otu_ids.map(function(otu, index) {
                let sampleObj = {otu_id: otu,
                sample_value: subject.sample_values[index],
                otu_label: subject.otu_labels[index],
                otu_family: subject.otu_labels[index].split(";").slice(0, Math.max(subject.otu_labels[index].split(";").length -1, 1))
            };
                aggData = aggData.concat(sampleObj);
                return sampleObj
            });
            // console.log(subjectData);
            // aggData = aggData.concat(subjectData);

            // const distinctOTU = [...new Set(aggData.map(x => x.otu_label))];

            return aggData
        });
        let aggConcat = []
        otuAggregate.map(function(arr) {
            arr.map(function(sample) {
                aggConcat = aggConcat.concat(sample);
            })
        });
        // console.log(aggConcat);
        // console.log(otuAggregate);
        const distinctOTU = [...new Set(aggConcat.map(x => x.otu_label))];
        const otuSums = []
        distinctOTU.map(function(otu) {
            let otuOccur = aggConcat.filter(sample => sample.otu_label === otu)
            let otuValues = otuOccur.map(sample => sample.sample_value);
            let otuSum = otuValues.reduce((a, b) => a+b);
            otuSums.push({otuLabel: otu, sampleValueSum: otuSum, otu_id: otuOccur[0].otu_id});
        });

        const topTenAll = otuSums.sort((a, b) => b.sampleValueSum - a.sampleValueSum).slice(0, 10)
        .sort((a, b) => a.sampleValueSum-b.sampleValueSum) ;
        // console.log(topTenAll);

        const trace2 = {
            x: topTenAll.map(sample => sample.sampleValueSum),
            y: topTenAll.map(function(sample) {
                let genus = sample.otuLabel.split(";");
                return `${sample.otu_id}: ${genus[genus.length-1]}`
            }),
            type: "bar",
            orientation: "h",
            text: topTenAll.map(sample => sample.otuLabel)
        };
        const data2 = [trace2];

        const layout2 = {
            title: "Top 10 Bacteria - All Subjects",
            xaxis: {
                tickangle: -45
            },
            yaxis: {
                zeroline: false,
                automargin: true
            },
            bargap: 0.05,
            font: {
                size: 9
            }
        };

        Plotly.newPlot("bar2", data2, layout2);
        
        const distinctFamily = [...new Set(sampleIndexed.map(x => x.otu_family))];
        const familySums = distinctFamily.map(family => {
            let familyData = sampleIndexed.filter(sample => sample.otu_family === family)
            return {
                otuFamily: family,
                familySum: familyData.map(sample => sample.sample_value).reduce((a, b) => a+b),
            }
        });

        // console.log(familySums);

        const topTenFamily = familySums.sort((a, b) => b.familySum - a.familySum).slice(0, 10);
        
        const trace3 = {
            x: topTenFamily.map(sample => sample.familySum),
            y: topTenFamily.map(sample => sample.otuFamily),
            mode: "markers",
            marker: {
                size: topTenFamily.map(sample => sample.familySum),
                sizemode: "area"
            },
            
        };

        const data3 = [trace3];

        const layout3 = {
            title: `Count of Bacteria by Family - Subject: ${sampleSelected.id}`,
            showlegend: false,
            yaxis: {
                zeroline: false,
                automargin: true
            }
        };

        Plotly.newPlot("bubble", data3, layout3);

        const metaData = sampleData.metadata.filter(sample => sample.id === parseInt(subjectID))[0]; //TODO: change for the dropdown event
        const metaPanel = d3.select("#sample-metadata")
                            .selectAll("p")
                            .data(d3.entries(metaData))
                            .enter()
                            .append("p")
                            .text(d => `${d.key} : ${d.value}`);
    });
    

}


init();

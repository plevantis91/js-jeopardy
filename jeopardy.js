const baseURL = "https://rithm-jeopardy.herokuapp.com/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;
let categories = [];

/** Get NUM_CATEGORIES random category IDs from the API. */
async function getCategoryIds() {
    try {
        const res = await axios.get(`${baseURL}categories`, {
            params: { count: 100 }
        });
        const catIds = res.data.map(cat => cat.id);
        return _.sampleSize(catIds, [n=6]);
    } catch (error) {
        console.error("Error fetching category IDs:", error);
        return [];
    }
}

/** Fetch data for a category given its ID and return it in a structured format. */
async function getCategory(catId) {
    try {
        const response = await axios.get(`${baseURL}category`, {
            params: { id: catId }
        });
        const cat = response.data;
        const randomClues = _.sampleSize(cat.clues, [n=5]).map(c => ({
            question: c.question,
            answer: c.answer,
            showing: null
        }));
        return { title: cat.title, clues: randomClues };
    } catch (error) {
        console.error(`Error fetching data for category ID ${catId}:`, error);
        return null;
    }
}

/** Fill the HTML table with the categories and questions. */
async function fillTable() {
    hideLoadingView();

    // Add row with headers for categories
    let $tr = $("<tr>");
    for (let category of categories) {
        $tr.append($("<th>").text(category.title));
    }
    $("#jeopardy thead").append($tr);

    // Add rows with questions for each category
    $("#jeopardy tbody").empty();
    for (let clueIdx = 0; clueIdx < 5; clueIdx++) {
        let $tr = $("<tr>");
        for (let catIdx = 0; catIdx < 6; catIdx++) {
            $tr.append(
                $("<td>")
                    .attr("id", `${catIdx}-${clueIdx}`)    
            );
        }
        $("#jeopardy tbody").append($tr);
    }
}

/** Handle clicking on a clue: show the question or answer. */
function handleClick(evt) {
    const $tgt = $(evt.target).closest("td");
    const id = $tgt.attr("id");
    const [catIdx, clueIdx] = id.split("-").map(Number);
    const clue = categories[catIdx].clues[clueIdx];

    if (!clue.showing) {
        $tgt.html(clue.question);
        clue.showing = "question";
    } else if (clue.showing === "question") {
        $tgt.html(clue.answer);
        clue.showing = "answer";
        $tgt.addClass("disabled");
    }
}

/** Show the loading view while fetching data. */
function showLoadingView() {
    $('#jeopardy thead').empty();
    $('#jeopardy tbody').empty();
   
    $('#start')
        .addClass('disabled')
        .text('Loading...');
}

/** Hide the loading view after data is fetched. */
function hideLoadingView() {
    $('#start')
        .text('Restart');
    
}

/** Set up and start the game:
 *  - Get random category IDs
 *  - Fetch data for each category
 *  - Create HTML table
 */
async function setupAndStart() {
    if ($("#start").text() === "Loading...") {
        return;
    }

    showLoadingView();

    const catIds = await getCategoryIds();

    categories = [];
    for (let catId of catIds) {
        const category = await getCategory(catId);
        if (category) {
            categories.push(category);
        }
    }

    fillTable();
}

/** On click of start/restart button, set up game. */
$("#start").on("click", setupAndStart);

/** On page load, add event handler for clicking clues. */
$(function() {
    $("#jeopardy").on("click", "td", handleClick);
});

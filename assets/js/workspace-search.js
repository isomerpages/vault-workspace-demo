"use strict";

var RESULTS_PER_PAGE = 10;
var MAX_ADJACENT_PAGE_BTNS = 2;
var MAX_ADJACENT_MOBILE_PAGE_BTNS = 1;
var pageResults = [];
var fieldArray = void 0;
var startIndex = 0;
const WORKSPACE_BASE_URL =
  "https://5lofs0ghs0.execute-api.ap-southeast-1.amazonaws.com";

// ==========================
// UI creation helper methods
// ==========================
const generateNoResultsFound = () => "<center>No results found</center>";

const generateResultsFound = (rows, fields) => {
  const TABLE_START = '<div><table class="table-h">';
  const TABLE_END = "</table></div>";

  const resultString =
    TABLE_START +
    generateTableHeader(fields) +
    generateTableBody(rows, fields) +
    TABLE_END;

  return DOMPurify.sanitize(resultString);
};

const generateTableHeader = (fields) => {
  let tableHeaderResultString;
  const TABLE_HEADER_ROW_START = "<tr>";
  const TABLE_HEADER_ROW_END = "</tr>";
  const TABLE_HEADER_CELL_START = '<td><h6 class="margin--none"><b>';
  const TABLE_HEADER_CELL_END = "</b></h6></td>";

  tableHeaderResultString = TABLE_HEADER_ROW_START;
  for (const field of fields) {
    tableHeaderResultString +=
      TABLE_HEADER_CELL_START + field.toUpperCase() + TABLE_HEADER_CELL_END;
  }
  tableHeaderResultString += TABLE_HEADER_ROW_END;
  return tableHeaderResultString;
};

const generateTableBody = (rows, fields) => {
  let tableBodyResultString;
  const TABLE_BODY_ROW_START = "<tr>";
  const TABLE_BODY_ROW_END = "</tr>";
  const TABLE_BODY_CELL_START = '<td><h6 class="margin--none">';
  const TABLE_BODY_CELL_END = "</h6></td>";
  for (const row of rows) {
    tableBodyResultString += TABLE_BODY_ROW_START;
    for (const field of fields) {
      tableBodyResultString +=
        TABLE_BODY_CELL_START + row[field] + TABLE_BODY_CELL_END;
    }
    tableBodyResultString += TABLE_BODY_ROW_END;
  }

  return tableBodyResultString;
};

const generateSearchResultsComponent = (rows, fields) => {
  document.getElementsByClassName("content")[0].innerHTML =
    !rows || rows.length === 0
      ? generateNoResultsFound()
      : generateResultsFound(rows, fields);
  document.getElementsByClassName("content")[0].style.display = "block";
};

// ==========================
// API query methods
// ==========================

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");

  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");

    if (pair[0] === variable) {
      var dirtyString = decodeURIComponent(pair[1].replace(/\+/g, "%20"));
      return DOMPurify.sanitize(dirtyString, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });
    }
  }
}

function databaseSearch(searchUrl, index) {
  const request = $.ajax({
    url: searchUrl,
    dataType: "json",
  });

  request
    .done(function (data) {
      const { rows, fields } = data;
      document.getElementById("loading-spinner").style.display = "none";
      hideAllPostsAndPagination();

      workspaceTotal = rows.length;
      generateSearchResultsComponent(rows, fields);
      if (!rows || rows.length <= 1) return;
      displayPagination(index);
    })
    .fail(function () {
      // Displays no results if the AJAX call fails
      document.getElementById("loading-spinner").style.display = "none";
      hideAllPostsAndPagination();
      generateSearchResultsComponent(null, []);
    });
}

var workspaceOffset = 0;
// The workspace API only retrieves 100 rows at a go.
// If users want to view more than 100 rows, we need to call the
// API with an offset to obtain the right slice of data.

var workspaceTotal = void 0; // The total number of rows of data in the workspace API

var currentPageIndex = 0;

var searchTerm = getQueryVariable("query");
if (!searchTerm || searchTerm === " ") {
  searchTerm = "";
} else {
  document.getElementById("search-box-workspace").value = searchTerm;
}

const resourceId = document.getElementById("resourceId").innerHTML;
const COL_NAME = "uen";

let searchUrl = `${WORKSPACE_BASE_URL}/tables/${resourceId}`;

if (searchTerm) {
  // TODO: Specify the column to be searched without hardcoding
  searchUrl =
    searchUrl +
    `?filter%5B0%5D%5BcolumnAlias%5D=${COL_NAME}&filter%5B0%5D%5Btype%5D=ILIKE&filter` +
    `%5B0%5D%5Bvalue%5D=${searchTerm}`;
}

databaseSearch(searchUrl, startIndex);

function hideAllPostsAndPagination() {
  var paginationElement = document.getElementById("paginator-pages");
  while (paginationElement.firstChild) {
    paginationElement.removeChild(paginationElement.firstChild);
  }

  document.querySelector(".pagination").style.display = "none";
}
